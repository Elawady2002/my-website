"use client";

import React, { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import type { PreloaderFootballController } from "./preloaderFootballScene";

interface SimFrame {
  x: number;
  y: number;
  rot: number;
  vy: number;
}

interface BounceEvent {
  time: number;
  impactRatio: number;
}

interface TrajectoryResult {
  frames: SimFrame[];
  bounces: BounceEvent[];
  duration: number;
}

const TOTAL_COLS = 14;
const SIM_HZ = 240;
const SIM_DT = 1 / SIM_HZ;
const BALL_BOX_SCALE = 1.28;

let preloaderSceneModulePromise:
  | Promise<typeof import("./preloaderFootballScene")>
  | null = null;

function preloadFootballSceneModule(): Promise<
  typeof import("./preloaderFootballScene")
> | null {
  if (typeof window === "undefined") return null;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }
  if (!preloaderSceneModulePromise) {
    preloaderSceneModulePromise = import("./preloaderFootballScene");
  }
  return preloaderSceneModulePromise;
}

if (typeof window !== "undefined") {
  preloadFootballSceneModule();
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function simulateTrajectory(
  vw: number,
  vh: number,
  radius: number,
  floorY: number
): TrajectoryResult {
  const gravity = 5.45 * Math.max(vh, 520);
  const x0 = Math.max(radius * 0.92, vw * 0.058);
  const y0 = -radius * 1.22;
  const vy0 = 0.18 * vh;
  const safeRadiusSpin = Math.max(radius, 28);
  const safeRadiusBounce = Math.max(radius, 24);

  const vxScales = [0.88, 0.94, 1.0, 1.06, 1.12, 0.82, 1.18];
  const restitutions = [0.71, 0.68, 0.73];

  let bestVxScale = -1;
  let bestE = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  // Pass 1: evaluate candidate parameters with zero array/frame allocations
  for (const vxScale of vxScales) {
    for (const e of restitutions) {
      let x = x0;
      let y = y0;
      let vx = vxScale * 0.23 * vw;
      let vy = vy0;
      let omega = (vxScale * 0.78 * vw) / safeRadiusSpin;

      let stepCount = 0;
      let bounceCount = 0;
      let firstBounceX = 0;

      for (let step = 0; step < SIM_HZ * 4.0; step += 1) {
        vy += gravity * SIM_DT;
        vx *= 1 - 0.075 * SIM_DT;
        vy *= 1 - 0.035 * SIM_DT;
        x += vx * SIM_DT;
        y += vy * SIM_DT;

        if (y >= floorY) {
          y = floorY;
          if (vy > 55) {
            if (bounceCount === 0) firstBounceX = x;
            bounceCount += 1;
          }
          const eEff = e - 0.02 * clamp(Math.abs(vy) / (3.5 * vh), 0, 1);
          vy = -Math.abs(vy) * eEff;
          const vSlip = vx - omega * radius;
          vx -= 0.44 * vSlip;
          omega = 0.72 * (vx / safeRadiusBounce) + 0.28 * omega;
          vx *= 0.97;
        }

        stepCount += 1;
        if (x - radius > vw + 16) {
          break;
        }
      }

      if (x - radius <= vw + 16 || bounceCount === 0) continue;

      const duration = stepCount * SIM_DT;
      const firstBounceRatio = firstBounceX / vw;
      let score =
        Math.abs(duration - 2.35) * 3.5 + Math.abs(bounceCount - 4) * 3.2;
      if (firstBounceRatio < 0.13 || firstBounceRatio > 0.24) score += 2.5;

      if (score < bestScore) {
        bestScore = score;
        bestVxScale = vxScale;
        bestE = e;
      }
    }
  }

  // Pass 2: record frames & bounce events only for the winning trajectory
  if (bestVxScale > 0) {
    let x = x0;
    let y = y0;
    let vx = bestVxScale * 0.23 * vw;
    let vy = vy0;
    let rot = 0;
    let omega = (bestVxScale * 0.78 * vw) / safeRadiusSpin;

    const frames: SimFrame[] = [];
    const bounces: BounceEvent[] = [];

    for (let step = 0; step < SIM_HZ * 4.0; step += 1) {
      const t = step * SIM_DT;
      vy += gravity * SIM_DT;
      vx *= 1 - 0.075 * SIM_DT;
      vy *= 1 - 0.035 * SIM_DT;
      x += vx * SIM_DT;
      y += vy * SIM_DT;
      rot += omega * SIM_DT;

      if (y >= floorY) {
        y = floorY;
        if (vy > 55) {
          bounces.push({
            time: t,
            impactRatio: clamp(Math.abs(vy) / (3.35 * vh), 0.18, 1),
          });
        }
        const eEff = bestE - 0.02 * clamp(Math.abs(vy) / (3.5 * vh), 0, 1);
        vy = -Math.abs(vy) * eEff;
        const vSlip = vx - omega * radius;
        vx -= 0.44 * vSlip;
        omega = 0.72 * (vx / safeRadiusBounce) + 0.28 * omega;
        vx *= 0.97;
      }

      frames.push({ x, y, rot, vy });
      if (x - radius > vw + 16) {
        break;
      }
    }

    return {
      frames,
      bounces,
      duration: frames.length * SIM_DT,
    };
  }

  // Deterministic drop-and-bounce fallback for extreme viewports
  const fallbackFrames: SimFrame[] = [];
  const duration = 2.35;
  const totalSteps = Math.round(duration * SIM_HZ);
  const startY = -radius * 1.2;
  const fallSpan = floorY - startY;
  for (let i = 0; i <= totalSteps; i += 1) {
    const p = i / totalSteps;
    const x = x0 + p * (vw + radius * 2.2 - x0);
    const bouncePhase = p < 0.24 ? (p / 0.24) * (p / 0.24) : 1 - Math.abs(Math.sin(((p - 0.24) / 0.76) * Math.PI * 3.0)) * Math.pow(1 - (p - 0.24) / 0.76, 1.35) * 0.56;
    const y = startY + bouncePhase * fallSpan;
    fallbackFrames.push({ x, y, rot: p * Math.PI * 8.5, vy: 0 });
  }
  return {
    frames: fallbackFrames,
    bounces: [
      { time: 0.56, impactRatio: 0.95 },
      { time: 1.16, impactRatio: 0.62 },
      { time: 1.75, impactRatio: 0.36 },
    ],
    duration,
  };
}

export function PreloaderIntro() {
  const [unmounted, setUnmounted] = useState(false);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const fallbackWrapRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    window.scrollTo(0, 0);
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.scrollTo(0, { immediate: true, force: true });
    lenis?.stop();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const allIntroEls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-intro-char], [data-intro-fade], [data-intro-line], [data-intro-portrait]"
      )
    );
    const activeCols = colRefs.current.filter(
      (el): el is HTMLDivElement => Boolean(el && el.offsetWidth > 0)
    );

    const vw = window.innerWidth || 1440;
    const vh = window.innerHeight || 900;

    // Read all geometry before mutating root[data-intro-ready] to prevent a forced reflow
    const colBounds = activeCols.map((col) => {
      const r = col.getBoundingClientRect();
      return { left: r.left, right: r.right, mid: (r.left + r.right) * 0.5 };
    });
    const buckets: HTMLElement[][] = activeCols.map(() => []);
    if (colBounds.length > 0) {
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
    }

    root.removeAttribute("data-intro-done");
    root.setAttribute("data-intro-ready", "true");

    const uncoverAll = () => {
      allIntroEls.forEach((el) => el.setAttribute("data-uncovered", "true"));
    };

    let footballCtrl: PreloaderFootballController | null = null;
    let finishTimer = 0;

    const finishIntro = () => {
      uncoverAll();
      const activeLenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      activeLenis?.start();
      if (chromeRef.current) {
        chromeRef.current.style.opacity = "0";
      }
      finishTimer = window.setTimeout(() => {
        footballCtrl?.dispose();
        footballCtrl = null;
        root.setAttribute("data-intro-done", "true");
        root.removeAttribute("data-intro-ready");
        allIntroEls.forEach((el) => el.removeAttribute("data-uncovered"));
        setUnmounted(true);
      }, 480);
    };

    if (reducedMotion) {
      activeCols.forEach((col, idx) => {
        col.style.transition = `transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${
          idx * 22
        }ms`;
        col.style.transform = "translate3d(0, -101.5%, 0)";
      });
      const timer = window.setTimeout(finishIntro, 520);
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(finishTimer);
        root.removeAttribute("data-intro-ready");
        (window as unknown as { __lenis?: Lenis }).__lenis?.start();
      };
    }

    if (activeCols.length === 0) {
      const t = window.setTimeout(finishIntro, 80);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(finishTimer);
      };
    }

    const diameter = Math.max(76, Math.min(124, vw / 11.6));
    const radius = diameter / 2;
    const floorPad = Math.max(8, Math.round(vh * 0.014));
    const floorY = Math.max(radius + 40, vh - radius - floorPad);
    const boxSize = Math.ceil(diameter * BALL_BOX_SCALE);

    if (ballRef.current) {
      ballRef.current.style.width = `${boxSize}px`;
      ballRef.current.style.height = `${boxSize}px`;
    }
    if (fallbackWrapRef.current) {
      fallbackWrapRef.current.style.width = `${diameter.toFixed(1)}px`;
      fallbackWrapRef.current.style.height = `${diameter.toFixed(1)}px`;
    }
    if (shadowRef.current) {
      shadowRef.current.style.width = `${(diameter * 1.15).toFixed(1)}px`;
      shadowRef.current.style.height = `${(diameter * 0.22).toFixed(1)}px`;
    }

    const sim = simulateTrajectory(vw, vh, radius, floorY);
    const triggerTimes = colBounds.map((b, idx) => {
      const hitIdx = sim.frames.findIndex(
        (f) => f.y >= radius * 0.45 && f.x >= b.mid
      );
      if (hitIdx >= 0) {
        return Math.max(0.06, hitIdx * SIM_DT);
      }
      return Math.max(0.06, sim.duration * ((idx + 1) / activeCols.length));
    });

    const triggered = activeCols.map(() => false);
    const liftDuration = 0.6;
    let maxTrigger = Math.max(...triggerTimes);
    let skipped = false;
    let ballExited = false;
    let rafId = 0;
    let cancelled = false;
    let startPerf = 0;

    const handleSkip = () => {
      if (skipped || !startPerf) return;
      skipped = true;
      if (ballRef.current) {
        ballRef.current.style.transition = "opacity 160ms ease-out";
        ballRef.current.style.opacity = "0";
      }
      if (shadowRef.current) {
        shadowRef.current.style.transition = "opacity 160ms ease-out";
        shadowRef.current.style.opacity = "0";
      }
      const nowSec = (performance.now() - startPerf) / 1000;
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

    const sceneModulePromise =
      preloadFootballSceneModule() || import("./preloaderFootballScene");
    const sceneReadyPromise = Promise.race([
      sceneModulePromise
        .then(({ mountPreloaderFootballScene }) => {
          if (cancelled || !ballRef.current) return;
          footballCtrl = mountPreloaderFootballScene(ballRef.current, boxSize);
          if (footballCtrl && fallbackWrapRef.current) {
            fallbackWrapRef.current.style.display = "none";
          }
        })
        .catch(() => {}),
      new Promise<void>((resolve) => window.setTimeout(resolve, 480)),
    ]);

    let beatTimer = 0;

    Promise.all([fontGate, sceneReadyPromise]).then(() => {
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

          if (!skipped && !ballExited) {
            const fIdx = Math.min(
              sim.frames.length - 1,
              Math.floor(elapsed * SIM_HZ)
            );
            const f = sim.frames[fIdx];

            if (
              fIdx >= sim.frames.length - 1 ||
              (f && f.x - radius > vw + 16)
            ) {
              ballExited = true;
              if (ballRef.current) ballRef.current.style.opacity = "0";
              if (shadowRef.current) shadowRef.current.style.opacity = "0";
            } else if (f && ballRef.current && shadowRef.current) {
              let squashX = 1;
              let squashY = 1;
              let inImpactWindow = false;

              for (let b = sim.bounces.length - 1; b >= 0; b -= 1) {
                const bounce = sim.bounces[b];
                const dtB = elapsed - bounce.time;
                if (dtB >= 0 && dtB < 0.068) {
                  const p = Math.sin((dtB / 0.068) * Math.PI);
                  squashY = 1 - 0.145 * bounce.impactRatio * p;
                  squashX = 1 / Math.sqrt(squashY);
                  inImpactWindow = true;
                  break;
                }
                if (dtB >= 0.068 && dtB < 0.135) {
                  const u = (dtB - 0.068) / 0.067;
                  const snap =
                    Math.sin(u * Math.PI) *
                    (1 - u) *
                    0.026 *
                    bounce.impactRatio;
                  squashY = 1 + snap;
                  squashX = 1 / Math.sqrt(squashY);
                  inImpactWindow = true;
                  break;
                }
              }

              if (!inImpactWindow && f.vy > 0) {
                const clearance = clamp(
                  (floorY - f.y) / Math.max(radius * 0.35, 1),
                  0,
                  1
                );
                const speedFactor = clamp((f.vy - 0.8 * vh) / (2.2 * vh), 0, 1);
                const fallStretch = clearance * speedFactor;
                if (fallStretch > 0.001) {
                  squashY = 1 + 0.022 * fallStretch;
                  squashX = 1 / Math.sqrt(squashY);
                }
              }

              const tx = f.x - boxSize * 0.5;
              const ty = f.y - boxSize * 0.5;
              ballRef.current.style.transform = `translate3d(${tx.toFixed(
                1
              )}px, ${ty.toFixed(1)}px, 0)`;

              if (footballCtrl) {
                footballCtrl.renderFrame(f.rot, squashX, squashY);
              } else if (fallbackWrapRef.current) {
                fallbackWrapRef.current.style.transform = `scale(${squashX.toFixed(
                  3
                )}, ${squashY.toFixed(3)}) rotate(${f.rot.toFixed(3)}rad)`;
              }

              const alt = clamp(
                (floorY - f.y) / Math.max(vh * 0.85, 1),
                0,
                1
              );
              const shadowOp = Math.exp(-4.2 * alt) * 0.74;
              const shadowScaleX = (0.78 + alt * 0.55) * squashX;
              const shadowScaleY = 0.72 + alt * 0.35;
              const sx = f.x - diameter * 0.575;
              const sy = floorY + radius - diameter * 0.11;
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
      window.clearTimeout(finishTimer);
      window.cancelAnimationFrame(rafId);
      footballCtrl?.dispose();
      footballCtrl = null;
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
            className={`h-full bg-[#f34213] -mr-[2px] will-change-transform ${
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
            "radial-gradient(closest-side, rgba(11,11,11,0.52), rgba(11,11,11,0))",
        }}
      />

      {/* 3D Classic Football Container (+ WebGL-disabled SVG fallback) */}
      <div
        ref={ballRef}
        className="pointer-events-none absolute left-0 top-0 flex items-center justify-center will-change-transform"
        style={{ opacity: 0 }}
      >
        <div
          ref={fallbackWrapRef}
          className="origin-[50%_100%] will-change-transform"
        >
          <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="#ebe7de"
              stroke="#0b0b0b"
              strokeWidth="3.2"
            />
            <g
              stroke="#0b0b0b"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="60" y1="39" x2="60" y2="17" />
              <line x1="80" y1="54" x2="98" y2="43" />
              <line x1="72" y1="77" x2="86" y2="96" />
              <line x1="48" y1="77" x2="34" y2="96" />
              <line x1="40" y1="54" x2="22" y2="43" />
            </g>
            <polygon
              points="60,38 80,52.5 72.4,76 47.6,76 40,52.5"
              fill="#141416"
            />
            <polygon points="48,10 72,10 60,21" fill="#141416" />
            <polygon points="103,33 111,55 96,45" fill="#141416" />
            <polygon points="94,95 74,108 85,93" fill="#141416" />
            <polygon points="26,95 46,108 35,93" fill="#141416" />
            <polygon points="17,33 9,55 24,45" fill="#141416" />
          </svg>
        </div>
      </div>
    </div>
  );
}
