"use client";

import React, { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { StylizedText } from "@/components/StylizedText";
import { siteConfig } from "@/data/site";

export function InfoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "true");
          }
        });
      },
      { threshold: 0.16 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const formatClock = () => {
      if (!clockRef.current) return;
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: siteConfig.infoSection.timezoneIana,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
        .format(new Date())
        .replace(/\s+/g, " ")
        .toUpperCase();
      clockRef.current.textContent = `${siteConfig.infoSection.timezoneCity} ${formatted}`;
    };

    formatClock();
    const timer = window.setInterval(formatClock, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCtaMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate3d(${(dx * 0.16).toFixed(1)}px, ${(
      dy * 0.2
    ).toFixed(1)}px, 0)`;
  };

  const handleCtaLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "translate3d(0px, 0px, 0)";
  };

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    const target = document.querySelector<HTMLElement>(
      siteConfig.infoSection.ctaHref
    );
    if (target) {
      if (lenis) lenis.scrollTo(target, { duration: 1.2 });
      else target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="info"
      ref={sectionRef}
      className="relative z-10 min-h-[680px] px-4 sm:px-6 py-24 sm:py-32 flex items-center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* Left: ABOUT Section Label */}
        <div className="lg:col-span-3">
          <h6 className="text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7]">
            <StylizedText text={siteConfig.infoSection.label} />
          </h6>
        </div>

        {/* Center: Open Space Framing Pinned Sticky Portrait */}
        <div className="hidden lg:block lg:col-span-4" aria-hidden="true" />

        {/* Right: 5 Staggered Metadata Rows + Magnetic VIEW WORK CTA */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-12">
          <div>
            {siteConfig.infoSection.rows.map((row, idx) => {
              const delayStyle = {
                "--row-delay": `${idx * 90}ms`,
              } as React.CSSProperties;

              return (
                <div key={row.label} style={delayStyle}>
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
              );
            })}
            <div
              style={{ "--row-delay": "450ms" } as React.CSSProperties}
              className="info-line h-px w-full bg-[#e7e1d7]/20"
            />
          </div>

          {/* Magnetic Pill CTA */}
          <a
            href={siteConfig.infoSection.ctaHref}
            onClick={handleCtaClick}
            onMouseMove={handleCtaMove}
            onMouseLeave={handleCtaLeave}
            className="group relative self-start inline-flex h-[50px] items-center gap-3 overflow-hidden rounded-full border border-[#e7e1d7]/25 bg-white/[0.04] px-7 text-[13px] font-normal uppercase tracking-[0.06em] text-[#e7e1d7] backdrop-blur-xs transition-transform duration-200 ease-out"
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
        </div>
      </div>
    </section>
  );
}
