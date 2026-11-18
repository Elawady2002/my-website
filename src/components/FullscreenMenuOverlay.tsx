"use client";

import React, { useState } from "react";
import { StylizedText } from "@/components/StylizedText";
import { siteConfig } from "@/data/site";

export const MENU_COLS = 14;

export type MenuPhase = "closed" | "opening" | "open" | "closing";

const MENU_STROKES = [
  // Row 0: Expressive double wave swoop
  "M 6 42 C 34 10, 68 54, 108 24 C 132 8, 152 38, 172 20",
  // Row 1: Orbital ribbon flick
  "M 8 34 C 38 56, 76 10, 106 32 C 128 48, 148 16, 172 28",
  // Row 2: Hand-drawn calligraphic curve + back-loop
  "M 6 38 C 36 10, 74 52, 114 20 C 138 4, 154 42, 172 28",
  // Row 3: Sharp editorial brushstroke
  "M 8 24 C 44 10, 56 50, 96 24 C 126 6, 144 46, 172 22",
];

interface FullscreenMenuOverlayProps {
  menuPhase: MenuPhase;
  contentRevealed: boolean;
  isOpen: boolean;
  showMenuLayer: boolean;
  hoveredIdx: number | null;
  onHoverIdxChange: (idx: number | null) => void;
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onLeadColRef: (idx: number, el: HTMLDivElement | null) => void;
  onMainColRef: (idx: number, el: HTMLDivElement | null) => void;
}

