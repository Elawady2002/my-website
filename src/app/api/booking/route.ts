import type { NextRequest } from "next/server";
import { siteConfig } from "@/data/site";
import { getTimeZoneWallParts } from "@/lib/bookingSlots";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DURATIONS = new Set<number>(siteConfig.booking.durations);

function getAppsScriptUrl(): string {
  return (
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    siteConfig.booking.appsScriptUrl ||
    ""
  ).trim();
}

function getWebhookSecret(): string {
  return (process.env.BOOKING_WEBHOOK_SECRET || "").trim();
}

export async function GET(request: NextRequest) {
  // Read searchParams immediately so Next.js treats this GET route as request-time dynamic under cacheComponents.
  const searchParams = request.nextUrl.searchParams;
  const nowMs = Date.now();
  const defaultFromIso = new Date(nowMs - 3_600_000).toISOString();
  const defaultToIso = new Date(
    nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ).toISOString();

  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");

  const fromMs = rawFrom ? Date.parse(rawFrom) : Date.parse(defaultFromIso);
  const toMs = rawTo ? Date.parse(rawTo) : Date.parse(defaultToIso);

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return Response.json(
      { ok: false, error: "Invalid availability time range." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const clampedToMs = Math.min(toMs, fromMs + 62 * 86_400_000);
  const fromIso = new Date(fromMs).toISOString();
  const toIso = new Date(clampedToMs).toISOString();

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return Response.json(
      { ok: true, configured: false, busy: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

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
    });

    if (!upstream.ok) {
      return Response.json(
        { ok: false, configured: true, error: "Failed to read calendar availability." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = (await upstream.json()) as {
      ok?: boolean;
      busy?: Array<{ start?: string; end?: string }>;
      error?: string;
    };

    if (data.ok === false) {
      return Response.json(
        {
          ok: false,
          configured: true,
          error: data.error || "Calendar bridge returned an error.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const busy = Array.isArray(data.busy)
      ? data.busy.filter(
          (item): item is { start: string; end: string } =>
            typeof item?.start === "string" && typeof item?.end === "string"
        )
      : [];

    return Response.json(
      { ok: true, configured: true, busy },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { ok: false, configured: true, error: "Unable to reach Google Calendar." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    name?: unknown;
    email?: unknown;
    notes?: unknown;
    startIso?: unknown;
    endIso?: unknown;
    durationMinutes?: unknown;
    visitorTimeZone?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { ok: false, code: "INVALID_JSON", error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const startIso = typeof body.startIso === "string" ? body.startIso.trim() : "";
  const endIso = typeof body.endIso === "string" ? body.endIso.trim() : "";
  const durationMinutes =
    typeof body.durationMinutes === "number" ? body.durationMinutes : NaN;
  const visitorTimeZone =
    typeof body.visitorTimeZone === "string" && body.visitorTimeZone.trim()
      ? body.visitorTimeZone.trim().slice(0, 64)
      : siteConfig.booking.timezoneIana;

  if (name.length < 2 || name.length > 80) {
    return Response.json(
      { ok: false, code: "INVALID_NAME", error: "Please enter your full name." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email) || email.length > 120) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_EMAIL",
        error: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  if (notes.length > 600) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_NOTES",
        error: "Project notes must be 600 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!ALLOWED_DURATIONS.has(durationMinutes)) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_DURATION",
        error: "Duration must be 30, 45, or 60 minutes.",
      },
      { status: 400 }
    );
  }

  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  const nowMs = Date.now();

  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs - startMs !== durationMinutes * 60_000
  ) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_SLOT",
        error: "Selected meeting time is invalid.",
      },
      { status: 400 }
    );
  }

  if (
    startMs < nowMs + 10 * 60_000 ||
    startMs > nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ) {
    return Response.json(
      {
        ok: false,
        code: "OUT_OF_WINDOW",
        error: "Please choose an upcoming date within the booking window.",
      },
      { status: 400 }
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
    return Response.json(
      {
        ok: false,
        code: "OUTSIDE_HOURS",
        error: "Selected slot is outside Cairo booking hours (10:00 AM – 10:00 PM).",
      },
      { status: 400 }
    );
  }

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return Response.json(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        error:
          "Google Meet calendar bridge is not connected yet. Add GOOGLE_APPS_SCRIPT_URL to activate live bookings.",
      },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      cache: "no-store",
      redirect: "follow",
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
      return Response.json(
        {
          ok: false,
          code: "SLOT_TAKEN",
          error:
            "This time slot was just booked. Please pick another available time.",
        },
        { status: 409 }
      );
    }

    if (!upstream.ok || !data.ok) {
      return Response.json(
        {
          ok: false,
          code: data.code || "UPSTREAM_ERROR",
          error:
            data.error ||
            "Could not schedule the Google Meet right now. Please try again.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      meetLink: data.meetLink || "",
      htmlLink: data.htmlLink || "",
      eventId: data.eventId || "",
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
  } catch {
    return Response.json(
      {
        ok: false,
        code: "NETWORK_ERROR",
        error: "Unable to reach Google Calendar right now. Please try again.",
      },
      { status: 502 }
    );
  }
}
