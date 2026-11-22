"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/dom";

const TRAIL_NODES = 22;

export function SmoothExperience({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    let rafId = 0;
    let calmFrames = 0;
    let disposed = false;

    const raf = (time: number) => {
      rafId = 0;
      if (disposed || document.hidden) return;
      lenis.raf(time);

      calmFrames =
        lenis.isScrolling === "smooth" || lenis.isScrolling === true
          ? 0
          : calmFrames + 1;

      if (calmFrames < 2) {
        rafId = window.requestAnimationFrame(raf);
      }
    };

    const wakeLenis = (forceWake = false) => {
      if (disposed || document.hidden || (lenis.isStopped && !forceWake)) return;
      calmFrames = 0;
      if (rafId !== 0) return;
      lenis.time = performance.now();
      rafId = window.requestAnimationFrame(raf);
    };

    const origScrollTo = lenis.scrollTo.bind(lenis);
    lenis.scrollTo = (target, options) => {
      origScrollTo(target, options);
      wakeLenis(Boolean(options?.force));
    };

    const unsubVirtual = lenis.on("virtual-scroll", () => wakeLenis(false));
    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (lenis.isScrolling === "smooth") {
        wakeLenis(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.scrollTo(0, 0);
        lenis.scrollTo(0, { immediate: true, force: true });
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      disposed = true;
      unsubVirtual();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dotEl = dotRef.current;
    if (
      !canvas ||
      !dotEl ||
      window.matchMedia("(pointer: coarse)").matches ||
      prefersReducedMotion()
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let dirtyHasBox = false;
    let dirtyMinX = 0;
    let dirtyMinY = 0;
    let dirtyMaxX = 0;
    let dirtyMaxY = 0;

    const resizeCanvas = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = vw;
      canvas.height = vh;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      dirtyHasBox = false;
    };
    resizeCanvas();

    let mouseX = vw * 0.5;
    let mouseY = vh * 0.5;
    let dotX = mouseX;
    let dotY = mouseY;
    let isVisible = false;
    let inHero = false;
    let isHovered = false;
    let trailAlpha = 0;
    let currentMode = "legacy";
    let rafId = 0;
    let scrollRafId = 0;
    let scrollTrailingTimer = 0;
    let lastScrollHitTestMs = 0;
    let canvasCleared = true;
    let canvasHidden = true;

    canvas.style.visibility = "hidden";

    const nodes = Array.from({ length: TRAIL_NODES }, () => ({
      x: mouseX,
      y: mouseY,
    }));

    const clearDirtyRegion = () => {
      if (canvasCleared) return;
      if (dirtyHasBox) {
        const cx = Math.max(0, Math.floor(dirtyMinX));
        const cy = Math.max(0, Math.floor(dirtyMinY));
        const cw = Math.min(vw, Math.ceil(dirtyMaxX)) - cx;
        const ch = Math.min(vh, Math.ceil(dirtyMaxY)) - cy;
        if (cw > 0 && ch > 0) ctx.clearRect(cx, cy, cw, ch);
        dirtyHasBox = false;
      } else {
        ctx.clearRect(0, 0, vw, vh);
      }
      canvasCleared = true;
    };

    const tick = () => {
      rafId = 0;
      if (!isVisible) return;

      const dotLerp = inHero ? 0.55 : 0.18;
      dotX += (mouseX - dotX) * dotLerp;
      dotY += (mouseY - dotY) * dotLerp;

      const scale = !inHero && isHovered ? 2.6 : 1;
      dotEl.style.transform = `translate3d(${dotX.toFixed(1)}px, ${dotY.toFixed(
        1
      )}px, 0) translate(-50%, -50%) scale(${scale})`;

      trailAlpha += ((inHero ? 1 : 0) - trailAlpha) * 0.16;

      if (inHero) {
        nodes[0].x += (mouseX - nodes[0].x) * 0.52;
        nodes[0].y += (mouseY - nodes[0].y) * 0.52;
      } else {
        nodes[0].x = mouseX;
        nodes[0].y = mouseY;
      }

      let chainLength = 0;
      let nextMinX = nodes[0].x;
      let nextMinY = nodes[0].y;
      let nextMaxX = nodes[0].x;
      let nextMaxY = nodes[0].y;

      for (let i = 1; i < TRAIL_NODES; i += 1) {
        const f = inHero ? Math.max(0.16, 0.42 - i * 0.012) : 0.6;
        nodes[i].x += (nodes[i - 1].x - nodes[i].x) * f;
        nodes[i].y += (nodes[i - 1].y - nodes[i].y) * f;
        const nx = nodes[i].x;
        const ny = nodes[i].y;
        if (nx < nextMinX) nextMinX = nx;
        if (nx > nextMaxX) nextMaxX = nx;
        if (ny < nextMinY) nextMinY = ny;
        if (ny > nextMaxY) nextMaxY = ny;
        chainLength += Math.hypot(nx - nodes[i - 1].x, ny - nodes[i - 1].y);
      }

      if (trailAlpha > 0.02 && chainLength > 1.5) {
        if (canvasHidden) {
          canvas.style.visibility = "visible";
          canvasHidden = false;
        }
        clearDirtyRegion();
        canvasCleared = false;
        dirtyMinX = nextMinX - 18;
        dirtyMinY = nextMinY - 18;
        dirtyMaxX = nextMaxX + 18;
        dirtyMaxY = nextMaxY + 18;
        dirtyHasBox = true;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        let prevX = nodes[0].x;
        let prevY = nodes[0].y;

        for (let i = 0; i < TRAIL_NODES - 1; i += 1) {
          const curr = nodes[i];
          const next = nodes[i + 1];
          const midX = (curr.x + next.x) * 0.5;
          const midY = (curr.y + next.y) * 0.5;
          const t = i / (TRAIL_NODES - 2);
          const alpha = 0.72 * Math.pow(1 - t, 1.35) * trailAlpha;

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
          ctx.lineWidth = Math.max(0.5, 8.5 * (1 - t));
          ctx.strokeStyle = `rgba(243, 66, 19, ${alpha.toFixed(3)})`;
          ctx.stroke();

          prevX = midX;
          prevY = midY;
        }
      } else {
        clearDirtyRegion();
        if (!canvasHidden && trailAlpha <= 0.005) {
          canvas.style.visibility = "hidden";
          canvasHidden = true;
        }
      }

      const dotSettled =
        Math.abs(mouseX - dotX) < 0.05 && Math.abs(mouseY - dotY) < 0.05;
      const trailSettled = inHero
        ? trailAlpha > 0.99 && chainLength < 0.2
        : trailAlpha <= 0.005 && chainLength < 0.2;

      if (dotSettled && trailSettled) {
        dotX = mouseX;
        dotY = mouseY;
        dotEl.style.transform = `translate3d(${dotX.toFixed(1)}px, ${dotY.toFixed(
          1
        )}px, 0) translate(-50%, -50%) scale(${scale})`;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const wakeCursor = () => {
      if (!isVisible || rafId !== 0) return;
      rafId = window.requestAnimationFrame(tick);
    };

    const syncMode = (target: HTMLElement | null) => {
      const prevInHero = inHero;
      if (target) {
        inHero = Boolean(target.closest("[data-hero-section]"));
        isHovered = Boolean(target.closest("a, button, [data-cursor-hover]"));
      } else {
        inHero = false;
        isHovered = false;
      }

      const nextMode = inHero
        ? isHovered
          ? "hover"
          : "default"
        : isHovered
        ? "legacy-hover"
        : "legacy";

      if (nextMode !== currentMode) {
        currentMode = nextMode;
        dotEl.setAttribute("data-mode", nextMode);
        wakeCursor();
      } else if (prevInHero !== inHero) {
        wakeCursor();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dotX = mouseX;
        dotY = mouseY;
        for (let i = 0; i < TRAIL_NODES; i += 1) {
          nodes[i].x = mouseX;
          nodes[i].y = mouseY;
        }
        dotEl.style.opacity = "1";
      }

      syncMode(e.target as HTMLElement | null);
      wakeCursor();
    };

    const runScrollHitTest = () => {
      if (!isVisible) return;
      lastScrollHitTestMs = performance.now();
      syncMode(
        document.elementFromPoint(mouseX, mouseY) as HTMLElement | null
      );
    };

    const onScroll = () => {
      if (!isVisible) return;
      if (scrollTrailingTimer !== 0) {
        window.clearTimeout(scrollTrailingTimer);
      }
      scrollTrailingTimer = window.setTimeout(() => {
        scrollTrailingTimer = 0;
        runScrollHitTest();
      }, 100);

      if (scrollRafId === 0 && performance.now() - lastScrollHitTestMs >= 80) {
        scrollRafId = window.requestAnimationFrame(() => {
          scrollRafId = 0;
          runScrollHitTest();
        });
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      inHero = false;
      trailAlpha = 0;
      dotEl.style.opacity = "0";
      if (!canvasCleared) {
        ctx.clearRect(0, 0, vw, vh);
        canvasCleared = true;
        dirtyHasBox = false;
      }
      if (!canvasHidden) {
        canvas.style.visibility = "hidden";
        canvasHidden = true;
      }
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (scrollTrailingTimer !== 0) {
        window.clearTimeout(scrollTrailingTimer);
        scrollTrailingTimer = 0;
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mouseleave", onMouseLeave);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      if (scrollRafId !== 0) window.cancelAnimationFrame(scrollRafId);
      if (scrollTrailingTimer !== 0) window.clearTimeout(scrollTrailingTimer);
    };
  }, []);

  return (
    <>
      {children}
      <canvas
        ref={canvasRef}
        data-cursor-canvas=""
        aria-hidden="true"
        className="hidden md:block pointer-events-none fixed inset-0 z-[59]"
      />
      <div
        ref={dotRef}
        data-cursor-dot=""
        data-mode="legacy"
        aria-hidden="true"
        className="hidden md:block pointer-events-none fixed top-0 left-0 z-[60] rounded-full will-change-transform"
        style={{ opacity: 0 }}
      />
    </>
  );
}
