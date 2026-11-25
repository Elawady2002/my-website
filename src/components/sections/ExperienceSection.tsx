"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StylizedText, StylizedWords } from "@/components/ui/StylizedText";
import { siteConfig } from "@/data/site";
import { useRevealOnView } from "@/hooks/useRevealOnView";

const EXP_REVEAL_OPTS = { threshold: 0.12 };

export function ExperienceSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { eyebrow, heading, roles, recognition } = siteConfig.experienceSection;

  useRevealOnView(sectionRef, EXP_REVEAL_OPTS);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative z-10 w-full bg-[#0b0b0b] px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-28"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="exp-reveal-line h-px w-full bg-[#e7e1d7]/20" />

        <div
          style={{ "--exp-delay": "70ms" } as React.CSSProperties}
          className="exp-reveal-item pt-8 sm:pt-10 flex flex-wrap items-baseline justify-between gap-4"
        >
          <div>
            <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.06em] text-[#e7e1d7]/60">
              <StylizedText text={eyebrow} />
            </p>
            <h2 className="mt-3 text-[clamp(2.35rem,5.2vw,4.75rem)] leading-[0.94] tracking-[-0.03em] font-normal uppercase text-[#e7e1d7]">
              <StylizedText text={heading} />
            </h2>
          </div>

          <Link
            href="/certificates"
            className="voy-glass inline-flex h-[42px] items-center gap-2 rounded-full px-5 text-[12px] uppercase tracking-[0.06em] text-[#e7e1d7]/85 hover:text-white hover:border-white/25 transition-colors"
          >
            <span>View Credentials Archive</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#f34213]" aria-hidden="true" />
          </Link>
        </div>

        {/* Experience Roles List */}
        <div className="mt-12 sm:mt-16 border-b border-[#e7e1d7]/15">
          {roles.map((item, idx) => (
            <article
              key={item.id}
              style={{ "--exp-delay": `${120 + idx * 90}ms` } as React.CSSProperties}
              className="exp-reveal-item border-t border-[#e7e1d7]/15 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
            >
              <div className="lg:col-span-5 flex items-baseline gap-4 sm:gap-6">
                <span className="text-[12px] tabular-nums tracking-[0.08em] text-[#f34213] shrink-0">
                  {item.number}
                </span>
                <div>
                  <h3 className="text-[21px] sm:text-[26px] leading-[1.15] tracking-[-0.02em] font-normal uppercase text-[#e7e1d7]">
                    <StylizedWords text={item.role} />
                  </h3>
                  <p className="mt-2 text-[13px] uppercase tracking-[0.06em] text-[#e7e1d7]/65">
                    {item.company} · {item.scope} · {item.location}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <p className="text-[16px] sm:text-[18px] leading-[1.6] text-[#e7e1d7]/85">
                  {item.summary}
                </p>
                <ul className="space-y-2">
                  {item.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-3 text-[14px] sm:text-[15px] leading-[1.55] text-[#e7e1d7]/65"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f34213]"
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Compact Selected Recognition Strip */}
        <div
          style={{ "--exp-delay": "340ms" } as React.CSSProperties}
          className="exp-reveal-item mt-12 sm:mt-14"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-5">
            <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.06em] text-[#e7e1d7]/55">
              <StylizedText text="SELECTED RECOGNITION" />
            </p>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] text-[#f34213] hover:text-[#ff5629] transition-colors"
            >
              <span>Explore Credentials</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recognition.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-[#e7e1d7]/12 bg-[#121110] p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#f34213]">
                    {rec.issuer}
                  </p>
                  <h4 className="mt-2 text-[15px] sm:text-[16px] uppercase tracking-[-0.01em] text-[#e7e1d7]">
                    <StylizedWords text={rec.title} />
                  </h4>
                </div>
                <p className="text-[13px] leading-[1.5] text-[#e7e1d7]/60">
                  {rec.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
