"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { StylizedText } from "@/components/StylizedText";
import { siteConfig } from "@/data/site";

interface WordToken {
  word: string;
  chars: { char: string; globalIndex: number; isO: boolean }[];
}

export function AboutSection() {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const narrativeRef = useRef<HTMLDivElement | null>(null);

  const { words, totalChars } = useMemo(() => {
    const rawWords = siteConfig.aboutSection.waveHeading.split(" ");
    let cursor = 0;
    const mapped: WordToken[] = rawWords.map((word) => ({
      word,
      chars: Array.from(word).map((char) => {
        const idx = cursor;
        cursor += 1;
        return {
          char,
          globalIndex: idx,
          isO: char === "O" || char === "o",
        };
      }),
    }));
    return { words: mapped, totalChars: cursor };
  }, []);

  useEffect(() => {
    const updateWave = () => {
      const headingEl = headingRef.current;
      if (!headingEl) return;

      const vh = window.innerHeight || 900;
      const rect = headingEl.getBoundingClientRect();
      const rawProgress = (vh * 0.86 - rect.top) / (vh * 0.58);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const wavePos = progress * 1.24 - 0.12;
      const denom = Math.max(1, totalChars - 1);

      for (let i = 0; i < totalChars; i += 1) {
        const el = charRefs.current[i];
        if (!el) continue;

        const t = i / denom;
        const delta = wavePos - t;

        if (delta < -0.09) {
          el.style.color = "rgba(231, 225, 215, 0.18)";
          el.style.transform = "translate3d(0, 0px, 0)";
        } else if (delta <= 0.05) {
          const u = (delta + 0.09) / 0.14;
          const bell = Math.sin(u * Math.PI);

          if (u < 0.5) {
            const k = u * 2;
            const r = Math.round(231 + (243 - 231) * k);
            const g = Math.round(225 + (66 - 225) * k);
            const b = Math.round(215 + (19 - 215) * k);
            const a = 0.18 + (1 - 0.18) * k;
            el.style.color = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
          } else {
            const k = (u - 0.5) * 2;
            const r = Math.round(243 + (231 - 243) * k);
            const g = Math.round(66 + (225 - 66) * k);
            const b = Math.round(19 + (215 - 19) * k);
            el.style.color = `rgb(${r}, ${g}, ${b})`;
          }

          el.style.transform = `translate3d(0, ${(-3 * bell).toFixed(2)}px, 0)`;
        } else {
          el.style.color = "#e7e1d7";
          el.style.transform = "translate3d(0, 0px, 0)";
        }
      }
    };

    updateWave();
    window.addEventListener("scroll", updateWave, { passive: true });
    window.addEventListener("resize", updateWave);
    return () => {
      window.removeEventListener("scroll", updateWave);
      window.removeEventListener("resize", updateWave);
    };
  }, [totalChars]);

  useEffect(() => {
    const el = narrativeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "true");
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      className="relative z-10 w-full bg-[#0b0b0b] px-4 sm:px-6 pt-32 sm:pt-44 pb-24 sm:pb-32"
    >
      {/* Scroll-Scrubbed Gradient Wave Display Heading */}
      <h2
        ref={headingRef}
        aria-label={siteConfig.aboutSection.waveHeading}
        className="w-full text-[clamp(2.35rem,6vw,5.5rem)] leading-[1.06] tracking-[-0.025em] font-normal uppercase"
      >
        {words.map((token, wIdx) => (
          <span
            key={`${token.word}-${wIdx}`}
            aria-hidden="true"
            className="inline-block whitespace-nowrap mr-[0.26em]"
          >
            {token.chars.map((item) => (
              <span
                key={item.globalIndex}
                ref={(el) => {
                  charRefs.current[item.globalIndex] = el;
                }}
                style={{ color: "rgba(231, 225, 215, 0.18)" }}
                className={`inline-block will-change-[color,transform] ${
                  item.isO ? "playfair-o" : ""
                }`}
              >
                {item.char}
              </span>
            ))}
          </span>
        ))}
      </h2>

      {/* Two-Column 3/9 Narrative Grid */}
      <div id="about-narrative" ref={narrativeRef} className="mt-20 sm:mt-28">
        <div className="about-reveal-line h-px w-full bg-[#e7e1d7]/20" />

        <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left 3 Columns */}
          <div
            style={{ "--about-delay": "90ms" } as React.CSSProperties}
            className="about-reveal-item md:col-span-3"
          >
            <h6 className="text-[13px] sm:text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7]/70">
              <StylizedText text={siteConfig.aboutSection.eyebrow} />
            </h6>
          </div>

          {/* Right 9 Columns */}
          <div className="md:col-span-9 max-w-[820px] space-y-6">
            {siteConfig.aboutSection.paragraphs.map((paragraph, pIdx) => (
              <p
                key={pIdx}
                style={
                  {
                    "--about-delay": `${160 + pIdx * 90}ms`,
                  } as React.CSSProperties
                }
                className="about-reveal-item text-[18px] sm:text-[22px] leading-[1.55] font-normal text-[#e7e1d7]/85"
              >
                {paragraph}
              </p>
            ))}

            <p
              style={{ "--about-delay": "340ms" } as React.CSSProperties}
              className="about-reveal-item text-[18px] sm:text-[22px] leading-[1.5] font-medium text-[#e7e1d7]"
            >
              {siteConfig.aboutSection.closingLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
