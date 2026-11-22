import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
    webkitAudioContext?: typeof AudioContext;
  }

  interface Navigator {
    deviceMemory?: number;
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}

export function getLenis(): Lenis | undefined {
  return typeof window !== "undefined" ? window.__lenis : undefined;
}

export function scrollToTarget(
  selector: string | null,
  duration = 1.2
): void {
  const lenis = getLenis();
  if (!selector) {
    if (lenis) lenis.scrollTo(0, { duration });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const target = document.querySelector<HTMLElement>(selector);
  if (target) {
    if (lenis) lenis.scrollTo(target, { duration });
    else target.scrollIntoView({ behavior: "smooth" });
  } else if (lenis) {
    lenis.scrollTo(0, { duration });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function scheduleIdle(
  callback: () => void,
  timeoutMs = 1500,
  fallbackDelayMs = 45
): () => void {
  if (typeof window === "undefined") return () => {};
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => window.cancelIdleCallback?.(id);
  }
  const timerId = window.setTimeout(callback, fallbackDelayMs);
  return () => window.clearTimeout(timerId);
}
