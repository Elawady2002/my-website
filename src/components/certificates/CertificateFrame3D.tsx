"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CertificateFrameFormat, CertificateItem } from "@/data/site";
import type { CertificateFrameController } from "@/three/certificateFrameScene";

const FALLBACK_FRAME_CLASSES: Record<CertificateFrameFormat, string> = {
  landscape: "w-full max-w-[480px] aspect-[3.59/2.66]",
  "landscape-4x3": "w-full max-w-[460px] aspect-[3.4/2.66]",
  portrait: "h-full max-h-[500px] w-auto max-w-full aspect-[2.66/3.59]",
};

export interface CertificateFrame3DProps {
  certificate: CertificateItem;
  className?: string;
  allowWideOrbit?: boolean;
}

export function CertificateFrame3D({
  certificate,
  className = "",
  allowWideOrbit = false,
}: CertificateFrame3DProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<CertificateFrameController | null>(null);
  const latestCertRef = useRef(certificate);
  const lastAppliedIdRef = useRef(certificate.id);
  const stageRectRef = useRef<DOMRect | null>(null);
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [isNearView, setIsNearView] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  useEffect(() => {
    latestCertRef.current = certificate;
    if (ctrlRef.current && lastAppliedIdRef.current !== certificate.id) {
      lastAppliedIdRef.current = certificate.id;
      ctrlRef.current.setCertificate(certificate);
    }
  }, [certificate]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        setIsNearView(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "320px 0px", threshold: 0 }
    );
    io.observe(el);

    const invalidateRect = () => {
      stageRectRef.current = null;
    };
    window.addEventListener("resize", invalidateRect, { passive: true });
    window.addEventListener("scroll", invalidateRect, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("resize", invalidateRect);
      window.removeEventListener("scroll", invalidateRect);
    };
  }, []);

  useEffect(() => {
    if (!isNearView || webglFailed) return;
    if (!canvasHostRef.current) return;

    let disposed = false;

    import("@/three/certificateFrameScene")
      .then(({ mountCertificateFrameScene }) => {
        if (disposed || !canvasHostRef.current) return;
        const currentCert = latestCertRef.current;
        lastAppliedIdRef.current = currentCert.id;
        ctrlRef.current = mountCertificateFrameScene({
          container: canvasHostRef.current,
          certificate: currentCert,
          allowWideOrbit,
          onWebglFailed: () => {
            if (!disposed) {
              setWebglFailed(true);
              setWebglReady(false);
            }
          },
        });
        setWebglReady(true);
      })
      .catch(() => {
        if (!disposed) {
          setWebglFailed(true);
          setWebglReady(false);
        }
      });

    return () => {
      disposed = true;
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
      setWebglReady(false);
    };
  }, [isNearView, webglFailed, allowWideOrbit]);

  const getRect = (el: HTMLElement) => {
    if (!stageRectRef.current) stageRectRef.current = el.getBoundingClientRect();
    return stageRectRef.current;
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    stageRectRef.current = e.currentTarget.getBoundingClientRect();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setIsDraggingUI(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      ctrlRef.current?.setDraggingDelta(dx, dy);
      return;
    }

    if (e.pointerType !== "touch" && ctrlRef.current) {
      const rect = getRect(e.currentTarget);
      const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
      ctrlRef.current.setPointerNormalized(nx, ny);
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDraggingUI(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    ctrlRef.current?.endDrag();
  };

  const handlePointerLeave = () => {
    stageRectRef.current = null;
    if (!draggingRef.current) ctrlRef.current?.resetPose();
  };

  return (
    <div
      ref={outerRef}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={() => ctrlRef.current?.resetPose()}
      className={`relative bg-transparent select-none touch-pan-y ${
        isDraggingUI ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
    >
      {!webglReady ? (
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
          <div
            className={`relative rounded-[4px] p-[14px] sm:p-[18px] ${
              FALLBACK_FRAME_CLASSES[certificate.frameFormat ?? "landscape"]
            }`}
            style={{
              background:
                "linear-gradient(135deg, #4b2f1d 0%, #2b180d 52%, #3f2617 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.55), 0 24px 48px rgba(0,0,0,0.55)",
            }}
          >
            <div className="relative h-full w-full overflow-hidden border border-[#c9a66b]/70 bg-[#181614] flex flex-col items-center justify-center text-center shadow-[inset_0_4px_14px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-sky-100/10">
              {certificate.imageSrc ? (
                <Image
                  src={certificate.imageSrc}
                  alt={certificate.title}
                  fill
                  sizes="(max-width: 640px) 92vw, 480px"
                  quality={75}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#f6f1e7] px-5 py-4 flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#5c5246]">
                    {certificate.issuer}
                  </span>
                  <span className="mt-2 text-[9px] uppercase tracking-[0.22em] text-[#9c7a3c]">
                    CERTIFICATE OF ACHIEVEMENT
                  </span>
                  <p className="mt-2.5 text-[13px] sm:text-[16px] font-semibold uppercase tracking-[-0.01em] text-[#171412] leading-tight">
                    {certificate.title}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.12em] text-[#6e6459]">
                    <span>{certificate.issuedDate}</span>
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: certificate.accentColor }}
                    />
                    <span>{certificate.details}</span>
                  </div>
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-0 shadow-[inset_0_4px_14px_rgba(10,6,3,0.42)]"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 55% at 24% 18%, rgba(255,252,248,0.11) 0%, rgba(235,245,255,0.035) 48%, rgba(14,20,28,0.025) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={canvasHostRef}
        className={`relative z-10 h-full w-full ${
          webglReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
