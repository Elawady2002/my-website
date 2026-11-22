import type { NextRequest } from "next/server";
import { siteConfig } from "@/data/site";
import {
  apiError,
  consumeRateLimit,
  getClientIp,
  isAllowedGetRequest,
  isSameOriginPost,
  jsonResponse,
  readBoundedJson,
  resolveSafeTimeZone,
  sanitizeNotes,
  sanitizeSingleLine,
  sanitizeUpstreamUrl,
} from "@/lib/bookingApiSecurity";
import { getAppsScriptUrl, getWebhookSecret } from "@/lib/bookingServerConfig";
import {
  addDaysToCalendarDate,
  getTimeZoneWallParts,
  wallTimeToUtcMs,
} from "@/lib/bookingSlots";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DURATIONS = new Set<number>(siteConfig.booking.durations);
const MAX_POST_BYTES = 4096;
const AVAILABILITY_CACHE_TTL_MS = 15_000;
const ALLOWED_MEET_HOSTS = new Set(["meet.google.com"]);
const ALLOWED_CALENDAR_HOSTS = new Set([
  "calendar.google.com",
  "www.google.com",
]);

interface AvailabilityCacheEntry {
  fetchedAtMs: number;
  fromMs: number;
  toMs: number;
  busy: Array<{ start: string; end: string }>;
}

const AVAILABILITY_CACHE = new Map<string, AvailabilityCacheEntry>();

function clipBusyToWorkingHours(
  busy: ReadonlyArray<{ start: string; end: string }>,
  rangeStartMs: number,
  rangeEndMs: number
): Array<{ start: string; end: string }> {
  const { startHour, endHour, timezoneIana } = siteConfig.booking;
  const clipped: Array<{ start: string; end: string }> = [];

  for (const item of busy) {
    const bStart = Date.parse(item.start);
    const bEnd = Date.parse(item.end);
    if (!Number.isFinite(bStart) || !Number.isFinite(bEnd) || bEnd <= bStart) {
      continue;
    }
    const winStart = Math.max(bStart, rangeStartMs);
    const winEnd = Math.min(bEnd, rangeEndMs);
    if (winEnd <= winStart) continue;

    const startDay = getTimeZoneWallParts(winStart, timezoneIana);
    let curDay = {
      year: startDay.year,
      month: startDay.month,
      day: startDay.day,
    };

    for (let d = 0; d < 62; d += 1) {
      const workStartMs = wallTimeToUtcMs(
        curDay.year,
        curDay.month,
        curDay.day,
        startHour,
        0,
        timezoneIana
      );
      const workEndMs = wallTimeToUtcMs(
        curDay.year,
        curDay.month,
        curDay.day,
        endHour,
        0,
        timezoneIana
      );
      if (workStartMs >= winEnd) break;

      const segStart = Math.max(winStart, workStartMs);
      const segEnd = Math.min(winEnd, workEndMs);
      if (segEnd > segStart) {
        clipped.push({
          start: new Date(segStart).toISOString(),
          end: new Date(segEnd).toISOString(),
        });
      }
      curDay = addDaysToCalendarDate(curDay.year, curDay.month, curDay.day, 1);
    }
  }

  return clipped;
}

