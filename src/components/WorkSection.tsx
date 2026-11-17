"use client";

import React, { useEffect, useRef, useState } from "react";
import { StylizedText } from "@/components/StylizedText";
import type { WorkCarouselController } from "@/components/workCarouselScene";
import { siteConfig, type WorkProjectLinkType } from "@/data/site";

const CARD_STRIDE = 5.02;

const LINK_LABELS: Record<WorkProjectLinkType, string> = {
  appStore: "App Store",
  googlePlay: "Google Play",
  web: "Website",
  figma: "Figma",
  video: "Watch Video",
};

function ProjectLinkIcon({ type }: { type: WorkProjectLinkType }) {
  if (type === "appStore") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-[15px] h-[15px] shrink-0"
      >
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    );
  }
  if (type === "googlePlay") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-[15px] h-[15px] shrink-0"
      >
        <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
      </svg>
    );
  }
  if (type === "figma") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-[15px] h-[15px] shrink-0"
      >
        <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
      </svg>
    );
  }
  if (type === "video") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-[15px] h-[15px] shrink-0"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M10.2 8.4L16 12l-5.8 3.6V8.4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="w-[15px] h-[15px] shrink-0"
    >
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
      <path d="M2.8 12h18.4M4.5 7.5h15M4.5 16.5h15" />
    </svg>
  );
}

export function WorkSection() {
  const projects = siteConfig.workSection.projects;
  const count = projects.length;

  const introRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const captionContentRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [webglReady, setWebglReady] = useState(true);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
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

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement | null)?.closest("[data-project-links]")) {
      return;
    }
    if (wheelSnapTimerRef.current !== null) {
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }
    isDraggingRef.current = true;
    setIsDraggingUI(true);
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

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "touch") {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const relY = (e.clientY - rect.top) / Math.max(rect.height, 1);
      const overCenterCard =
        relX >= 0.17 && relX <= 0.83 && relY >= 0.2 && relY <= 0.92;
      setIsCardHovered((prev) =>
        prev === overCenterCard ? prev : overCenterCard
      );
    }

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

  const finishDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingUI(false);
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
  const projectLinks = activeProject.links ?? [];
  const showLinksDock =
    projectLinks.length > 0 && !isDraggingUI && (isCardHovered || isDockHovered);
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
        onPointerLeave={() => {
          setIsCardHovered(false);
          setIsDockHovered(false);
        }}
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

        {/* Hover-Reveal Project Action Dock (Store, Website & Figma Links) */}
        {projectLinks.length > 0 ? (
          <div
            data-project-links=""
            data-visible={showLinksDock ? "true" : "false"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerEnter={() => setIsDockHovered(true)}
            onPointerLeave={() => setIsDockHovered(false)}
            className={`absolute bottom-[70px] sm:bottom-[84px] left-1/2 -translate-x-1/2 z-30 max-w-[92vw] transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isDraggingUI
                ? "opacity-0 translate-y-4 scale-[0.96] pointer-events-none"
                : showLinksDock
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-100 translate-y-0 scale-100 pointer-events-auto md:opacity-0 md:translate-y-4 md:scale-[0.96] md:pointer-events-none"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {projectLinks.map((link, idx) => (
                <a
                  key={`${activeProject.id}-${link.type}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    transitionDelay: showLinksDock ? `${idx * 45}ms` : "0ms",
                  }}
                  className="voy-glass inline-flex items-center gap-2 h-[38px] sm:h-[42px] px-4 sm:px-5 rounded-full text-[#e7e1d7]/85 text-[12.5px] sm:text-[13.5px] font-normal tracking-[-0.01em] whitespace-nowrap transition-[transform,color,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-white hover:border-white/25 hover:!bg-white/[0.08] hover:-translate-y-[1.5px] active:scale-[0.97] cursor-pointer"
                >
                  <ProjectLinkIcon type={link.type} />
                  <span>{link.label ?? LINK_LABELS[link.type]}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

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
