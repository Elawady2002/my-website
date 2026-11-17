"use client";

import React, { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";

interface SimFrame {
  x: number;
  y: number;
  rot: number;
}

interface TrajectoryResult {
  frames: SimFrame[];
  bounceTimes: number[];
  duration: number;
}

const TOTAL_COLS = 14;
const SIM_HZ = 240;
const SIM_DT = 1 / SIM_HZ;

function simulateTrajectory(
  vw: number,
  vh: number,
  radius: number
): TrajectoryResult {
  const floorY = Math.max(radius + 40, vh - radius);
  const gravity = 4.9 * Math.max(vh, 480);
  const vxFactors = [0.54, 0.5, 0.58, 0.46, 0.62, 0.42, 0.68];
  const restitutions = [0.6, 0.56, 0.64, 0.52];
  const vy0Factors = [0, -0.14];

  let best: TrajectoryResult | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const vxF of vxFactors) {
    for (const e of restitutions) {
      for (const vy0F of vy0Factors) {
        let x = radius * 0.25;
        let y = -radius * 0.35;
        const vx = vxF * vw;
        let vy = vy0F * vh;
        let rot = 0;
        const angularVel = vx / Math.max(radius, 24);

        const frames: SimFrame[] = [];
        const bounceTimes: number[] = [];

        for (let step = 0; step < SIM_HZ * 3.4; step += 1) {
          const t = step * SIM_DT;
          vy += gravity * SIM_DT;
          x += vx * SIM_DT;
          y += vy * SIM_DT;
          rot += angularVel * SIM_DT;

          if (y >= floorY) {
            y = floorY;
            if (vy > 60) {
              bounceTimes.push(t);
            }
            vy = -Math.abs(vy) * e;
          }

          frames.push({ x, y, rot });

          if (x - radius > vw + 12) {
            break;
          }
        }

        const duration = frames.length * SIM_DT;
        if (x - radius <= vw) continue;

        const firstBounceRatio =
          frames[Math.round((bounceTimes[0] ?? 0.5) * SIM_HZ)]?.x / vw;
        let score = Math.abs(duration - 2.15) * 4;
        if (bounceTimes.length < 4) score += (4 - bounceTimes.length) * 3;
        if (firstBounceRatio < 0.14 || firstBounceRatio > 0.48) score += 2.5;

        if (score < bestScore) {
          bestScore = score;
          best = { frames, bounceTimes, duration };
        }
      }
    }
  }

  if (best) return best;

  // Deterministic straight-bounce fallback for extreme viewports
  const fallbackFrames: SimFrame[] = [];
  const duration = 2.0;
  const totalSteps = Math.round(duration * SIM_HZ);
  for (let i = 0; i <= totalSteps; i += 1) {
    const p = i / totalSteps;
    const x = -radius + p * (vw + radius * 2.4);
    const arc = Math.abs(Math.sin(p * Math.PI * 3.2)) * Math.pow(1 - p, 0.7);
    const y = floorY - arc * (vh * 0.55);
    fallbackFrames.push({ x, y, rot: p * Math.PI * 6 });
  }
  return {
    frames: fallbackFrames,
    bounceTimes: [0.62, 1.24, 1.72],
    duration,
  };
}

