"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CertificateSeriesLevel } from "@/data/site";

const SERIES_ARROW_BTN_CLS =
  "voy-glass inline-flex h-9 w-9 items-center justify-center rounded-full text-[#e7e1d7]/80 hover:text-white hover:border-[#f34213]/60 active:scale-95 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:border-[#f34213]";

export interface CertificateSeriesControlsProps {
  series: readonly CertificateSeriesLevel[];
  activeIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Arrow and dot switcher for multi-certificate series inside a single 3D frame.
 */
export function CertificateSeriesControls({
  series,
  activeIndex,
  onSelect,
  ariaLabel,
  className = "",
}: CertificateSeriesControlsProps) {
  if (series.length < 2) return null;

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onSelect((activeIndex + 1) % series.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSelect((activeIndex - 1 + series.length) % series.length);
    }
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        aria-label="Previous certificate in track"
        onClick={() =>
          onSelect((activeIndex - 1 + series.length) % series.length)
        }
        className={SERIES_ARROW_BTN_CLS}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleTabKeyDown}
        className="flex items-center justify-center gap-1"
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
              className="group p-1.5 cursor-pointer focus:outline-none"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-7 bg-[#f34213] shadow-[0_0_12px_rgba(243,66,19,0.65)]"
                    : "w-2 bg-[#e7e1d7]/25 group-hover:bg-[#e7e1d7]/60"
                }`}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Next certificate in track"
        onClick={() => onSelect((activeIndex + 1) % series.length)}
        className={SERIES_ARROW_BTN_CLS}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
