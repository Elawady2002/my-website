import { useEffect } from "react";
import type React from "react";

export interface UseRevealOnViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  revealRatio?: number;
  trackInView?: boolean;
}

export function useRevealOnView(
  ref: React.RefObject<HTMLElement | null>,
  options: UseRevealOnViewOptions = {}
): void {
  const {
    threshold = 0.16,
    rootMargin = "0px",
    revealRatio = 0,
    trackInView = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let revealed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (trackInView) {
              el.setAttribute("data-in-view", "true");
            }
            if (!revealed && entry.intersectionRatio >= revealRatio) {
              revealed = true;
              el.setAttribute("data-revealed", "true");
              if (!trackInView) {
                observer.unobserve(el);
              }
            }
          } else if (trackInView) {
            el.removeAttribute("data-in-view");
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, revealRatio, trackInView, threshold]);
}
