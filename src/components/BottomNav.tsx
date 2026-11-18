"use client";

import React, { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import { StylizedText } from "@/components/StylizedText";
import { BookingModal, type PopoverAnchorBox } from "@/components/BookingModal";
import { siteConfig } from "@/data/site";
import { playModalClose, playModalOpen } from "@/lib/bookingAudio";

type MenuPhase = "closed" | "opening" | "open" | "closing";

const MENU_COLS = 14;

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

function formatCairoTime(): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: siteConfig.infoSection.timezoneIana,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date())
      .replace(/\s+/g, " ")
      .toUpperCase();
  } catch {
    return "1:00 PM";
  }
}

function springEase(u: number): number {
  const clamped = Math.max(0, Math.min(1, u));
  return 1 - Math.pow(1 - clamped, 4.2);
}

export function BottomNav() {
  const [menuPhase, setMenuPhase] = useState<MenuPhase>("closed");
  const [contentRevealed, setContentRevealed] = useState(false);
  const [isNavDocked, setIsNavDocked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [cairoTime, setCairoTime] = useState("--:--");
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingAnchorBox, setBookingAnchorBox] =
    useState<PopoverAnchorBox | null>(null);
  const [bookingSessionKey, setBookingSessionKey] = useState(0);
  const [bookingOpenedAtMs, setBookingOpenedAtMs] = useState(0);

  const navBarRef = useRef<HTMLDivElement | null>(null);
  const dockGroupRef = useRef<HTMLDivElement | null>(null);
  const pillNavRef = useRef<HTMLElement | null>(null);
  const pillLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navDotRef = useRef<HTMLSpanElement | null>(null);
  const leadColRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainColRefs = useRef<(HTMLDivElement | null)[]>([]);

  const leadScalesRef = useRef<number[]>(Array(MENU_COLS).fill(0));
  const mainScalesRef = useRef<number[]>(Array(MENU_COLS).fill(0));
  const rafRef = useRef<number | null>(null);
  const isNavDockedRef = useRef(false);
  const menuPhaseRef = useRef<MenuPhase>("closed");
  const activeTabRef = useRef<string>("home");
  const scrollSpyLockedRef = useRef<boolean>(false);
  const scrollSpyTimerRef = useRef<number | null>(null);
  const syncOnScrollRef = useRef<() => void>(() => {});

  const isOpen = menuPhase === "opening" || menuPhase === "open";
  const showMenuLayer = menuPhase !== "closed";

  useEffect(() => {
    isNavDockedRef.current = isNavDocked;
    syncOnScrollRef.current();
  }, [isNavDocked]);

  useEffect(() => {
    menuPhaseRef.current = menuPhase;
  }, [menuPhase]);

  useEffect(() => {
    if (!isBookingOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl?.closest("[data-booking-popover]") ||
        dockGroupRef.current?.contains(targetEl as Node)
      ) {
        return;
      }
      playModalClose();
      setIsBookingOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playModalClose();
        setIsBookingOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isBookingOpen]);

  useEffect(() => {
    const syncClock = () => setCairoTime(formatCairoTime());
    const initTimer = window.setTimeout(syncClock, 0);
    const interval = window.setInterval(syncClock, 15000);
    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateDot = (tabId: string) => {
      const dotEl = navDotRef.current;
      if (!dotEl) return;
      const idx = siteConfig.pillNavLinks.findIndex((item) => item.id === tabId);
      const linkEl = pillLinkRefs.current[idx >= 0 ? idx : 0];
      if (!linkEl) return;
      const centerX = linkEl.offsetLeft + linkEl.offsetWidth * 0.5 - 2.5;
      dotEl.style.transform = `translate3d(${centerX.toFixed(1)}px, 0, 0)`;
      dotEl.style.opacity = "1";
    };

    updateDot(activeTab);

    let activeObserver: ResizeObserver | null = null;
    if (pillNavRef.current) {
      activeObserver = new ResizeObserver(() => updateDot(activeTabRef.current));
      activeObserver.observe(pillNavRef.current);
    }
    const fontPromise = document.fonts?.ready;
    let cancelled = false;
    fontPromise?.then(() => {
      if (!cancelled) updateDot(activeTabRef.current);
    });

    return () => {
      cancelled = true;
      activeObserver?.disconnect();
    };
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    let lastNavYStr = "";
    const metrics = {
      vh: 900,
      docHeight: 4000,
      barHeight: 102,
      infoTop: Number.POSITIVE_INFINITY,
      workTop: Number.POSITIVE_INFINITY,
      contactTop: Number.POSITIVE_INFINITY,
    };

    const syncOnScroll = () => {
      const y = window.scrollY;

      const el = navBarRef.current;
      if (el) {
        const maxOffset = Math.max(0, metrics.vh - metrics.barHeight);
        const progress = Math.min(1, Math.max(0, y / (metrics.vh * 0.65)));
        const eased = 1 - Math.pow(1 - progress, 2.2);
        const yOffset = isNavDockedRef.current ? 0 : maxOffset * (1 - eased);
        const nextYStr = yOffset.toFixed(1);
        if (nextYStr !== lastNavYStr) {
          lastNavYStr = nextYStr;
          el.style.transform = `translate3d(0, ${nextYStr}px, 0)`;
        }
      }

      if (scrollSpyLockedRef.current) return;
      const probeY = y + metrics.vh * 0.38;

      let nextTab = "home";
      if (
        y + metrics.vh >= metrics.docHeight - 80 ||
        metrics.contactTop <= probeY
      ) {
        nextTab = "connect";
      } else if (metrics.workTop <= probeY) {
        nextTab = "work";
      } else if (metrics.infoTop <= probeY) {
        nextTab = "about";
      }

      if (nextTab !== activeTabRef.current) {
        activeTabRef.current = nextTab;
        setActiveTab(nextTab);
      }
    };

    const measureLayout = () => {
      const y = window.scrollY;
      const vh = window.innerHeight || 900;
      const docHeight = document.documentElement.scrollHeight;
      const el = navBarRef.current;
      const barHeight =
        el?.offsetHeight || (window.innerWidth >= 768 ? 102 : 76);

      const contactEl = document.querySelector<HTMLElement>("#contact");
      const workIntroEl =
        document.querySelector<HTMLElement>("#work-intro") ||
        document.querySelector<HTMLElement>("#work");
      const infoEl = document.querySelector<HTMLElement>("#info");

      metrics.vh = vh;
      metrics.docHeight = docHeight;
      metrics.barHeight = barHeight;
      metrics.contactTop = contactEl
        ? contactEl.getBoundingClientRect().top + y
        : Number.POSITIVE_INFINITY;
      metrics.workTop = workIntroEl
        ? workIntroEl.getBoundingClientRect().top + y
        : Number.POSITIVE_INFINITY;
      metrics.infoTop = infoEl
        ? infoEl.getBoundingClientRect().top + y
        : Number.POSITIVE_INFINITY;

      syncOnScroll();
    };

    syncOnScrollRef.current = syncOnScroll;
    measureLayout();

    const initTimer = window.setTimeout(measureLayout, 60);
    const resizeObserver = new ResizeObserver(measureLayout);
    resizeObserver.observe(document.documentElement);
    if (navBarRef.current) {
      resizeObserver.observe(navBarRef.current);
    }

    document.fonts?.ready.then(() => {
      if (!cancelled) measureLayout();
    });

    window.addEventListener("scroll", syncOnScroll, { passive: true });
    window.addEventListener("resize", measureLayout);

    return () => {
      cancelled = true;
      syncOnScrollRef.current = () => {};
      window.clearTimeout(initTimer);
      if (scrollSpyTimerRef.current !== null) {
        window.clearTimeout(scrollSpyTimerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("scroll", syncOnScroll);
      window.removeEventListener("resize", measureLayout);
    };
  }, []);

  const stopMenuRaf = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopMenuRaf();
      (window as unknown as { __lenis?: Lenis }).__lenis?.start();
    };
  }, []);

  const applyColumnScale = (idx: number, leadVal: number, mainVal: number) => {
    leadScalesRef.current[idx] = leadVal;
    mainScalesRef.current[idx] = mainVal;
    const leadEl = leadColRefs.current[idx];
    const mainEl = mainColRefs.current[idx];
    if (leadEl) {
      leadEl.style.transform = `scaleY(${leadVal.toFixed(4)})`;
    }
    if (mainEl) {
      mainEl.style.transform = `scaleY(${mainVal.toFixed(4)})`;
    }
  };

  const scrollToTarget = (selector: string | null) => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (!selector) {
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = document.querySelector<HTMLElement>(selector);
    if (target) {
      if (lenis) lenis.scrollTo(target, { duration: 1.2 });
      else target.scrollIntoView({ behavior: "smooth" });
    } else if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openMenu = () => {
    stopMenuRaf();
    setIsBookingOpen(false);
    setHoveredIdx(null);
    setContentRevealed(false);
    setIsNavDocked(true);
    setMenuPhase("opening");
    (window as unknown as { __lenis?: Lenis }).__lenis?.stop();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      for (let i = 0; i < MENU_COLS; i += 1) {
        applyColumnScale(i, 1, 1);
      }
      setContentRevealed(true);
      setMenuPhase("open");
      return;
    }

    const isDesktop = window.innerWidth >= 768;
    const visibleCount = isDesktop ? MENU_COLS : 8;
    const anchorCol = isDesktop ? 12 : 6;

    const startLead = [...leadScalesRef.current];
    const startMain = [...mainScalesRef.current];

    const colTimings = Array.from({ length: MENU_COLS }, (_, idx) => {
      const clampedIdx = Math.min(idx, visibleCount - 1);
      const dist = Math.abs(clampedIdx - anchorCol);
      return {
        leadStart: dist * 16,
        leadDur: 440,
        mainStart: 65 + dist * 16,
        mainDur: 480,
      };
    });

    const contentRevealAt = 460;
    const totalOpenMs = Math.max(
      ...colTimings.slice(0, visibleCount).map((t) => t.mainStart + t.mainDur)
    );

    let revealedTriggered = false;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      for (let i = 0; i < MENU_COLS; i += 1) {
        const t = colTimings[i];
        const lu = (elapsed - t.leadStart) / t.leadDur;
        const mu = (elapsed - t.mainStart) / t.mainDur;
        const leadS = startLead[i] + (1 - startLead[i]) * springEase(lu);
        const mainS = startMain[i] + (1 - startMain[i]) * springEase(mu);
        applyColumnScale(i, leadS, mainS);
      }

      if (!revealedTriggered && elapsed >= contentRevealAt) {
        revealedTriggered = true;
        setContentRevealed(true);
      }

      if (elapsed >= totalOpenMs) {
        for (let i = 0; i < MENU_COLS; i += 1) {
          applyColumnScale(i, 1, 1);
        }
        if (!revealedTriggered) {
          setContentRevealed(true);
        }
        setMenuPhase("open");
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  const closeMenu = (scrollTarget?: string | null) => {
    stopMenuRaf();
    setHoveredIdx(null);
    setContentRevealed(false);
    setMenuPhase("closing");
    // Keep #nav docked at top during content fade + staircase retraction
    setIsNavDocked(true);
    (window as unknown as { __lenis?: Lenis }).__lenis?.start();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      for (let i = 0; i < MENU_COLS; i += 1) {
        applyColumnScale(i, 0, 0);
      }
      setIsNavDocked(false);
      setMenuPhase("closed");
      if (scrollTarget !== undefined) scrollToTarget(scrollTarget);
      return;
    }

    const isDesktop = window.innerWidth >= 768;
    const visibleCount = isDesktop ? MENU_COLS : 8;
    const anchorCol = isDesktop ? 12 : 6;
    const maxDist = Math.max(anchorCol, visibleCount - 1 - anchorCol);

    const startLead = [...leadScalesRef.current];
    const startMain = [...mainScalesRef.current];

    const colTimings = Array.from({ length: MENU_COLS }, (_, idx) => {
      const clampedIdx = Math.min(idx, visibleCount - 1);
      // Reverse inward wave: outermost column retracts first back to toggle column
      const revDist = maxDist - Math.abs(clampedIdx - anchorCol);
      return {
        mainStart: 120 + revDist * 22,
        mainDur: 460,
        leadStart: 185 + revDist * 22,
        leadDur: 440,
      };
    });

    const scrollStartAt = 160;
    const releaseNavAt = 540;
    const totalCloseMs = Math.max(
      ...colTimings.slice(0, visibleCount).map((t) => t.leadStart + t.leadDur)
    );

    let scrollTriggered = false;
    let navReleased = false;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (!scrollTriggered && elapsed >= scrollStartAt) {
        scrollTriggered = true;
        if (scrollTarget !== undefined) {
          scrollToTarget(scrollTarget);
        }
      }

      if (!navReleased && elapsed >= releaseNavAt) {
        navReleased = true;
        setIsNavDocked(false);
      }

      for (let i = 0; i < MENU_COLS; i += 1) {
        const t = colTimings[i];
        const mu = (elapsed - t.mainStart) / t.mainDur;
        const lu = (elapsed - t.leadStart) / t.leadDur;
        const mainS = startMain[i] * (1 - springEase(mu));
        const leadS = startLead[i] * (1 - springEase(lu));
        applyColumnScale(i, leadS, mainS);
      }

      if (elapsed >= totalCloseMs) {
        for (let i = 0; i < MENU_COLS; i += 1) {
          applyColumnScale(i, 0, 0);
        }
        if (!navReleased) {
          setIsNavDocked(false);
        }
        setMenuPhase("closed");
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        (menuPhaseRef.current === "open" || menuPhaseRef.current === "opening")
      ) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    btn.style.transform = `translate3d(${(dx * 0.22).toFixed(1)}px, ${(
      dy * 0.22
    ).toFixed(1)}px, 0) scale(1.04)`;
  };

  const handleMagneticLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translate3d(0px, 0px, 0) scale(1)";
  };

  const handleTopClick = () => {
    lockScrollSpy("home");
    if (isOpen) {
      closeMenu(null);
    } else {
      scrollToTarget(null);
    }
  };

  const lockScrollSpy = (tabId: string) => {
    scrollSpyLockedRef.current = true;
    if (scrollSpyTimerRef.current !== null) {
      window.clearTimeout(scrollSpyTimerRef.current);
    }
    scrollSpyTimerRef.current = window.setTimeout(() => {
      scrollSpyLockedRef.current = false;
      scrollSpyTimerRef.current = null;
    }, 950);
    activeTabRef.current = tabId;
    setActiveTab(tabId);
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const mappedTab =
      href === "#contact"
        ? "connect"
        : href === "#work"
        ? "work"
        : href === "#info" || href === "#about"
        ? "about"
        : "home";
    lockScrollSpy(mappedTab);
    closeMenu(href);
  };

  const handlePillClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof siteConfig.pillNavLinks)[number]
  ) => {
    e.preventDefault();
    setIsBookingOpen(false);
    lockScrollSpy(item.id);
    scrollToTarget(item.id === "home" ? null : item.href);
  };

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(siteConfig.contactSection.phoneValue);
    setPhoneCopied(true);
    window.setTimeout(() => setPhoneCopied(false), 1600);
  };

  const computeAnchorBox = (): PopoverAnchorBox => {
    const r = dockGroupRef.current?.getBoundingClientRect();
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 900;
    if (!r) {
      return { left: (vw - 340) * 0.5, width: 340, bottom: 96, openUpward: true };
    }
    const isSmUp = vw >= 640;
    const width = isSmUp ? r.width : Math.min(340, vw - 24);
    const left = isSmUp ? r.left : (vw - width) * 0.5;
    const openUpward = r.top > vh * 0.48;
    return openUpward
      ? { left, width, bottom: vh - r.top + 12, openUpward: true }
      : { left, width, top: r.bottom + 12, openUpward: false };
  };

  return (
    <>
      {/* Architectural 14-Column Fullscreen Menu Overlay */}
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
                ref={(el) => {
                  leadColRefs.current[idx] = el;
                }}
                style={{
                  transformOrigin: "50% 0%",
                  transform: "scaleY(0)",
                }}
                className="absolute inset-0 bg-[#f34213] will-change-transform"
              />
              {/* Obsidian architectural surface column */}
              <div
                ref={(el) => {
                  mainColRefs.current[idx] = el;
                }}
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
              © 2026 <StylizedText text={siteConfig.domain} />. ALL RIGHTS
              RESERVED.
            </p>
          </div>

          {/* Right Primary Navigation List (Desktop cols 4..12 inside gutters) */}
          <nav
            aria-label="Fullscreen site navigation"
            className="order-1 md:order-2 col-start-2 col-end-8 md:col-start-5 md:col-end-14 self-center w-full"
          >
            <ul
              data-pointing={hoveredIdx !== null ? "true" : "false"}
              onMouseLeave={() => setHoveredIdx(null)}
              className="menu-list w-full"
            >
              {siteConfig.navLinks.map((item, idx) => {
                const isRowHovered = hoveredIdx === idx;
                const isLast = idx === siteConfig.navLinks.length - 1;
                return (
                  <li
                    key={item.label}
                    data-hovered={isRowHovered ? "true" : "false"}
                    onMouseEnter={() => setHoveredIdx(idx)}
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
                      onClick={(e) => handleLinkClick(e, item.href)}
                      onFocus={() => setHoveredIdx(idx)}
                      onBlur={() => setHoveredIdx(null)}
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
                          transform: contentRevealed
                            ? "scaleX(1)"
                            : "scaleX(0)",
                          transitionProperty: "transform",
                          transitionDuration: contentRevealed
                            ? "560ms"
                            : "180ms",
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

      {/* Persistent Fixed Corner & Center Glass Pill Header Bar */}
      <div
        id="nav"
        ref={navBarRef}
        style={{ transform: "translate3d(0, calc(100svh - 102px), 0)" }}
        className={`fixed inset-x-0 top-0 z-50 px-3 py-4 md:p-6 flex items-center justify-between pointer-events-none will-change-transform ${
          showMenuLayer || isNavDocked
            ? "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            : ""
        }`}
      >
        {/* Left 3D Monogram Button (Unified Translucent Glass) */}
        <div data-intro-fade="">
          <button
            type="button"
            onClick={handleTopClick}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
            aria-label="Scroll to top"
            className="voy-glass pointer-events-auto h-[44px] w-[44px] md:h-[54px] md:w-[54px] rounded-[12px] md:rounded-[14px] flex items-center justify-center transition-transform duration-200 ease-out cursor-pointer"
          >
            <svg
              viewBox="0 0 32 32"
              className="h-6 w-6 md:h-7 md:w-7"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="monogramChrome"
                  x1="12"
                  y1="4"
                  x2="28"
                  y2="26"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#d4d4d8" />
                  <stop offset="100%" stopColor="#f34213" />
                </linearGradient>
              </defs>
              <path
                d="M17 3H25V10.5H17V3ZM7 11.5H17V21.5H25V29H15.5C10.8 29 7 25.2 7 20.5V11.5Z"
                fill="#f34213"
              />
              <path
                d="M17 11.5H25V17.5H17V11.5Z"
                fill="url(#monogramChrome)"
              />
            </svg>
          </button>
        </div>

        {/* Center Floating Translucent Glass Pill Navbar + Standalone Calendar Circle (Visible when Menu is Closed) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            ref={dockGroupRef}
            data-intro-fade=""
            className="relative flex items-center gap-1.5 sm:gap-2 md:gap-2.5"
          >
            <nav
              ref={pillNavRef}
              data-glass-pill=""
              aria-label="Quick section navigation"
              aria-hidden={isOpen}
              className={`voy-glass relative flex items-center justify-center h-[42px] sm:h-[44px] md:h-[50px] px-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen
                  ? "opacity-0 scale-95 pointer-events-none"
                  : "opacity-100 scale-100 pointer-events-auto"
              }`}
            >
              {siteConfig.pillNavLinks.map((item, idx) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    ref={(el) => {
                      pillLinkRefs.current[idx] = el;
                    }}
                    href={item.href}
                    onClick={(e) => handlePillClick(e, item)}
                    aria-current={isActive ? "location" : undefined}
                    className={`relative flex items-center justify-center shrink-0 h-[34px] md:h-[36px] px-1.5 sm:px-2.5 md:px-4 rounded-full text-[11.5px] sm:text-[12.5px] md:text-[14.5px] font-normal tracking-[-0.02em] whitespace-nowrap transition-colors duration-200 focus:outline-none ${
                      isActive
                        ? "text-white"
                        : "text-[#e7e1d7]/70 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}

              {/* Single Sliding Vermilion Active Indicator Dot */}
              <span
                ref={navDotRef}
                data-nav-dot=""
                aria-hidden="true"
                style={{ opacity: 0 }}
                className="pointer-events-none absolute left-0 bottom-[4px] md:bottom-[5px] h-[5px] w-[5px] rounded-full bg-[#f34213] shadow-[0_0_8px_rgba(243,66,19,0.65)] transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              />
            </nav>

            {/* Standalone Red Calendar Booking Circle Outside Navbar */}
            <button
              type="button"
              onClick={() => {
                if (isBookingOpen) {
                  playModalClose();
                  setIsBookingOpen(false);
                } else {
                  setBookingAnchorBox(computeAnchorBox());
                  setBookingOpenedAtMs(Date.now());
                  setBookingSessionKey((k) => k + 1);
                  playModalOpen();
                  setIsBookingOpen(true);
                }
              }}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              aria-hidden={isOpen}
              aria-expanded={isBookingOpen && !isOpen}
              tabIndex={isOpen ? -1 : 0}
              aria-label="Schedule a call"
              title="Schedule a call"
              className={`voy-glass group relative flex items-center justify-center shrink-0 h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] md:h-[50px] md:w-[50px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                isOpen
                  ? "opacity-0 scale-95 pointer-events-none"
                  : isBookingOpen
                  ? "opacity-100 scale-100 pointer-events-auto !bg-white/[0.1] !border-white/25"
                  : "opacity-100 scale-100 pointer-events-auto hover:!bg-white/[0.08] hover:!border-white/20"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="h-[18px] w-[18px] md:h-[20px] md:w-[20px] transition-transform duration-200 group-hover:scale-105"
              >
                <rect
                  x="3.75"
                  y="4.75"
                  width="16.5"
                  height="15.5"
                  rx="4.25"
                  fill="#f34213"
                  fillOpacity="0.1"
                  stroke="#f34213"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.25 3V5.75M15.75 3V5.75"
                  stroke="#f34213"
                  strokeWidth="1.65"
                  strokeLinecap="round"
                />
                <path
                  d="M3.75 9.25H20.25"
                  stroke="#f34213"
                  strokeWidth="1.45"
                  strokeOpacity="0.85"
                />
                <path
                  d="M8 13.25H16"
                  stroke="#f34213"
                  strokeWidth="1.65"
                  strokeLinecap="round"
                />
                <path
                  d="M8 16.5H12.75"
                  stroke="#f34213"
                  strokeWidth="1.65"
                  strokeOpacity="0.65"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Center Architectural Status Band (Visible when Menu is Open on md+) */}
        <div
          aria-hidden={!isOpen}
          className="hidden md:flex items-center gap-12 lg:gap-20 text-[11px] uppercase tracking-[0.06em]"
        >
          <div
            style={{ transitionDelay: isOpen ? "240ms" : "40ms" }}
            className={`leading-[1.45] text-[#e7e1d7]/70 transition-all duration-300 ${
              isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div>
              BASED IN CAIR<span className="playfair-o">o</span>
            </div>
            <div>
              W<span className="playfair-o">o</span>RKING GL
              <span className="playfair-o">o</span>BALLY ({cairoTime} EET)
            </div>
          </div>

          <div
            style={{ transitionDelay: isOpen ? "180ms" : "80ms" }}
            className={`flex items-center gap-2.5 text-[#e7e1d7] transition-all duration-300 ${
              isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.65)]" />
            </span>
            <span>
              AVAILABLE F<span className="playfair-o">o</span>R Q4
            </span>
          </div>
        </div>

        {/* Right MENU / CLOSE Toggle Button (Unified Translucent Glass) */}
        <div data-intro-fade="">
          <button
            type="button"
            onClick={() => (isOpen ? closeMenu() : openMenu())}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="voy-glass group pointer-events-auto h-[44px] w-[44px] justify-center md:h-[54px] md:w-auto md:px-5 rounded-[12px] md:rounded-[14px] flex items-center gap-3 text-[13px] md:text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7] transition-transform duration-200 ease-out cursor-pointer"
          >
            <span
              className="relative flex h-4 w-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span
                style={{
                  transform: isOpen
                    ? "translateY(0px) rotate(45deg)"
                    : "translateY(-4.5px) rotate(0deg)",
                }}
                className="absolute h-[1.75px] w-[15px] rounded-full bg-[#f34213] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
              <span
                style={{
                  transform: isOpen ? "scaleX(0)" : "scaleX(1)",
                  opacity: isOpen ? 0 : 1,
                }}
                className="absolute h-[1.75px] w-[15px] rounded-full bg-[#f34213] transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
              <span
                style={{
                  transform: isOpen
                    ? "translateY(0px) rotate(-45deg)"
                    : "translateY(4.5px) rotate(0deg)",
                }}
                className="absolute h-[1.75px] w-[15px] rounded-full bg-[#f34213] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
            </span>

            <span className="hidden md:inline-block relative h-[1.25em] overflow-hidden leading-[1.25em]">
              <span
                className={`flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isOpen
                    ? "-translate-y-1/2"
                    : "translate-y-0 group-hover:-translate-y-1/2"
                }`}
              >
                <span className="block h-[1.25em]">MENU</span>
                <span className="block h-[1.25em]">
                  {isOpen ? "CLOSE" : "MENU"}
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>

      <BookingModal
        open={isBookingOpen && !isOpen}
        anchorRef={dockGroupRef}
        initialBox={bookingAnchorBox}
        sessionKey={bookingSessionKey}
        openedAtMs={bookingOpenedAtMs}
        onClose={() => {
          playModalClose();
          setIsBookingOpen(false);
        }}
      />
    </>
  );
}