export function FullscreenMenuOverlay({
  menuPhase,
  contentRevealed,
  isOpen,
  showMenuLayer,
  hoveredIdx,
  onHoverIdxChange,
  onLinkClick,
  onLeadColRef,
  onMainColRef,
}: FullscreenMenuOverlayProps) {
  const [phoneCopied, setPhoneCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(siteConfig.contactSection.phoneValue);
    setPhoneCopied(true);
    window.setTimeout(() => setPhoneCopied(false), 1600);
  };

  return (
    <div
      data-menu-overlay=""
      data-phase={menuPhase}
      data-content-revealed={contentRevealed ? "true" : "false"}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-40 overflow-hidden ${
        showMenuLayer ? "visible" : "invisible pointer-events-none"
      } ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Two-Layer 14-Column Staircase Curtain (#f34213 Lead + #131210 Surface) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-[16px_repeat(6,minmax(0,1fr))_16px] md:grid-cols-[24px_repeat(12,minmax(0,1fr))_24px]"
      >
        {Array.from({ length: MENU_COLS }).map((_, idx) => (
          <div
            key={idx}
            className={`relative h-full -mr-px ${
              idx >= 8 ? "hidden md:block" : ""
            }`}
          >
            {/* Vermilion accent lead blade */}
            <div
              ref={(el) => onLeadColRef(idx, el)}
              style={{
                transformOrigin: "50% 0%",
                transform: "scaleY(0)",
              }}
              className="absolute inset-0 bg-[#f34213] will-change-transform"
            />
            {/* Obsidian architectural surface column */}
            <div
              ref={(el) => onMainColRef(idx, el)}
              style={{
                transformOrigin: "50% 0%",
                transform: "scaleY(0)",
              }}
              className="absolute inset-0 bg-[#131210] shadow-[inset_1px_0_0_rgba(231,225,215,0.08)] border-b border-[#e7e1d7]/15 will-change-transform"
            />
          </div>
        ))}
      </div>

      {/* Subtle Film Grain Over Menu Columns */}
      <div
        aria-hidden="true"
        className={`menu-grain pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          contentRevealed ? "opacity-[0.035]" : "opacity-0"
        }`}
      />

      {/* Inner 12-Column Architectural Menu Grid (Strict 2-stage: stays hidden until columns settle!) */}
      <div
        className={`relative z-10 h-full w-full overflow-y-auto md:overflow-hidden grid grid-cols-[16px_repeat(6,minmax(0,1fr))_16px] md:grid-cols-[24px_repeat(12,minmax(0,1fr))_24px] pt-24 sm:pt-28 pb-6 sm:pb-8 transition-opacity ${
          contentRevealed
            ? "opacity-100 duration-150 ease-out"
            : "opacity-0 duration-200 ease-in"
        }`}
      >
        {/* Left Metadata & Copyright Column (4 Individually Staggered Blocks) */}
        <div className="order-2 md:order-1 col-start-2 col-end-8 md:col-start-2 md:col-end-5 flex flex-col justify-between gap-8 pt-8 md:pt-2 md:pr-6">
          <div className="space-y-6">
            <div
              style={{ transitionDelay: contentRevealed ? "220ms" : "0ms" }}
              className={`transition-all ${
                contentRevealed
                  ? "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100 translate-y-0"
                  : "duration-150 ease-in opacity-0 translate-y-4"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/50">
                WRITE T<span className="playfair-o">o</span>
              </p>
              <a
                href={siteConfig.contactSection.mailHref}
                className="mt-1.5 inline-block text-[15px] lg:text-[18px] tracking-[-0.02em] text-[#e7e1d7] hover:text-[#f34213] transition-colors break-all"
              >
                <StylizedText
                  text={siteConfig.contactSection.mailValue.toLowerCase()}
                />
              </a>
            </div>

            <div
              style={{ transitionDelay: contentRevealed ? "265ms" : "0ms" }}
              className={`transition-all ${
                contentRevealed
                  ? "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100 translate-y-0"
                  : "duration-150 ease-in opacity-0 translate-y-4"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/50">
                PH<span className="playfair-o">o</span>NE
              </p>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="mt-1.5 inline-block text-[15px] lg:text-[18px] tracking-[-0.02em] text-[#e7e1d7] hover:text-[#f34213] transition-colors cursor-pointer text-left"
              >
                {phoneCopied ? (
                  <span className="text-[#f34213]">COPIED TO CLIPBOARD</span>
                ) : (
                  siteConfig.contactSection.phoneValue
                )}
              </button>
            </div>

            <div
              style={{ transitionDelay: contentRevealed ? "310ms" : "0ms" }}
              className={`transition-all ${
                contentRevealed
                  ? "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100 translate-y-0"
                  : "duration-150 ease-in opacity-0 translate-y-4"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/50">
                S<span className="playfair-o">o</span>CIALS
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {siteConfig.contactSection.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[15px] lg:text-[18px] tracking-[-0.02em] text-[#e7e1d7] hover:text-[#f34213] transition-colors"
                    >
                      <StylizedText text={social.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            style={{ transitionDelay: contentRevealed ? "355ms" : "0ms" }}
            className={`text-[11px] uppercase tracking-[0.06em] text-[#e7e1d7]/45 transition-all ${
              contentRevealed
                ? "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-100 translate-y-0"
                : "duration-150 ease-in opacity-0 translate-y-4"
            }`}
          >
            © 2026 <StylizedText text={siteConfig.domain} />. ALL RIGHTS RESERVED.
          </p>
        </div>

        {/* Right Primary Navigation List (Desktop cols 4..12 inside gutters) */}
        <nav
          aria-label="Fullscreen site navigation"
          className="order-1 md:order-2 col-start-2 col-end-8 md:col-start-5 md:col-end-14 self-center w-full"
        >
          <ul
            data-pointing={hoveredIdx !== null ? "true" : "false"}
            onMouseLeave={() => onHoverIdxChange(null)}
            className="menu-list w-full"
          >
            {siteConfig.navLinks.map((item, idx) => {
              const isRowHovered = hoveredIdx === idx;
              const isLast = idx === siteConfig.navLinks.length - 1;
              return (
                <li
                  key={item.label}
                  data-hovered={isRowHovered ? "true" : "false"}
                  onMouseEnter={() => onHoverIdxChange(idx)}
                  className="menu-row relative"
                >
                  {/* Top Row Hairline Rule (draws in Stage 2 after columns cover) */}
                  <div
                    aria-hidden="true"
                    style={{
                      transformOrigin: "0% 50%",
                      transform: contentRevealed ? "scaleX(1)" : "scaleX(0)",
                      transitionProperty: "transform",
                      transitionDuration: contentRevealed ? "560ms" : "180ms",
                      transitionTimingFunction: contentRevealed
                        ? "cubic-bezier(0.22, 1, 0.36, 1)"
                        : "ease-in",
                      transitionDelay: `${contentRevealed ? idx * 60 : 0}ms`,
                    }}
                    className="h-px w-full bg-[#e7e1d7]/20"
                  />

                  <a
                    href={item.href}
                    onClick={(e) => onLinkClick(e, item.href)}
                    onFocus={() => onHoverIdxChange(idx)}
                    onBlur={() => onHoverIdxChange(null)}
                    className="relative flex items-center w-full py-2.5 sm:py-3.5 focus:outline-none"
                  >
                    {/* Left Hand-Drawn Vermilion Brush Stroke */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[clamp(74px,11vw,160px)] h-[46px] sm:h-[62px] flex items-center"
                    >
                      <svg
                        viewBox="0 0 180 64"
                        fill="none"
                        className="w-full h-full overflow-visible"
                      >
                        <path
                          d={MENU_STROKES[idx % MENU_STROKES.length]}
                          stroke="#f34213"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pathLength={1}
                          style={{
                            strokeDasharray: 1,
                            strokeDashoffset: isRowHovered ? 0 : 1,
                            opacity: isRowHovered ? 1 : 0,
                            transitionProperty: "stroke-dashoffset, opacity",
                            transitionDuration: isRowHovered
                              ? "620ms, 120ms"
                              : "260ms, 220ms",
                            transitionTimingFunction:
                              "cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        />
                      </svg>
                    </span>

                    {/* Outer horizontal spring shift wraps inner vertical clip mask */}
                    <span className="menu-word-ink inline-block will-change-transform">
                      <span className="block overflow-hidden py-1 sm:py-1.5">
                        <span
                          style={{
                            transform: contentRevealed
                              ? "translate3d(0, 0%, 0)"
                              : menuPhase === "closing"
                              ? "translate3d(0, -28%, 0)"
                              : "translate3d(0, 114%, 0)",
                            transitionProperty: "transform",
                            transitionDuration: contentRevealed
                              ? "560ms"
                              : "180ms",
                            transitionTimingFunction: contentRevealed
                              ? "cubic-bezier(0.22, 1, 0.36, 1)"
                              : "ease-in",
                            transitionDelay: `${
                              contentRevealed ? 30 + idx * 50 : 0
                            }ms`,
                          }}
                          className="block text-[clamp(2.95rem,7.4vw,7rem)] leading-[0.94] tracking-[-0.04em] font-normal uppercase will-change-transform"
                        >
                          <StylizedText text={item.label} />
                        </span>
                      </span>
                    </span>
                  </a>

                  {/* Final Bottom Hairline Rule */}
                  {isLast && (
                    <div
                      aria-hidden="true"
                      style={{
                        transformOrigin: "0% 50%",
                        transform: contentRevealed ? "scaleX(1)" : "scaleX(0)",
                        transitionProperty: "transform",
                        transitionDuration: contentRevealed ? "560ms" : "180ms",
                        transitionTimingFunction: contentRevealed
                          ? "cubic-bezier(0.22, 1, 0.36, 1)"
                          : "ease-in",
                        transitionDelay: `${
                          contentRevealed ? (idx + 1) * 60 : 0
                        }ms`,
                      }}
                      className="h-px w-full bg-[#e7e1d7]/20"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
