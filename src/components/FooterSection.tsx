"use client";

import React, { useEffect, useRef, useState } from "react";
import { StylizedText } from "@/components/StylizedText";
import { FooterPhysicsOrbs } from "@/components/FooterPhysicsOrbs";
import { siteConfig } from "@/data/site";

const MarqueeSequence = React.memo(function MarqueeSequence() {
  const repeats = [0, 1, 2];
  return (
    <div className="flex items-baseline shrink-0">
      {repeats.map((idx) => (
        <span
          key={idx}
          className="inline-flex items-baseline text-[15vw] sm:text-[12.2vw] leading-[0.88] tracking-[-0.03em] font-normal uppercase whitespace-nowrap mr-10 sm:mr-14"
        >
          <span className="text-[#e7e1d7]">
            <StylizedText text={siteConfig.contactSection.marqueePrimary} />
          </span>
          <span className="text-[#f34213]">
            <StylizedText text={siteConfig.contactSection.marqueeAccent} />
          </span>
        </span>
      ))}
    </div>
  );
});

export function FooterSection() {
  const footerRef = useRef<HTMLElement | null>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(siteConfig.contactSection.phoneValue);
    setPhoneCopied(true);
    window.setTimeout(() => setPhoneCopied(false), 1600);
  };

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute("data-in-view", "true");
            if (entry.intersectionRatio >= 0.14) {
              el.setAttribute("data-revealed", "true");
            }
          } else {
            el.removeAttribute("data-in-view");
          }
        });
      },
      { threshold: [0, 0.14], rootMargin: "120px 0px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <footer
      id="contact"
      ref={footerRef}
      className="relative z-10 w-full bg-[#0b0b0b] px-4 sm:px-6 pt-12 pb-6"
    >
      <div className="relative min-h-[620px] sm:min-h-[680px] w-full rounded-[20px] sm:rounded-[24px] bg-[#0e0d0c] border border-[#e7e1d7]/[0.08] overflow-hidden flex flex-col justify-between">
        {/* Bottom-Left Burnt Vermilion Studio Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 24% 98%, rgba(243, 66, 19, 0.68) 0%, rgba(168, 42, 10, 0.28) 45%, rgba(11, 11, 11, 0) 78%)",
          }}
        />

        {/* Interactive Glossy 3D Physics Medallions (z-20: bounce over Marquee divider, under z-30 Links) */}
        <FooterPhysicsOrbs />

        {/* Top Bar */}
        <div className="pointer-events-none relative z-10 px-6 sm:px-10 pt-7 flex items-center justify-between text-[12px] sm:text-[14px] font-normal uppercase tracking-[0.04em] text-[#e7e1d7]">
          <span>
            <StylizedText text={siteConfig.domain} />
          </span>
          <span>
            <StylizedText text={siteConfig.edition} />
          </span>
        </div>

        {/* Lower Contact Stack + Divider + Marquee */}
        <div className="pointer-events-none relative mt-auto pt-44 sm:pt-52">
          {/* 2-Column Contact Links */}
          <div className="relative z-30 px-6 sm:px-10 pb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            {/* Left Column: Phone & Mail */}
            <div data-footer-obstacle="" className="pointer-events-auto space-y-5">
              <div
                style={{ "--footer-delay": "80ms" } as React.CSSProperties}
                className="footer-reveal-item"
              >
                <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                  <StylizedText text={siteConfig.contactSection.phoneLabel} />
                </p>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] hover:translate-x-1 transition-all duration-200 cursor-pointer text-left"
                >
                  {phoneCopied ? (
                    <span className="text-[#f34213]">COPIED!</span>
                  ) : (
                    <StylizedText text={siteConfig.contactSection.phoneValue} />
                  )}
                </button>
              </div>

              <div
                style={{ "--footer-delay": "160ms" } as React.CSSProperties}
                className="footer-reveal-item"
              >
                <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                  <StylizedText text={siteConfig.contactSection.mailLabel} />
                </p>
                <a
                  href={siteConfig.contactSection.mailHref}
                  className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] hover:translate-x-1 transition-all duration-200"
                >
                  <StylizedText text={siteConfig.contactSection.mailValue} />
                </a>
              </div>
            </div>

            {/* Right Column: Socials */}
            <div data-footer-obstacle="" className="pointer-events-auto space-y-5 sm:text-right">
              {siteConfig.contactSection.socials.map((social, idx) => (
                <div
                  key={social.label}
                  style={
                    {
                      "--footer-delay": `${120 + idx * 80}ms`,
                    } as React.CSSProperties
                  }
                  className="footer-reveal-item"
                >
                  <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                    <StylizedText text={social.label} />
                  </p>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] sm:hover:-translate-x-1 transition-all duration-200"
                  >
                    <StylizedText text={social.handle} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="relative z-10 px-6 sm:px-10">
            <div data-footer-divider="" className="footer-reveal-line h-px w-full bg-[#e7e1d7]/20" />
          </div>

          {/* Giant Continuous Infinite Marquee (z-10 behind z-20 Interactive Medallions) */}
          <div
            aria-hidden="true"
            className="relative z-10 pt-3 pb-2 overflow-hidden select-none"
          >
            <div className="footer-marquee-track">
              <MarqueeSequence />
              <MarqueeSequence />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
