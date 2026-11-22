import type { NextRequest } from "next/server";

const TZ_RE = /^[A-Za-z0-9_+-]+(\/[A-Za-z0-9_+-]+)*$/;
const SAFE_IP_CHARS_RE = /[^A-Fa-f0-9.:_-]/g;

export const SEC_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Resource-Policy": "same-origin",
  Vary: "Origin",
} as const;

const RATE_BUCKETS = new Map<string, number[]>();
const MAX_RATE_KEYS = 2000;

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: SEC_HEADERS });
}

export function apiError(
  code: string,
  error: string,
  status: number,
  extra?: Record<string, unknown>
): Response {
  return jsonResponse({ ok: false, code, error, ...extra }, status);
}

export function getClientIp(request: NextRequest): string {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];
  for (const headerVal of candidates) {
    if (!headerVal) continue;
    const first = headerVal
      .split(",")[0]
      ?.trim()
      .replace(SAFE_IP_CHARS_RE, "")
      .slice(0, 64);
    if (first) return first;
  }
  return "unknown";
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number
): boolean {
  const cutoff = nowMs - windowMs;
  if (RATE_BUCKETS.size >= MAX_RATE_KEYS) {
    for (const [k, stamps] of RATE_BUCKETS) {
      if (stamps.length === 0 || stamps[stamps.length - 1] <= cutoff) {
        RATE_BUCKETS.delete(k);
      }
    }
    while (RATE_BUCKETS.size >= MAX_RATE_KEYS) {
      const oldestKey = RATE_BUCKETS.keys().next().value;
      if (oldestKey === undefined) break;
      RATE_BUCKETS.delete(oldestKey);
    }
  }

  const prev = RATE_BUCKETS.get(key) ?? [];
  const active = prev.filter((ts) => ts > cutoff);
  if (active.length >= limit) {
    RATE_BUCKETS.delete(key);
    RATE_BUCKETS.set(key, active);
    return false;
  }
  active.push(nowMs);
  RATE_BUCKETS.delete(key);
  RATE_BUCKETS.set(key, active);
  return true;
}

function getExpectedHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();
}

function isMatchingOriginUrl(origin: string, expectedHost: string): boolean {
  try {
    const parsed = new URL(origin);
    const isLocalHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const protoOk =
      parsed.protocol === "https:" ||
      (parsed.protocol === "http:" &&
        (isLocalHost || process.env.NODE_ENV !== "production"));
    return protoOk && parsed.host.toLowerCase() === expectedHost;
  } catch {
    return false;
  }
}

export function isAllowedGetRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const expectedHost = getExpectedHost(request);
  return Boolean(expectedHost && isMatchingOriginUrl(origin, expectedHost));
}

export function isSameOriginPost(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  const expectedHost = getExpectedHost(request);
  if (!origin || !expectedHost) return false;

  return isMatchingOriginUrl(origin, expectedHost);
}

export type BoundedJsonResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; code: string; error: string };

export async function readBoundedJson(
  request: NextRequest,
  maxBytes: number
): Promise<BoundedJsonResult> {
  if (!request.body) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      error: "Invalid request payload.",
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return {
          ok: false,
          status: 413,
          code: "PAYLOAD_TOO_LARGE",
          error: "Request payload too large.",
        };
      }
      chunks.push(value);
    }
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      error: "Invalid request payload.",
    };
  } finally {
    reader.releaseLock();
  }

  try {
    const rawText = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks)
    );
    const parsed = JSON.parse(rawText) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.getPrototypeOf(parsed) !== Object.prototype
    ) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_JSON",
        error: "Invalid request payload.",
      };
    }
    return { ok: true, data: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      error: "Invalid request payload.",
    };
  }
}

export function sanitizeSingleLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeNotes(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, "")
    .trim();
}

export function resolveSafeTimeZone(rawTz: unknown, fallbackTz: string): string {
  if (typeof rawTz !== "string") return fallbackTz;
  const candidate = rawTz.trim().slice(0, 64);
  if (!candidate || !TZ_RE.test(candidate)) return fallbackTz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return fallbackTz;
  }
}

export function sanitizeUpstreamUrl(
  value: unknown,
  allowedHosts: ReadonlySet<string>
): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol !== "https:" ||
      !allowedHosts.has(parsed.hostname.toLowerCase())
    ) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}
