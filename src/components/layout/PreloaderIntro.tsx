"use client";

import React, { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/dom";

const TOTAL_COLS = 14;
let introPlayedInSpa = false;

export function PreloaderIntro() {
  const [unmounted, setUnmounted] = useState(() => introPlayedInSpa);

  useEffect(() => {
    if (introPlayedInSpa) return;

    const finish = () => {
      introPlayedInSpa = true;
      setUnmounted(true);
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    const timer = window.setTimeout(finish, 950);
    window.addEventListener("pointerdown", finish, { passive: true, once: true });
    window.addEventListener("wheel", finish, { passive: true, once: true });
    window.addEventListener("touchstart", finish, { passive: true, once: true });
    window.addEventListener("keydown", finish, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchstart", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  if (unmounted) return null;

  return (
    <div
      data-preloader=""
      aria-hidden="true"
      className="fixed inset-0 z-[100] pointer-events-none overflow-clip"
    >
      <div className="preloader-bar fixed top-0 inset-x-0 h-[3px] bg-[#f34213] z-[102]" />

      <div className="grid h-full w-full grid-cols-[16px_repeat(6,minmax(0,1fr))_16px] md:grid-cols-[24px_repeat(12,minmax(0,1fr))_24px]">
        {Array.from({ length: TOTAL_COLS }).map((_, idx) => (
          <div
            key={idx}
            style={
              { "--slat-delay": `${50 + idx * 22}ms` } as React.CSSProperties
            }
            className={`preloader-slat h-full bg-[#f34213] -mr-[2px] will-change-transform ${
              idx > 0 ? "shadow-[inset_1px_0_0_rgba(11,11,11,0.14)]" : ""
            } ${idx >= 8 ? "hidden md:block" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
