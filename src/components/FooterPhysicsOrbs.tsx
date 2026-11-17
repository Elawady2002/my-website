"use client";

import React, { useEffect, useRef } from "react";

export function FooterPhysicsOrbs() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let started = false;
    let disposeScene: (() => void) | null = null;
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

      import("./footerOrbsScene").then(({ mountFooterOrbsScene }) => {
        if (disposed || !containerRef.current) return;
        disposeScene = mountFooterOrbsScene(containerRef.current);
      });
    };

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
    }, 1300);

    return () => {
      disposed = true;
      io.disconnect();
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      disposeScene?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-footer-orbs=""
      data-orbs-spawned="0"
      data-orbs-active-motion="0"
      aria-label="Interactive 3D tool stack spheres — click or drag to bounce"
      className="absolute inset-0 z-20"
    />
  );
}
