import type { NextRequest } from "next/server";
import { siteConfig } from "@/data/site";
import { getAppsScriptUrl, getWebhookSecret } from "@/lib/bookingServerConfig";
import { getTimeZoneWallParts } from "@/lib/bookingSlots";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TZ_RE = /^[A-Za-z0-9_+-]+(\/[A-Za-z0-9_+-]+)*$/;
const ALLOWED_DURATIONS = new Set<number>(siteConfig.booking.durations);
const SEC_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

const RATE_BUCKETS = new Map<string, number[]>();
const MAX_RATE_KEYS = 2000;

interface AvailabilityCacheEntry {
  fetchedAtMs: number;
  fromMs: number;
  toMs: number;
  busy: Array<{ start: string; end: string }>;
}

const AVAILABILITY_CACHE_TTL_MS = 15_000;
const AVAILABILITY_CACHE = new Map<string, AvailabilityCacheEntry>();

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: SEC_HEADERS });
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number
): boolean {
  const cutoff = nowMs - windowMs;
  if (RATE_BUCKETS.size > MAX_RATE_KEYS) {
    for (const [k, stamps] of RATE_BUCKETS) {
      if (stamps.length === 0 || stamps[stamps.length - 1] <= cutoff) {
        RATE_BUCKETS.delete(k);
      }
    }
  }

  const prev = RATE_BUCKETS.get(key) || [];
  const active = prev.filter((ts) => ts > cutoff);
  if (active.length >= limit) {
    RATE_BUCKETS.set(key, active);
    return false;
  }
  active.push(nowMs);
  RATE_BUCKETS.set(key, active);
  return true;
}

function isSameOriginPost(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite.toLowerCase() === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const expectedHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  try {
    return new URL(origin).host.toLowerCase() === expectedHost;
  } catch {
    return false;
  }
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, "")
    .trim();
}

