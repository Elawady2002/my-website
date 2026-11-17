"use client";

import React, { useEffect, useRef, useState } from "react";
import { StylizedText } from "@/components/StylizedText";
import type { WorkCarouselController } from "@/components/workCarouselScene";
import { siteConfig } from "@/data/site";

const CARD_STRIDE = 5.02;

export function WorkSection() {
  const projects = siteConfig.workSection.projects;
  const count = projects.length;

  const introRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const captionContentRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [webglReady, setWebglReady] = useState(true);
  const activeIdxRef = useRef(0);

  const targetTrackRef = useRef(0);
  const currentTrackRef = useRef(0);
  const smoothVelRef = useRef(0);
  const activityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pointerVxRef = useRef(0);
  const dragStartTrackRef = useRef(0);
  const wheelSnapTimerRef = useRef<number | null>(null);
  const sceneCtrlRef = useRef<WorkCarouselController | null>(null);
  const ensureSceneMountRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "true");
          }
        });
      },
      { threshold: 0.18 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!webglReady) return;
    const container = stageRef.current;
    if (!container) return;

    let disposed = false;
    let started = false;
    let idleTimer: number | null = null;
    let idleCallbackId: number | null = null;

    const startMount = () => {
      if (started || disposed) return;
      started = true;
      io.disconnect();
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
        idleCallbackId = null;
      }

      import("./workCarouselScene").then(({ mountWorkCarouselScene }) => {
        if (disposed || !stageRef.current) return;
        sceneCtrlRef.current = mountWorkCarouselScene({
          container: stageRef.current,
          projects,
          captionContentRef,
          targetTrackRef,
          currentTrackRef,
          smoothVelRef,
          activityRef,
          isDraggingRef,
          wheelSnapTimerRef,
          activeIdxRef,
          onActiveIdxChange: setActiveIdx,
          onWebglFailed: () => setWebglReady(false),
        });
      });
    };

    ensureSceneMountRef.current = startMount;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startMount();
        }
      },
      { rootMargin: "1200px 0px", threshold: 0 }
    );
    io.observe(container);

    idleTimer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(startMount, {
          timeout: 1500,
        });
      } else {
        startMount();
      }
    }, 900);

    return () => {
      disposed = true;
      ensureSceneMountRef.current = null;
      io.disconnect();
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      sceneCtrlRef.current?.dispose();
      sceneCtrlRef.current = null;
    };
  }, [projects, webglReady]);

  const stepBy = (delta: number) => {
    const snapped = Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
    targetTrackRef.current = snapped - delta * CARD_STRIDE;
    ensureSceneMountRef.current?.();
    sceneCtrlRef.current?.wake();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelSnapTimerRef.current !== null) {
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    pointerVxRef.current = 0;
    dragStartTrackRef.current = targetTrackRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    ensureSceneMountRef.current?.();
    sceneCtrlRef.current?.kickAllVideos();
    sceneCtrlRef.current?.wake();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
    pointerVxRef.current = pointerVxRef.current * 0.55 + (dx / dt) * 0.45;

    const containerWidth =
      stageRef.current?.clientWidth || e.currentTarget.clientWidth || 1280;
    const worldPerPx =
      (containerWidth < 640 ? 9.5 : 7.2) / Math.max(containerWidth, 320);
    targetTrackRef.current += dx * worldPerPx;
    sceneCtrlRef.current?.wake();
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const totalDx = e.clientX - startXRef.current;
    const vx = pointerVxRef.current;
    const dragStartSnapped =
      Math.round(dragStartTrackRef.current / CARD_STRIDE) * CARD_STRIDE;

    if (Math.abs(totalDx) > 36 || Math.abs(vx) > 0.38) {
      if (Math.abs(targetTrackRef.current - dragStartSnapped) > CARD_STRIDE * 0.65) {
        targetTrackRef.current =
          Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
      } else {
        const dir = Math.abs(totalDx) >= 12 ? totalDx : vx;
        targetTrackRef.current =
          dragStartSnapped + (dir < 0 ? -CARD_STRIDE : CARD_STRIDE);
      }
    } else if (Math.abs(totalDx) < 8) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      if (relX < 0.2) {
        stepBy(-1);
      } else if (relX > 0.8) {
        stepBy(1);
      } else {
        targetTrackRef.current =
          Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
      }
    } else {
      targetTrackRef.current =
        Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
    }
    pointerVxRef.current = 0;
    sceneCtrlRef.current?.wake();
  };

  const activeProject = projects[activeIdx];
  const counterLabel = `${String(activeIdx + 1).padStart(2, "0")}/${String(
    count
  ).padStart(2, "0")}`;

  return (
    <div className="relative z-10 w-full bg-[#0b0b0b]">
      {/* Part A: Giant Staggered WORK Intro Heading */}
      <div
        id="work-intro"
        ref={introRef}
        className="px-4 sm:px-6 pt-16 sm:pt-24"
      >
        <h6 className="text-[13px] sm:text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7]/80">
          <StylizedText text={siteConfig.workSection.eyebrow} />
        </h6>

        <h2
          aria-label={siteConfig.workSection.heading}
          className="mt-4 w-full text-center text-[27vw] leading-[0.82] tracking-[-0.04em] font-normal uppercase text-[#e7e1d7] select-none overflow-clip"
        >
          {Array.from(siteConfig.workSection.heading).map((char, idx) => {
            const isO = char === "O" || char === "o";
            return (
              <span
                key={idx}
                style={
                  { "--work-delay": `${idx * 70}ms` } as React.CSSProperties
                }
                className={`work-intro-char inline-block ${
                  isO ? "playfair-o" : ""
                }`}
              >
                {char}
              </span>
            );
          })}
        </h2>
      </div>

      {/* Part B: Interactive Three.js Rounded-Box 3D Glass Carousel */}
      <section
        id="work"
        aria-label="Selected projects carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") stepBy(1);
          if (e.key === "ArrowLeft") stepBy(-1);
        }}
        tabIndex={0}
        className="relative w-full h-[100svh] min-h-[820px] max-h-[1020px] overflow-hidden select-none cursor-grab active:cursor-grabbing focus:outline-none"
      >
        {/* WebGL Three.js Canvas Mount (rendered before caption in DOM for clean layer order) */}
        {webglReady ? (
          <div ref={stageRef} className="absolute inset-0 z-10" />
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <div
              style={{ backgroundColor: activeProject.stageBg }}
              className="w-full max-w-[780px] aspect-[16/10] rounded-2xl border border-[#e7e1d7]/15 p-10 flex flex-col justify-between"
            >
              <span className="text-xs uppercase tracking-widest text-[#f34213]">
                {activeProject.badge}
              </span>
              <div>
                <h4 className="text-4xl font-semibold text-[#e7e1d7]">
                  {activeProject.headline}
                </h4>
                <p className="mt-3 text-base text-[#e7e1d7]/75">
                  {activeProject.subcopy}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top-Center Floating Project Caption */}
        <div
          ref={captionRef}
          aria-live="polite"
          className="pointer-events-none absolute top-[84px] sm:top-[102px] left-1/2 -translate-x-1/2 z-20 text-center w-[90vw] max-w-[760px]"
        >
          <div ref={captionContentRef} className="will-change-transform">
            <h3 className="text-[28px] sm:text-[46px] leading-[1.0] tracking-[-0.02em] font-normal uppercase text-[#e7e1d7]">
              <StylizedText text={activeProject.title} />
            </h3>
            <p className="mt-2 text-[11px] sm:text-[13px] leading-[1.3] uppercase tracking-[0.05em] text-[#e7e1d7]/65">
              <StylizedText text={activeProject.category} />
            </p>
          </div>
        </div>

        {/* Bottom-Center Clean Counter */}
        <div
          data-work-counter=""
          className="pointer-events-none absolute bottom-[28px] sm:bottom-[34px] left-1/2 -translate-x-1/2 z-20 text-[13px] sm:text-[14px] font-normal tabular-nums tracking-[0.04em] text-[#e7e1d7]"
        >
          {counterLabel}
        </div>
      </section>
    </div>
  );
}
