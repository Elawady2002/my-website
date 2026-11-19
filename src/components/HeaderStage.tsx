"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { StylizedText } from "@/components/StylizedText";
import { InfoSection } from "@/components/InfoSection";
import { siteConfig } from "@/data/site";

function MaskedChars({
  text,
  baseDelayMs = 220,
  stepMs = 28,
}: {
  text: string;
  baseDelayMs?: number;
  stepMs?: number;
}) {
  return (
    <>
      {Array.from(text).map((char, idx) => {
        const isO = char === "O" || char === "o";
        return (
          <span key={idx} className="inline-block overflow-hidden align-top">
            <span
              data-intro-char=""
              style={{
                animation: `heroCharReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${
                  baseDelayMs + idx * stepMs
                }ms both`,
              }}
              className={`inline-block ${isO ? "playfair-o" : ""}`}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        );
      })}
    </>
  );
}

export function HeaderStage() {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const portraitCardRef = useRef<HTMLDivElement | null>(null);
  const portraitInnerRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const titleWrapRef = useRef<HTMLDivElement | null>(null);
  const starScrollRef = useRef<HTMLDivElement | null>(null);

  const targetMouseRef = useRef({ x: 0, y: 0 });
  const curMouseRef = useRef({ x: 0, y: 0 });
  const isHeaderNearRef = useRef(true);
  const heroRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const heroRectDirtyRef = useRef(true);
  const portraitSizeRef = useRef({ w: 450, h: 750 });
  const wakeTiltRef = useRef<() => void>(() => {});

  useEffect(() => {
    let vh = window.innerHeight || 900;
    let lastProgress = -1;
    let lastStarY = -1;

    const syncPortraitSize = () => {
      const inner = portraitInnerRef.current;
      if (inner) {
        portraitSizeRef.current = {
          w: inner.clientWidth || 450,
          h: inner.clientHeight || 750,
        };
      }
    };

    const updateOnScroll = () => {
      heroRectDirtyRef.current = true;
      const y = window.scrollY;
      const progress = Math.min(1, Math.max(0, y / (vh * 0.85)));

      if (progress !== lastProgress && portraitCardRef.current) {
        lastProgress = progress;
        const eased = 1 - Math.pow(1 - progress, 1.6);
        const scale = 1 - eased * 0.14;
        const translateY = -eased * 18;
        portraitCardRef.current.style.transform = `translate3d(0, ${translateY.toFixed(
          1
        )}px, 0) scale(${scale.toFixed(4)})`;
      }

      if (
        isHeaderNearRef.current &&
        y !== lastStarY &&
        starScrollRef.current
      ) {
        lastStarY = y;
        starScrollRef.current.style.transform = `rotate(${(y * 0.28).toFixed(
          1
        )}deg)`;
      }
    };

    const handleResize = () => {
      vh = window.innerHeight || 900;
      heroRectDirtyRef.current = true;
      lastProgress = -1;
      lastStarY = -1;
      syncPortraitSize();
      updateOnScroll();
    };

    const headerEl = headerRef.current;
    let io: IntersectionObserver | null = null;
    if (headerEl) {
      io = new IntersectionObserver(
        (entries) => {
          const near = entries.some((entry) => entry.isIntersecting);
          isHeaderNearRef.current = near;
          if (near) {
            headerEl.setAttribute("data-in-view", "true");
            updateOnScroll();
            wakeTiltRef.current();
          } else {
            headerEl.removeAttribute("data-in-view");
          }
        },
        { rootMargin: "200px 0px", threshold: 0 }
      );
      io.observe(headerEl);
    }

    syncPortraitSize();
    updateOnScroll();
    window.addEventListener("scroll", updateOnScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", updateOnScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    let disposed = false;

    const applyTilt = () => {
      const cur = curMouseRef.current;
      if (portraitInnerRef.current) {
        portraitInnerRef.current.style.transform = `perspective(1100px) rotateY(${(
          cur.x * 7.5
        ).toFixed(2)}deg) rotateX(${(-cur.y * 5.5).toFixed(
          2
        )}deg) translate3d(${(cur.x * 18).toFixed(1)}px, ${(cur.y * 12).toFixed(
          1
        )}px, 0) scale(1.075)`;
      }

      if (glowRef.current) {
        const { w, h } = portraitSizeRef.current;
        glowRef.current.style.transform = `translate3d(${(cur.x * w).toFixed(
          1
        )}px, ${(cur.y * h).toFixed(1)}px, 0)`;
      }

      if (titleWrapRef.current) {
        titleWrapRef.current.style.transform = `translate3d(${(
          -cur.x * 10
        ).toFixed(1)}px, ${(-cur.y * 4).toFixed(1)}px, 0)`;
      }
    };

    const tick = () => {
      rafId = 0;
      if (disposed || !isHeaderNearRef.current) return;

      const target = targetMouseRef.current;
      const cur = curMouseRef.current;
      const dx = target.x - cur.x;
      const dy = target.y - cur.y;

      if (Math.abs(dx) <= 0.0004 && Math.abs(dy) <= 0.0004) {
        cur.x = target.x;
        cur.y = target.y;
        applyTilt();
        return;
      }

      cur.x += dx * 0.085;
      cur.y += dy * 0.085;
      applyTilt();
      rafId = window.requestAnimationFrame(tick);
    };

    wakeTiltRef.current = () => {
      if (disposed || !isHeaderNearRef.current || rafId !== 0) return;
      const target = targetMouseRef.current;
      const cur = curMouseRef.current;
      if (
        Math.abs(target.x - cur.x) > 0.0004 ||
        Math.abs(target.y - cur.y) > 0.0004
      ) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    applyTilt();

    return () => {
      disposed = true;
      wakeTiltRef.current = () => {};
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const syncHeroRect = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    heroRectRef.current = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
    heroRectDirtyRef.current = false;
    return heroRectRef.current;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    syncHeroRect(e.currentTarget);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect =
      !heroRectRef.current || heroRectDirtyRef.current
        ? syncHeroRect(e.currentTarget)
        : heroRectRef.current;
    targetMouseRef.current.x = (e.clientX - rect.left) / rect.width - 0.5;
    targetMouseRef.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    wakeTiltRef.current();
  };

  const handleMouseLeave = () => {
    targetMouseRef.current.x = 0;
    targetMouseRef.current.y = 0;
    wakeTiltRef.current();
  };

  return (
    <div
      id="header"
      ref={headerRef}
      data-in-view="true"
      className="relative w-full bg-[#0b0b0b] overflow-x-clip"
    >
      {/* Shared Sticky Pinned Portrait Backdrop (-mb-[100svh] overlays Hero & Info cleanly) */}
      <div className="sticky top-0 h-svh w-full pointer-events-none z-0 -mb-[100svh] overflow-hidden">
        <div
          ref={portraitCardRef}
          style={{
            transformOrigin: "center top",
          }}
          className="portrait-mask-x absolute top-6 bottom-0 left-1/2 -translate-x-1/2 md:left-[25.5%] md:translate-x-0 w-[84vw] max-w-[460px] md:max-w-[66svh] md:w-[31.5vw] md:min-w-[390px] max-h-[calc(84vw*1.75)] md:max-h-[calc(31.5vw*1.82)] overflow-hidden will-change-transform"
        >
          <div
            data-intro-portrait=""
            style={{
              animation:
                "portraitIntro 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
            className="portrait-mask-y relative h-full w-full overflow-hidden"
          >
            <div
              ref={portraitInnerRef}
              className="relative h-full w-full will-change-transform"
            >
              <Image
                src={siteConfig.portraitSrc}
                alt={siteConfig.portraitAlt}
                fill
                preload
                fetchPriority="high"
                quality={85}
                sizes="(max-width: 768px) 84vw, (max-width: 1536px) 32vw, 600px"
                className="object-cover object-[50%_14%]"
              />
              {/* Cursor-reactive vermilion rim-light glow (GPU-composited layer) */}
              <div
                ref={glowRef}
                className="pointer-events-none absolute left-1/2 top-1/2 -ml-[340px] -mt-[340px] h-[680px] w-[680px] opacity-90 will-change-transform"
                style={{
                  background:
                    "radial-gradient(340px circle at 50% 50%, rgba(243, 66, 19, 0.24), transparent 70%)",
                }}
              />
            </div>

            {/* Stationary elliptical studio spotlight vignette outside tilting inner layer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "inset 0 0 36px 20px #0b0b0b",
                background:
                  "radial-gradient(ellipse 52% 56% at 52% 42%, transparent 42%, rgba(11, 11, 11, 0.5) 70%, rgba(11, 11, 11, 0.94) 88%, #0b0b0b 96%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Hero Viewport */}
      <section
        ref={heroSectionRef}
        data-hero-section=""
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 min-h-svh w-full px-4 sm:px-6 flex flex-col justify-between pb-28 sm:pb-28"
      >
        {/* Top Metadata Row */}
        <div
          style={{
            animation:
              "heroFadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both",
          }}
          className="pt-6 flex items-center justify-between text-[12px] sm:text-[14px] font-normal uppercase tracking-[0.04em] text-[#e7e1d7]"
        >
          <span data-intro-fade="" className="inline-block">
            <StylizedText text={siteConfig.domain} />
          </span>
          <span data-intro-fade="" className="inline-block">
            <StylizedText text={siteConfig.edition} />
          </span>
        </div>

        {/* Lower Hero Stack */}
        <div className="mt-auto pt-36 sm:pt-44">
          {/* Subheader 3-Zone Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4 pb-5">
            <div
              data-intro-fade=""
              style={{
                animation:
                  "heroFadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both",
              }}
              className="md:col-span-5"
            >
              <span className="text-[13px] sm:text-[14px] uppercase tracking-[0.04em] text-[#e7e1d7]">
                {siteConfig.greeting}
              </span>
            </div>

            <div data-intro-fade="" className="md:col-span-3 flex items-center md:justify-center">
              <div ref={starScrollRef} className="will-change-transform">
                <svg
                  data-hero-star=""
                  width="42"
                  height="48"
                  viewBox="0 0 42 48"
                  fill="none"
                  aria-hidden="true"
                  className="h-10 w-10 text-[#f34213] animate-[spin_24s_linear_infinite]"
                >
                  <path
                    d="M21 0L22.1089 20.2315C22.1536 21.0354 23.0188 21.5299 23.7418 21.1641L42 11.999L24.8507 23.0654C24.1683 23.5036 24.1683 24.4924 24.8507 24.9346L42 36.001L23.7418 26.8359C23.0147 26.4701 22.1536 26.9646 22.1089 27.7685L21 48L19.8911 27.7685C19.8464 26.9646 18.9812 26.4701 18.2582 26.8359L0 35.997L17.1493 24.9306C17.8317 24.4924 17.8317 23.5036 17.1493 23.0614L0 11.999L18.2582 21.1641C18.9812 21.5299 19.8464 21.0354 19.8911 20.2315L21 0Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <div
              data-intro-fade=""
              style={{
                animation:
                  "heroFadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both",
              }}
              className="md:col-span-4 md:justify-self-end max-w-[320px]"
            >
              <p className="text-[15px] sm:text-[16px] leading-[1.45] font-normal text-[#e7e1d7]">
                {siteConfig.tagline}
              </p>
            </div>
          </div>

          {/* Full-Width Hairline Divider */}
          <div
            data-intro-line=""
            style={{
              animation:
                "heroLineDraw 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both",
            }}
            className="h-px w-full origin-left bg-[#e7e1d7]/20"
          />

          {/* Giant 2-Line Character-Staggered Display Title with Counter-Parallax */}
          <div
            ref={titleWrapRef}
            className="pt-4 sm:pt-5 select-none will-change-transform"
          >
            <h1 className="w-full text-[9.1vw] sm:text-[9.5vw] leading-[0.88] tracking-[-0.035em] font-normal uppercase text-[#e7e1d7] whitespace-nowrap">
              <MaskedChars
                text={siteConfig.heroLine1}
                baseDelayMs={200}
                stepMs={26}
              />
              <span className="block text-right text-[#f34213] mt-1 text-[11vw] sm:text-[10.4vw]">
                <MaskedChars
                  text={siteConfig.heroLine2}
                  baseDelayMs={580}
                  stepMs={40}
                />
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* SECTION 2: Info & Services (Shares the Sticky Portrait) */}
      <InfoSection />
    </div>
  );
}
