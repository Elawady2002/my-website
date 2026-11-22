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

    const io = new IntersectionObserver(
      (entries) => {
        if (started || disposed) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        io.disconnect();

        import("@/three/footerOrbsScene").then(({ mountFooterOrbsScene }) => {
          if (disposed || !containerRef.current) return;
          disposeScene = mountFooterOrbsScene(containerRef.current);
        });
      },
      { rootMargin: "650px 0px", threshold: 0 }
    );
    io.observe(container);

    return () => {
      disposed = true;
      io.disconnect();
      disposeScene?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="region"
      data-footer-orbs=""
      data-orbs-spawned="0"
      data-orbs-active-motion="0"
      aria-label="Interactive 3D tool stack spheres — click or drag to bounce"
      className="absolute inset-0 z-20"
    />
  );
}