export async function GET(request: NextRequest) {
  // Read searchParams immediately so Next.js treats this GET route as request-time dynamic under cacheComponents.
  const searchParams = request.nextUrl.searchParams;
  if (!isAllowedGetRequest(request)) {
    return apiError("FORBIDDEN", "Cross-site requests are not permitted.", 403);
  }

  const nowMs = Date.now();
  const clientIp = getClientIp(request);
  if (!consumeRateLimit(`get:${clientIp}`, 30, 60_000, nowMs)) {
    return apiError(
      "RATE_LIMITED",
      "Too many availability checks. Please slow down.",
      429
    );
  }

  const maxAllowedToMs =
    nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000;
  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");
  const fromMs = rawFrom ? Date.parse(rawFrom) : nowMs - 3_600_000;
  const toMs = rawTo ? Date.parse(rawTo) : maxAllowedToMs;

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return apiError("INVALID_RANGE", "Invalid availability time range.", 400);
  }

  const clampedFromMs = Math.max(fromMs, nowMs - 86_400_000);
  const clampedToMs = Math.min(
    toMs,
    clampedFromMs + 62 * 86_400_000,
    maxAllowedToMs
  );
  if (clampedToMs <= clampedFromMs) {
    return jsonResponse({ ok: true, configured: true, busy: [] });
  }

  const scriptUrl = getAppsScriptUrl();
  const secret = getWebhookSecret();
  if (!scriptUrl || !secret) {
    return jsonResponse({ ok: true, configured: false, busy: [] });
  }

  const cached = AVAILABILITY_CACHE.get(scriptUrl);
  if (
    cached &&
    nowMs - cached.fetchedAtMs < AVAILABILITY_CACHE_TTL_MS &&
    cached.fromMs <= clampedFromMs &&
    cached.toMs >= clampedToMs
  ) {
    return jsonResponse({
      ok: true,
      configured: true,
      busy: clipBusyToWorkingHours(cached.busy, clampedFromMs, clampedToMs),
    });
  }

  // Pad upstream end by 60s so slightly shifted client timestamps within the 15s TTL hit cache
  const upstreamToMs = Math.min(
    maxAllowedToMs,
    clampedFromMs + 62 * 86_400_000,
    clampedToMs + 60_000
  );

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        action: "availability",
        secret,
        timeMin: new Date(clampedFromMs).toISOString(),
        timeMax: new Date(upstreamToMs).toISOString(),
      }),
    });

    if (!upstream.ok) {
      return apiError(
        "UPSTREAM_ERROR",
        "Failed to read calendar availability.",
        502,
        { configured: true }
      );
    }

    const data = (await upstream.json()) as {
      ok?: boolean;
      busy?: Array<{ start?: string; end?: string }>;
    };
    if (data.ok === false) {
      return apiError(
        "UPSTREAM_ERROR",
        "Failed to read calendar availability.",
        502,
        { configured: true }
      );
    }

    const rawBusy = Array.isArray(data.busy)
      ? data.busy.filter(
          (item): item is { start: string; end: string } =>
            typeof item?.start === "string" && typeof item?.end === "string"
        )
      : [];
    const workingBusy = clipBusyToWorkingHours(
      rawBusy,
      clampedFromMs,
      upstreamToMs
    );

    if (AVAILABILITY_CACHE.size > 16) AVAILABILITY_CACHE.clear();
    AVAILABILITY_CACHE.set(scriptUrl, {
      fetchedAtMs: nowMs,
      fromMs: clampedFromMs,
      toMs: upstreamToMs,
      busy: workingBusy,
    });

    return jsonResponse({
      ok: true,
      configured: true,
      busy: clipBusyToWorkingHours(workingBusy, clampedFromMs, clampedToMs),
    });
  } catch {
    return apiError(
      "NETWORK_ERROR",
      "Unable to reach Google Calendar.",
      502,
      { configured: true }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return apiError("FORBIDDEN", "Invalid request origin.", 403);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json")) {
    return apiError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json.",
      415
    );
  }

  const contentLengthRaw = request.headers.get("content-length");
  if (contentLengthRaw && Number(contentLengthRaw) > MAX_POST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Request payload too large.", 413);
  }

  const nowMs = Date.now();
  const clientIp = getClientIp(request);
  if (!consumeRateLimit(`post-ip:${clientIp}`, 5, 900_000, nowMs)) {
    return apiError(
      "RATE_LIMITED",
      "Too many booking attempts. Please wait a few minutes.",
      429
    );
  }

  const parsedBody = await readBoundedJson(request, MAX_POST_BYTES);
  if (!parsedBody.ok) {
    return apiError(parsedBody.code, parsedBody.error, parsedBody.status);
  }
  const body = parsedBody.data;

  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return apiError("INVALID_REQUEST", "Unable to process request.", 400);
  }

  const name = sanitizeSingleLine(body.name);
  const email = sanitizeSingleLine(body.email);
  const notes = sanitizeNotes(body.notes);
  const startIso = typeof body.startIso === "string" ? body.startIso.trim() : "";
  const endIso = typeof body.endIso === "string" ? body.endIso.trim() : "";
  const durationMinutes =
    typeof body.durationMinutes === "number" ? body.durationMinutes : NaN;
  const visitorTimeZone = resolveSafeTimeZone(
    body.visitorTimeZone,
    siteConfig.booking.timezoneIana
  );

  if (name.length < 2 || name.length > 80) {
    return apiError("INVALID_NAME", "Please enter your full name.", 400);
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return apiError(
      "INVALID_EMAIL",
      "Please enter a valid email address.",
      400
    );
  }
  if (!consumeRateLimit(`post-email:${email.toLowerCase()}`, 3, 3_600_000, nowMs)) {
    return apiError(
      "RATE_LIMITED",
      "Booking limit reached for this email. Try again later.",
      429
    );
  }
  if (notes.length > 600) {
    return apiError(
      "INVALID_NOTES",
      "Project notes must be 600 characters or fewer.",
      400
    );
  }
  if (!ALLOWED_DURATIONS.has(durationMinutes)) {
    return apiError(
      "INVALID_DURATION",
      "Duration must be 30, 45, or 60 minutes.",
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
    return apiError("INVALID_SLOT", "Selected meeting time is invalid.", 400);
  }
  if (
    startMs < nowMs + 10 * 60_000 ||
    startMs > nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ) {
    return apiError(
      "OUT_OF_WINDOW",
      "Please choose an upcoming date within the booking window.",
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
    return apiError(
      "OUTSIDE_HOURS",
      "Selected slot is outside Cairo booking hours (10:00 AM – 10:00 PM).",
      400
    );
  }

  const scriptUrl = getAppsScriptUrl();
  const secret = getWebhookSecret();
  if (!scriptUrl || !secret) {
    return apiError(
      "NOT_CONFIGURED",
      "Google Meet calendar bridge is not connected yet. Add GOOGLE_APPS_SCRIPT_URL and BOOKING_WEBHOOK_SECRET to activate live bookings.",
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
        secret,
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
      meetLink?: string;
      htmlLink?: string;
      eventId?: string;
    };

    if (data.code === "SLOT_TAKEN") {
      AVAILABILITY_CACHE.delete(scriptUrl);
      return apiError(
        "SLOT_TAKEN",
        "This time slot was just booked. Please pick another available time.",
        409
      );
    }
    if (data.code === "LOCK_TIMEOUT") {
      return apiError(
        "LOCK_TIMEOUT",
        "Server is busy processing another booking. Please try again.",
        503
      );
    }
    if (!upstream.ok || !data.ok) {
      return apiError(
        "UPSTREAM_ERROR",
        "Could not schedule the Google Meet right now. Please try again.",
        502
      );
    }

    AVAILABILITY_CACHE.delete(scriptUrl);

    return jsonResponse({
      ok: true,
      meetLink: sanitizeUpstreamUrl(data.meetLink, ALLOWED_MEET_HOSTS),
      htmlLink: sanitizeUpstreamUrl(data.htmlLink, ALLOWED_CALENDAR_HOSTS),
      eventId: typeof data.eventId === "string" ? data.eventId.slice(0, 128) : "",
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
  } catch {
    return apiError(
      "NETWORK_ERROR",
      "Unable to reach Google Calendar right now. Please try again.",
      502
    );
  }
}
