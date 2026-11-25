"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { FooterPhysicsOrbs } from "@/components/ui/FooterPhysicsOrbs";
import { StylizedText } from "@/components/ui/StylizedText";
import { WhatsAppQrBadge } from "@/components/ui/WhatsAppQrBadge";
import { siteConfig } from "@/data/site";
import { useClipboardCopy } from "@/hooks/useClipboardCopy";
import { useRevealOnView } from "@/hooks/useRevealOnView";

const MARQUEE_REPEATS = [0, 1, 2] as const;

const FOOTER_REVEAL_OPTS = {
  threshold: [0, 0.14],
  rootMargin: "120px 0px",
  revealRatio: 0.14,
  trackInView: true,
};

const MarqueeSequence = React.memo(function MarqueeSequence() {
  return (
    <div className="flex items-baseline shrink-0">
      {MARQUEE_REPEATS.map((idx) => (
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
  const { copied: phoneCopied, copy } = useClipboardCopy();

  useRevealOnView(footerRef, FOOTER_REVEAL_OPTS);

  return (
    <footer
      id="contact"
      ref={footerRef}
      className="relative z-10 w-full min-h-svh flex flex-col bg-[#0b0b0b] px-4 sm:px-6 pt-[84px] sm:pt-[104px] pb-6"
    >
      <div className="relative flex-1 min-h-[620px] sm:min-h-[680px] w-full rounded-[20px] sm:rounded-[24px] bg-[#0e0d0c] border border-[#e7e1d7]/[0.08] overflow-hidden flex flex-col justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 24% 98%, rgba(243, 66, 19, 0.68) 0%, rgba(168, 42, 10, 0.28) 45%, rgba(11, 11, 11, 0) 78%)",
          }}
        />

        <FooterPhysicsOrbs />

        <div className="pointer-events-none relative z-10 px-6 sm:px-10 pt-7 flex items-center justify-between text-[12px] sm:text-[14px] font-normal uppercase tracking-[0.04em] text-[#e7e1d7]">
          <span>
            <StylizedText text={siteConfig.domain} />
          </span>
          <span>
            <StylizedText text={siteConfig.edition} />
          </span>
        </div>

        <div className="pointer-events-none relative mt-auto pt-44 sm:pt-52">
          <div className="relative z-30 px-6 sm:px-10 pb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <div data-footer-obstacle="" className="pointer-events-auto space-y-5">
              <div
                style={{ "--footer-delay": "80ms" } as React.CSSProperties}
                className="footer-reveal-item flex items-center gap-4"
              >
                <div>
                  <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                    <StylizedText text={siteConfig.contactSection.phoneLabel} />
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(siteConfig.contactSection.phoneValue)}
                    className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] hover:translate-x-1 transition-all duration-200 cursor-pointer text-left"
                  >
                    {phoneCopied ? (
                      <span className="text-[#f34213]">COPIED!</span>
                    ) : (
                      <StylizedText text={siteConfig.contactSection.phoneValue} />
                    )}
                  </button>
                </div>
                <WhatsAppQrBadge href={siteConfig.contactSection.whatsappHref} />
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

            <div
              data-footer-obstacle=""
              className="pointer-events-auto grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-5 sm:text-right"
            >
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

              <div
                style={{ "--footer-delay": "280ms" } as React.CSSProperties}
                className="footer-reveal-item"
              >
                <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                  <StylizedText text="RESUME" />
                </p>
                <Link
                  href={siteConfig.resumeHref}
                  className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] sm:hover:-translate-x-1 transition-all duration-200"
                >
                  <StylizedText text="VIEW / PDF" />
                </Link>
              </div>

              <div
                style={{ "--footer-delay": "360ms" } as React.CSSProperties}
                className="footer-reveal-item"
              >
                <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]/55">
                  <StylizedText text="CREDENTIALS" />
                </p>
                <Link
                  href="/certificates"
                  className="mt-1 inline-block text-[14px] sm:text-[16px] uppercase tracking-[0.04em] text-[#e7e1d7] hover:text-[#f34213] sm:hover:-translate-x-1 transition-all duration-200"
                >
                  <StylizedText text="ARCHIVE" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 sm:px-10">
            <div
              data-footer-divider=""
              className="footer-reveal-line h-px w-full bg-[#e7e1d7]/20"
            />
          </div>

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
