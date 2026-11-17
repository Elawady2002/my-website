"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

const TRAIL_NODES = 22;

export function SmoothExperience({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dotEl = dotRef.current;
    if (!canvas || !dotEl) return;

    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    const nodes = Array.from({ length: TRAIL_NODES }, () => ({
      x: mouseX,
      y: mouseY,
    }));

    const syncMode = (target: HTMLElement | null) => {
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
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const target = e.target as HTMLElement | null;

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

      syncMode(target);
    };

    const onScroll = () => {
      if (!isVisible) return;
      const underPointer = document.elementFromPoint(
        mouseX,
        mouseY
      ) as HTMLElement | null;
      syncMode(underPointer);
    };

    const onMouseLeave = () => {
      isVisible = false;
      inHero = false;
      trailAlpha = 0;
      dotEl.style.opacity = "0";
      ctx.clearRect(0, 0, vw, vh);
    };

    let rafId = 0;
    const tick = () => {
      const dotLerp = inHero ? 0.55 : 0.18;
      dotX += (mouseX - dotX) * dotLerp;
      dotY += (mouseY - dotY) * dotLerp;

      const scale = !inHero && isHovered ? 2.6 : 1;
      dotEl.style.transform = `translate3d(${dotX.toFixed(1)}px, ${dotY.toFixed(
        1
      )}px, 0) translate(-50%, -50%) scale(${scale})`;

      trailAlpha += ((inHero && isVisible ? 1 : 0) - trailAlpha) * 0.16;

      if (inHero) {
        nodes[0].x += (mouseX - nodes[0].x) * 0.52;
        nodes[0].y += (mouseY - nodes[0].y) * 0.52;
      } else {
        nodes[0].x = mouseX;
        nodes[0].y = mouseY;
      }

      let chainLength = 0;
      for (let i = 1; i < TRAIL_NODES; i += 1) {
        const f = inHero ? Math.max(0.16, 0.42 - i * 0.012) : 0.6;
        nodes[i].x += (nodes[i - 1].x - nodes[i].x) * f;
        nodes[i].y += (nodes[i - 1].y - nodes[i].y) * f;
        chainLength += Math.hypot(
          nodes[i].x - nodes[i - 1].x,
          nodes[i].y - nodes[i - 1].y
        );
      }

      ctx.clearRect(0, 0, vw, vh);

      if (isVisible && trailAlpha > 0.02 && chainLength > 1.5) {
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
      }

      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("mouseleave", onMouseLeave);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.cancelAnimationFrame(rafId);
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
