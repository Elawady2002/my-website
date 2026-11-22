import type React from "react";
import { MENU_COLS } from "@/components/layout/FullscreenMenuOverlay";
import { prefersReducedMotion } from "@/lib/dom";

function springEase(u: number): number {
  const clamped = Math.max(0, Math.min(1, u));
  return 1 - Math.pow(1 - clamped, 4.2);
}

export function runOpenCurtainAnimation({
  rafRef,
  leadScales,
  mainScales,
  applyColumnScale,
  onContentReveal,
  onComplete,
}: {
  rafRef: React.RefObject<number | null>;
  leadScales: number[];
  mainScales: number[];
  applyColumnScale: (idx: number, leadVal: number, mainVal: number) => void;
  onContentReveal: () => void;
  onComplete: () => void;
}): void {
  if (prefersReducedMotion()) {
    for (let i = 0; i < MENU_COLS; i += 1) applyColumnScale(i, 1, 1);
    onContentReveal();
    onComplete();
    return;
  }

  const isDesktop = window.innerWidth >= 768;
  const visibleCount = isDesktop ? MENU_COLS : 8;
  const anchorCol = isDesktop ? 12 : 6;
  const startLead = [...leadScales];
  const startMain = [...mainScales];

  const colTimings = Array.from({ length: MENU_COLS }, (_, idx) => {
    const dist = Math.abs(Math.min(idx, visibleCount - 1) - anchorCol);
    return {
      leadStart: dist * 16,
      leadDur: 440,
      mainStart: 65 + dist * 16,
      mainDur: 480,
    };
  });

  const contentRevealAt = 460;
  const totalOpenMs = Math.max(
    ...colTimings.slice(0, visibleCount).map((t) => t.mainStart + t.mainDur)
  );

  let revealedTriggered = false;
  let startTime = 0;

  const tick = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;

    for (let i = 0; i < MENU_COLS; i += 1) {
      const t = colTimings[i];
      const leadS =
        startLead[i] +
        (1 - startLead[i]) * springEase((elapsed - t.leadStart) / t.leadDur);
      const mainS =
        startMain[i] +
        (1 - startMain[i]) * springEase((elapsed - t.mainStart) / t.mainDur);
      applyColumnScale(i, leadS, mainS);
    }

    if (!revealedTriggered && elapsed >= contentRevealAt) {
      revealedTriggered = true;
      onContentReveal();
    }

    if (elapsed >= totalOpenMs) {
      for (let i = 0; i < MENU_COLS; i += 1) applyColumnScale(i, 1, 1);
      if (!revealedTriggered) onContentReveal();
      rafRef.current = null;
      onComplete();
      return;
    }

    rafRef.current = window.requestAnimationFrame(tick);
  };

  rafRef.current = window.requestAnimationFrame(tick);
}

export function runCloseCurtainAnimation({
  rafRef,
  leadScales,
  mainScales,
  applyColumnScale,
  onScrollStart,
  onReleaseNav,
  onComplete,
}: {
  rafRef: React.RefObject<number | null>;
  leadScales: number[];
  mainScales: number[];
  applyColumnScale: (idx: number, leadVal: number, mainVal: number) => void;
  onScrollStart: () => void;
  onReleaseNav: () => void;
  onComplete: () => void;
}): void {
  if (prefersReducedMotion()) {
    for (let i = 0; i < MENU_COLS; i += 1) applyColumnScale(i, 0, 0);
    onReleaseNav();
    onComplete();
    onScrollStart();
    return;
  }

  const isDesktop = window.innerWidth >= 768;
  const visibleCount = isDesktop ? MENU_COLS : 8;
  const anchorCol = isDesktop ? 12 : 6;
  const maxDist = Math.max(anchorCol, visibleCount - 1 - anchorCol);
  const startLead = [...leadScales];
  const startMain = [...mainScales];

  const colTimings = Array.from({ length: MENU_COLS }, (_, idx) => {
    const revDist = maxDist - Math.abs(Math.min(idx, visibleCount - 1) - anchorCol);
    return {
      mainStart: 120 + revDist * 22,
      mainDur: 460,
      leadStart: 185 + revDist * 22,
      leadDur: 440,
    };
  });

  const scrollStartAt = 160;
  const releaseNavAt = 540;
  const totalCloseMs = Math.max(
    ...colTimings.slice(0, visibleCount).map((t) => t.leadStart + t.leadDur)
  );

  let scrollTriggered = false;
  let navReleased = false;
  let startTime = 0;

  const tick = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;

    if (!scrollTriggered && elapsed >= scrollStartAt) {
      scrollTriggered = true;
      onScrollStart();
    }

    if (!navReleased && elapsed >= releaseNavAt) {
      navReleased = true;
      onReleaseNav();
    }

    for (let i = 0; i < MENU_COLS; i += 1) {
      const t = colTimings[i];
      const mainS =
        startMain[i] * (1 - springEase((elapsed - t.mainStart) / t.mainDur));
      const leadS =
        startLead[i] * (1 - springEase((elapsed - t.leadStart) / t.leadDur));
      applyColumnScale(i, leadS, mainS);
    }

    if (elapsed >= totalCloseMs) {
      for (let i = 0; i < MENU_COLS; i += 1) applyColumnScale(i, 0, 0);
      if (!navReleased) onReleaseNav();
      rafRef.current = null;
      onComplete();
      return;
    }

    rafRef.current = window.requestAnimationFrame(tick);
  };

  rafRef.current = window.requestAnimationFrame(tick);
}
