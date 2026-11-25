"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StylizedText } from "@/components/ui/StylizedText";
import { siteConfig } from "@/data/site";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { useRevealOnView } from "@/hooks/useRevealOnView";
import { formatCairoClock12h } from "@/lib/bookingSlots";
import { scrollToTarget } from "@/lib/dom";

const INFO_REVEAL_OPTS = { threshold: 0.16 };

export function InfoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const magnetic = useMagneticHover<HTMLAnchorElement>({
    xFactor: 0.16,
    yFactor: 0.2,
  });

  useRevealOnView(sectionRef, INFO_REVEAL_OPTS);

  useEffect(() => {
    const formatClock = () => {
      if (!clockRef.current) return;
      clockRef.current.textContent = `${siteConfig.infoSection.timezoneCity} ${formatCairoClock12h()}`;
    };
    formatClock();
    const timer = window.setInterval(formatClock, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToTarget(siteConfig.infoSection.ctaHref);
  };

  return (
    <section
      id="info"
      ref={sectionRef}
      className="relative z-10 min-h-[680px] px-4 sm:px-6 py-24 sm:py-32 flex items-center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        <div className="lg:col-span-3">
          <h2 className="text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7]">
            <StylizedText text={siteConfig.infoSection.label} />
          </h2>
        </div>

        <div className="hidden lg:block lg:col-span-4" aria-hidden="true" />

        <div className="lg:col-span-5 flex flex-col justify-between gap-12">
          <div>
            {siteConfig.infoSection.rows.map((row, idx) => (
              <div
                key={row.label}
                style={{ "--row-delay": `${idx * 90}ms` } as React.CSSProperties}
              >
                <div className="info-line h-px w-full bg-[#e7e1d7]/20" />
                <div className="info-row-content py-4 flex items-baseline justify-between gap-4 text-[13px] sm:text-[14px] uppercase tracking-[0.04em]">
                  <span className="text-[#e7e1d7]/65 shrink-0">
                    <StylizedText text={row.label} />
                  </span>

                  {row.value === "LIVE_CLOCK" ? (
                    <span
                      ref={clockRef}
                      className="text-right text-[#e7e1d7] tabular-nums"
                    >
                      {siteConfig.infoSection.timezoneCity} --:--
                    </span>
                  ) : (
                    <span className="text-right text-[#e7e1d7]">
                      <StylizedText text={row.value} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div
              style={{ "--row-delay": "450ms" } as React.CSSProperties}
              className="info-line h-px w-full bg-[#e7e1d7]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={siteConfig.infoSection.ctaHref}
              onClick={handleCtaClick}
              onMouseEnter={magnetic.onMouseEnter}
              onMouseMove={magnetic.onMouseMove}
              onMouseLeave={magnetic.onMouseLeave}
              className="group relative inline-flex h-[50px] items-center gap-3 overflow-hidden rounded-full border border-[#e7e1d7]/25 bg-white/[0.04] px-7 text-[13px] font-normal uppercase tracking-[0.06em] text-[#e7e1d7] backdrop-blur-xs transition-transform duration-200 ease-out"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-y-full bg-[#f34213] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
              />
              <span className="relative z-10 transition-colors duration-200 group-hover:text-[#0b0b0b] group-hover:font-medium">
                <StylizedText text={siteConfig.infoSection.ctaLabel} />
              </span>
              <span
                aria-hidden="true"
                className="relative z-10 h-1.5 w-1.5 rounded-full bg-[#f34213] transition-all duration-300 group-hover:scale-125 group-hover:bg-[#0b0b0b]"
              />
            </a>

            <Link
              href={siteConfig.resumeHref}
              className="voy-glass inline-flex h-[50px] items-center gap-2 rounded-full px-6 text-[13px] font-normal uppercase tracking-[0.06em] text-[#e7e1d7]/85 transition-[transform,color,background-color,border-color] duration-200 ease-out hover:text-white hover:border-white/25 hover:!bg-white/[0.08]"
            >
              <span>
                <StylizedText text="RESUME / CV" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