export function PreloaderIntro() {
  const [unmounted, setUnmounted] = useState(false);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-intro-ready", "true");

    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.stop();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const allIntroEls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-intro-char], [data-intro-fade], [data-intro-line], [data-intro-portrait]"
      )
    );

    const uncoverAll = () => {
      allIntroEls.forEach((el) => el.setAttribute("data-uncovered", "true"));
    };

    const finishIntro = () => {
      uncoverAll();
      const activeLenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      activeLenis?.start();
      if (chromeRef.current) {
        chromeRef.current.style.opacity = "0";
      }
      window.setTimeout(() => {
        root.removeAttribute("data-intro-ready");
        allIntroEls.forEach((el) => el.removeAttribute("data-uncovered"));
        setUnmounted(true);
      }, 480);
    };

    if (reducedMotion) {
      const cols = colRefs.current.filter(
        (el): el is HTMLDivElement => Boolean(el && el.offsetWidth > 0)
      );
      cols.forEach((col, idx) => {
        col.style.transition = `transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${
          idx * 22
        }ms`;
        col.style.transform = "translate3d(0, -101.5%, 0)";
      });
      const timer = window.setTimeout(finishIntro, 520);
      return () => {
        window.clearTimeout(timer);
        root.removeAttribute("data-intro-ready");
        (window as unknown as { __lenis?: Lenis }).__lenis?.start();
      };
    }

    const activeCols = colRefs.current.filter(
      (el): el is HTMLDivElement => Boolean(el && el.offsetWidth > 0)
    );

    if (activeCols.length === 0) {
      const t = window.setTimeout(finishIntro, 80);
      return () => window.clearTimeout(t);
    }

    const vw = window.innerWidth || 1440;
    const vh = window.innerHeight || 900;
    const diameter = Math.max(68, Math.min(118, vw / 12.5));
    const radius = diameter / 2;
    const floorY = Math.max(radius + 40, vh - radius);

    const colBounds = activeCols.map((col) => {
      const r = col.getBoundingClientRect();
      return { left: r.left, right: r.right, mid: (r.left + r.right) * 0.5 };
    });

    const buckets: HTMLElement[][] = activeCols.map(() => []);
    allIntroEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const targetX = rect.left + Math.min(8, rect.width * 0.15);
      let colIdx = colBounds.findIndex(
        (b) => targetX >= b.left - 1 && targetX < b.right + 1
      );
      if (colIdx < 0) {
        colIdx = targetX < colBounds[0].left ? 0 : activeCols.length - 1;
      }
      buckets[colIdx].push(el);
    });

    if (ballRef.current) {
      ballRef.current.style.width = `${diameter.toFixed(1)}px`;
      ballRef.current.style.height = `${diameter.toFixed(1)}px`;
    }
    if (shadowRef.current) {
      shadowRef.current.style.width = `${(diameter * 1.1).toFixed(1)}px`;
      shadowRef.current.style.height = `${(diameter * 0.2).toFixed(1)}px`;
    }

    const sim = simulateTrajectory(vw, vh, radius);
    const triggerTimes = colBounds.map((b, idx) => {
      const hitIdx = sim.frames.findIndex((f) => f.x >= b.mid);
      if (hitIdx >= 0) {
        return Math.max(0.06, hitIdx * SIM_DT);
      }
      return Math.max(0.06, sim.duration * ((idx + 1) / activeCols.length));
    });

    const triggered = activeCols.map(() => false);
    const liftDuration = 0.6;
    let maxTrigger = Math.max(...triggerTimes);
    let skipped = false;
    let rafId = 0;
    let cancelled = false;
    let startPerf = 0;

    const handleSkip = () => {
      if (skipped || !startPerf) return;
      skipped = true;
      const nowSec = (performance.now() - startPerf) / 1000;
      if (ballRef.current) {
        ballRef.current.style.transition = "opacity 160ms ease-out";
        ballRef.current.style.opacity = "0";
      }
      if (shadowRef.current) {
        shadowRef.current.style.transition = "opacity 160ms ease-out";
        shadowRef.current.style.opacity = "0";
      }
      let nextStep = 0;
      for (let i = 0; i < activeCols.length; i += 1) {
        if (!triggered[i]) {
          triggerTimes[i] = Math.min(triggerTimes[i], nowSec + nextStep * 0.02);
          nextStep += 1;
        }
      }
      maxTrigger = Math.max(...triggerTimes);
    };

    window.addEventListener("pointerdown", handleSkip, { passive: true });
    window.addEventListener("wheel", handleSkip, { passive: true });
    window.addEventListener("touchstart", handleSkip, { passive: true });
    window.addEventListener("keydown", handleSkip);

    const fontGate = document.fonts?.ready
      ? Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => window.setTimeout(resolve, 480)),
        ])
      : Promise.resolve();

    let beatTimer = 0;

    fontGate.then(() => {
      if (cancelled) return;
      (window as unknown as { __lenis?: Lenis }).__lenis?.stop();
      beatTimer = window.setTimeout(() => {
        if (cancelled) return;
        (window as unknown as { __lenis?: Lenis }).__lenis?.stop();
        startPerf = performance.now();

        if (ballRef.current) ballRef.current.style.opacity = "1";
        if (shadowRef.current) shadowRef.current.style.opacity = "1";

        const tick = (now: number) => {
          if (cancelled) return;
          const elapsed = Math.max(0, (now - startPerf) / 1000);

          if (!skipped) {
            const fIdx = Math.min(
              sim.frames.length - 1,
              Math.floor(elapsed * SIM_HZ)
            );
            const f = sim.frames[fIdx];

            if (f && ballRef.current && shadowRef.current) {
              // Analytical squash-and-stretch spring at bounce moments
              let scaleX = 1;
              let scaleY = 1;
              for (let b = sim.bounceTimes.length - 1; b >= 0; b -= 1) {
                const dtB = elapsed - sim.bounceTimes[b];
                if (dtB >= 0 && dtB < 0.34) {
                  const s =
                    Math.exp(-8.5 * dtB) * Math.sin(dtB * 27) * 0.28;
                  scaleX = 1 + s * 0.85;
                  scaleY = 1 - s;
                  break;
                }
              }

              const tx = f.x - radius;
              const ty = f.y - radius;
              ballRef.current.style.transform = `translate3d(${tx.toFixed(
                1
              )}px, ${ty.toFixed(1)}px, 0) scale(${scaleX.toFixed(
                3
              )}, ${scaleY.toFixed(3)}) rotate(${f.rot.toFixed(3)}rad)`;

              const heightRatio = Math.max(0, Math.min(1, f.y / floorY));
              const shadowOp = Math.pow(heightRatio, 2.1) * 0.85;
              const shadowScaleX = 0.35 + heightRatio * 0.65;
              const shadowScaleY = 0.6 + heightRatio * 0.4;
              const sx = f.x - diameter * 0.55;
              const sy = vh - diameter * 0.14;
              shadowRef.current.style.opacity = shadowOp.toFixed(3);
              shadowRef.current.style.transform = `translate3d(${sx.toFixed(
                1
              )}px, ${sy.toFixed(1)}px, 0) scale(${shadowScaleX.toFixed(
                3
              )}, ${shadowScaleY.toFixed(3)})`;
            }
          }

          for (let i = 0; i < activeCols.length; i += 1) {
            if (elapsed >= triggerTimes[i]) {
              if (!triggered[i]) {
                triggered[i] = true;
                buckets[i].forEach((el) =>
                  el.setAttribute("data-uncovered", "true")
                );
              }
              const u = Math.min(1, (elapsed - triggerTimes[i]) / liftDuration);
              const eased = 1 - Math.pow(1 - u, 4.2);
              activeCols[i].style.transform = `translate3d(0, ${(
                -101.5 * eased
              ).toFixed(2)}%, 0)`;
            }
          }

          if (elapsed > maxTrigger + liftDuration + 0.06) {
            finishIntro();
            return;
          }

          rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
      }, 160);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(beatTimer);
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointerdown", handleSkip);
      window.removeEventListener("wheel", handleSkip);
      window.removeEventListener("touchstart", handleSkip);
      window.removeEventListener("keydown", handleSkip);
      root.removeAttribute("data-intro-ready");
      (window as unknown as { __lenis?: Lenis }).__lenis?.start();
    };
  }, []);

  if (unmounted) return null;

  return (
    <div
      data-preloader=""
      aria-hidden="true"
      className="fixed inset-0 z-[100] pointer-events-none overflow-clip"
    >
      {/* Top 3px brand accent line synced with curtain */}
      <div
        ref={chromeRef}
        className="fixed top-0 inset-x-0 h-[3px] bg-[#f34213] transition-opacity duration-300 z-[102]"
      />

      {/* 14-Column Vermilion Curtain (8 columns on mobile, 14 on desktop) */}
      <div className="grid h-full w-full grid-cols-[16px_repeat(6,minmax(0,1fr))_16px] md:grid-cols-[24px_repeat(12,minmax(0,1fr))_24px]">
        {Array.from({ length: TOTAL_COLS }).map((_, idx) => (
          <div
            key={idx}
            ref={(el) => {
              colRefs.current[idx] = el;
            }}
            className={`h-full bg-[#f34213] -mr-px border-r border-[#0b0b0b]/[0.12] will-change-transform ${
              idx >= 8 ? "hidden md:block" : ""
            }`}
          />
        ))}
      </div>

      {/* Ground Contact Shadow */}
      <div
        ref={shadowRef}
        className="pointer-events-none absolute left-0 top-0 rounded-full will-change-transform"
        style={{
          opacity: 0,
          background:
            "radial-gradient(closest-side, rgba(11,11,11,0.44), rgba(11,11,11,0))",
        }}
      />

      {/* 8-Spoke Obsidian Wheel */}
      <div
        ref={ballRef}
        className="pointer-events-none absolute left-0 top-0 origin-[50%_100%] will-change-transform"
        style={{ opacity: 0 }}
      >
        <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
          <circle
            cx="60"
            cy="60"
            r="53"
            stroke="#0b0b0b"
            strokeWidth="5.5"
          />
          <circle cx="60" cy="60" r="11" fill="#0b0b0b" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="60"
              y1="60"
              x2="60"
              y2="13"
              stroke="#0b0b0b"
              strokeWidth="6.5"
              strokeLinecap="round"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
