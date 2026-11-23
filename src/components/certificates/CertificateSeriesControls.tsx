"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CertificateSeriesLevel } from "@/data/site";

const CAPSULE_ARROW_BTN_CLS =
  "inline-flex h-7 w-7 items-center justify-center rounded-full text-[#e7e1d7]/65 hover:text-white hover:bg-white/[0.08] active:scale-90 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f34213]";

export interface CertificateSeriesControlsProps {
  series: readonly CertificateSeriesLevel[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onStep?: (delta: 1 | -1) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Compact glass capsule with prev/next arrows and equal micro-dots with a
 * GPU-sliding vermilion active indicator.
 */
export function CertificateSeriesControls({
  series,
  activeIndex,
  onSelect,
  onStep,
  ariaLabel,
  className = "",
}: CertificateSeriesControlsProps) {
  if (series.length < 2) return null;

  const stepBy = (delta: 1 | -1) => {
    if (onStep) {
      onStep(delta);
      return;
    }
    onSelect((activeIndex + delta + series.length) % series.length);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepBy(-1);
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        dir="ltr"
        className="voy-glass inline-flex h-9 items-center gap-1 rounded-full px-1.5"
      >
        <button
          type="button"
          aria-label="Previous certificate in track"
          onClick={() => stepBy(-1)}
          className={CAPSULE_ARROW_BTN_CLS}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <div
          role="tablist"
          aria-label={ariaLabel}
          onKeyDown={handleTabKeyDown}
          className="relative flex items-center"
        >
          {series.map((level, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={level.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${level.label} — ${level.level}`}
                onClick={() => onSelect(idx)}
                className="group flex h-7 w-5 items-center justify-center cursor-pointer focus:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 rounded-full bg-[#e7e1d7]/25 transition-colors duration-200 group-hover:bg-[#e7e1d7]/55"
                />
              </button>
            );
          })}

          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(${activeIndex * 20 + 7}px, -50%, 0)`,
            }}
            className="pointer-events-none absolute top-1/2 left-0 h-1.5 w-1.5 rounded-full bg-[#f34213] shadow-[0_0_8px_rgba(243,66,19,0.75)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        </div>

        <button
          type="button"
          aria-label="Next certificate in track"
          onClick={() => stepBy(1)}
          className={CAPSULE_ARROW_BTN_CLS}
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
