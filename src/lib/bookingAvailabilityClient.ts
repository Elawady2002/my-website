import { siteConfig } from "@/data/site";
import type { BusyInterval } from "@/lib/bookingSlots";

export interface AvailabilitySnapshot {
  busy: BusyInterval[];
  fetchedAtMs: number;
}

const STALE_CACHE_MS = 90_000;
const FRESH_CACHE_MS = 15_000;

let cachedSnapshot: AvailabilitySnapshot | null = null;
let inflightPromise: Promise<AvailabilitySnapshot> | null = null;

export function getCachedAvailability(
  nowMs: number = Date.now()
): AvailabilitySnapshot | null {
  if (!cachedSnapshot) return null;
  if (nowMs - cachedSnapshot.fetchedAtMs >= STALE_CACHE_MS) {
    return null;
  }
  return cachedSnapshot;
}

export function isAvailabilityFresh(nowMs: number = Date.now()): boolean {
  if (!cachedSnapshot) return false;
  return nowMs - cachedSnapshot.fetchedAtMs < FRESH_CACHE_MS;
}

export function fetchBookingAvailability(
  options: { force?: boolean } = {}
): Promise<AvailabilitySnapshot> {
  const force = Boolean(options.force);
  const nowMs = Date.now();

  if (!force && cachedSnapshot && isAvailabilityFresh(nowMs)) {
    return Promise.resolve(cachedSnapshot);
  }

  if (!force && inflightPromise) {
    return inflightPromise;
  }

  const fromIso = new Date(nowMs - 3_600_000).toISOString();
  const toIso = new Date(
    nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
  ).toISOString();

  const reqPromise = fetch(
    `/api/booking?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(
      toIso
    )}`,
    { cache: "no-store" }
  )
    .then(async (res) => {
      const data = (await res.json()) as {
        ok?: boolean;
        busy?: BusyInterval[];
        error?: string;
      };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not sync calendar");
      }
      const snapshot: AvailabilitySnapshot = {
        busy: Array.isArray(data.busy) ? data.busy : [],
        fetchedAtMs: Date.now(),
      };
      cachedSnapshot = snapshot;
      return snapshot;
    })
    .finally(() => {
      if (inflightPromise === reqPromise) {
        inflightPromise = null;
      }
    });

  inflightPromise = reqPromise;
  return reqPromise;
}

export function prefetchBookingAvailability(): void {
  if (typeof window === "undefined") return;
  if (isAvailabilityFresh() || inflightPromise) return;
  fetchBookingAvailability().catch(() => {});
}

export function recordBookedSlotInCache(interval: BusyInterval): void {
  const prevBusy = cachedSnapshot ? cachedSnapshot.busy : [];
  cachedSnapshot = {
    busy: [...prevBusy, interval],
    fetchedAtMs: Date.now(),
  };
}

export function invalidateAvailabilityCache(): void {
  cachedSnapshot = null;
}