export async function GET(request: NextRequest) {
  // Read searchParams immediately so Next.js treats this GET route as request-time dynamic under cacheComponents.
  const searchParams = request.nextUrl.searchParams;
  const nowMs = Date.now();
  const clientIp = getClientIp(request);

  if (!consumeRateLimit(`get:${clientIp}`, 30, 60_000, nowMs)) {
    return jsonResponse(
      { ok: false, error: "Too many availability checks. Please slow down." },
      429
    );
  }

  const defaultFromIso = new Date(nowMs - 3_600_000).toISOString();
  const defaultToIso = new Date(
    nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ).toISOString();

  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");

  const fromMs = rawFrom ? Date.parse(rawFrom) : Date.parse(defaultFromIso);
  const toMs = rawTo ? Date.parse(rawTo) : Date.parse(defaultToIso);

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return jsonResponse(
      { ok: false, error: "Invalid availability time range." },
      400
    );
  }

  const clampedToMs = Math.min(toMs, fromMs + 62 * 86_400_000);

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return jsonResponse({ ok: true, configured: false, busy: [] });
  }

  const cached = AVAILABILITY_CACHE.get(scriptUrl);
  if (
    cached &&
    nowMs - cached.fetchedAtMs < AVAILABILITY_CACHE_TTL_MS &&
    cached.fromMs <= fromMs &&
    cached.toMs >= clampedToMs
  ) {
    return jsonResponse({ ok: true, configured: true, busy: cached.busy });
  }

  // Pad upstream end by 60s so slightly shifted client timestamps within the 15s TTL hit cache
  const upstreamToMs = Math.min(
    fromMs + 62 * 86_400_000,
    clampedToMs + 60_000
  );
  const fromIso = new Date(fromMs).toISOString();
  const toIso = new Date(upstreamToMs).toISOString();

  try {
    const targetUrl = new URL(scriptUrl);
    targetUrl.searchParams.set("action", "availability");
    targetUrl.searchParams.set("timeMin", fromIso);
    targetUrl.searchParams.set("timeMax", toIso);
    const secret = getWebhookSecret();
    if (secret) {
      targetUrl.searchParams.set("secret", secret);
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });

    if (!upstream.ok) {
      return jsonResponse(
        {
          ok: false,
          configured: true,
          error: "Failed to read calendar availability.",
        },
        502
      );
    }

    const data = (await upstream.json()) as {
      ok?: boolean;
      busy?: Array<{ start?: string; end?: string }>;
      error?: string;
    };

    if (data.ok === false) {
      return jsonResponse(
        {
          ok: false,
          configured: true,
          error: data.error || "Calendar bridge returned an error.",
        },
        502
      );
    }

    const busy = Array.isArray(data.busy)
      ? data.busy.filter(
          (item): item is { start: string; end: string } =>
            typeof item?.start === "string" && typeof item?.end === "string"
        )
      : [];

    if (AVAILABILITY_CACHE.size > 16) {
      AVAILABILITY_CACHE.clear();
    }
    AVAILABILITY_CACHE.set(scriptUrl, {
      fetchedAtMs: nowMs,
      fromMs,
      toMs: upstreamToMs,
      busy,
    });

    return jsonResponse({ ok: true, configured: true, busy });
  } catch {
    return jsonResponse(
      { ok: false, configured: true, error: "Unable to reach Google Calendar." },
      502
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return jsonResponse(
      { ok: false, code: "FORBIDDEN", error: "Invalid request origin." },
      403
    );
  }

  const nowMs = Date.now();
  const clientIp = getClientIp(request);
  if (!consumeRateLimit(`post-ip:${clientIp}`, 5, 900_000, nowMs)) {
    return jsonResponse(
      {
        ok: false,
        code: "RATE_LIMITED",
        error: "Too many booking attempts. Please wait a few minutes.",
      },
      429
    );
  }

  let body: {
    name?: unknown;
    email?: unknown;
    notes?: unknown;
    website?: unknown;
    startIso?: unknown;
    endIso?: unknown;
    durationMinutes?: unknown;
    visitorTimeZone?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse(
      { ok: false, code: "INVALID_JSON", error: "Invalid request payload." },
      400
    );
  }

  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return jsonResponse(
      { ok: false, code: "INVALID_REQUEST", error: "Unable to process request." },
      400
    );
  }

  const name = sanitizeText(body.name);
  const email = sanitizeText(body.email);
  const notes = sanitizeText(body.notes);
  const startIso = typeof body.startIso === "string" ? body.startIso.trim() : "";
  const endIso = typeof body.endIso === "string" ? body.endIso.trim() : "";
  const durationMinutes =
    typeof body.durationMinutes === "number" ? body.durationMinutes : NaN;
  const rawTz =
    typeof body.visitorTimeZone === "string"
      ? body.visitorTimeZone.trim().slice(0, 64)
      : "";
  const visitorTimeZone =
    rawTz && TZ_RE.test(rawTz) ? rawTz : siteConfig.booking.timezoneIana;

  if (name.length < 2 || name.length > 80) {
    return jsonResponse(
      { ok: false, code: "INVALID_NAME", error: "Please enter your full name." },
      400
    );
  }

  if (!EMAIL_RE.test(email) || email.length > 120) {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_EMAIL",
        error: "Please enter a valid email address.",
      },
      400
    );
  }

  if (!consumeRateLimit(`post-email:${email.toLowerCase()}`, 3, 3_600_000, nowMs)) {
    return jsonResponse(
      {
        ok: false,
        code: "RATE_LIMITED",
        error: "Booking limit reached for this email. Try again later.",
      },
      429
    );
  }

  if (notes.length > 600) {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_NOTES",
        error: "Project notes must be 600 characters or fewer.",
      },
      400
    );
  }

  if (!ALLOWED_DURATIONS.has(durationMinutes)) {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_DURATION",
        error: "Duration must be 30, 45, or 60 minutes.",
      },
      400
    );
  }

  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);

  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs - startMs !== durationMinutes * 60_000
  ) {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_SLOT",
        error: "Selected meeting time is invalid.",
      },
      400
    );
  }

  if (
    startMs < nowMs + 10 * 60_000 ||
    startMs > nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ) {
    return jsonResponse(
      {
        ok: false,
        code: "OUT_OF_WINDOW",
        error: "Please choose an upcoming date within the booking window.",
      },
      400
    );
  }

  const cairoStart = getTimeZoneWallParts(
    startMs,
    siteConfig.booking.timezoneIana
  );
  const cairoEnd = getTimeZoneWallParts(
    endMs - 1000,
    siteConfig.booking.timezoneIana
  );
  const startMinutes = cairoStart.hour * 60 + cairoStart.minute;

  if (
    cairoStart.year !== cairoEnd.year ||
    cairoStart.month !== cairoEnd.month ||
    cairoStart.day !== cairoEnd.day ||
    startMinutes < siteConfig.booking.startHour * 60 ||
    startMinutes + durationMinutes > siteConfig.booking.endHour * 60 ||
    startMinutes % siteConfig.booking.slotStepMinutes !== 0
  ) {
    return jsonResponse(
      {
        ok: false,
        code: "OUTSIDE_HOURS",
        error:
          "Selected slot is outside Cairo booking hours (10:00 AM – 10:00 PM).",
      },
      400
    );
  }

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return jsonResponse(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        error:
          "Google Meet calendar bridge is not connected yet. Add GOOGLE_APPS_SCRIPT_URL to activate live bookings.",
      },
      503
    );
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        action: "book",
        secret: getWebhookSecret(),
        name,
        email,
        notes,
        startIso: new Date(startMs).toISOString(),
        endIso: new Date(endMs).toISOString(),
        durationMinutes,
        visitorTimeZone,
      }),
    });

    const data = (await upstream.json()) as {
      ok?: boolean;
      code?: string;
      error?: string;
      meetLink?: string;
      htmlLink?: string;
      eventId?: string;
    };

    if (data.code === "SLOT_TAKEN") {
      AVAILABILITY_CACHE.delete(scriptUrl);
      return jsonResponse(
        {
          ok: false,
          code: "SLOT_TAKEN",
          error:
            "This time slot was just booked. Please pick another available time.",
        },
        409
      );
    }

    if (!upstream.ok || !data.ok) {
      return jsonResponse(
        {
          ok: false,
          code: data.code || "UPSTREAM_ERROR",
          error:
            data.error ||
            "Could not schedule the Google Meet right now. Please try again.",
        },
        502
      );
    }

    AVAILABILITY_CACHE.delete(scriptUrl);

    return jsonResponse({
      ok: true,
      meetLink: data.meetLink || "",
      htmlLink: data.htmlLink || "",
      eventId: data.eventId || "",
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        code: "NETWORK_ERROR",
        error: "Unable to reach Google Calendar right now. Please try again.",
      },
      502
    );
  }
}
