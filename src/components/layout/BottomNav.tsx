"use client";

import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { PopoverAnchorBox } from "@/components/booking/BookingModal";
import {
  FullscreenMenuOverlay,
  MENU_COLS,
  type MenuPhase,
} from "@/components/layout/FullscreenMenuOverlay";
import {
  runCloseCurtainAnimation,
  runOpenCurtainAnimation,
} from "@/components/layout/menuCurtain";
import { siteConfig } from "@/data/site";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { playModalClose, playModalOpen } from "@/lib/bookingAudio";
import { prefetchBookingAvailability } from "@/lib/bookingAvailabilityClient";
import { formatCairoClock12h } from "@/lib/bookingSlots";
import { getLenis, scheduleIdle, scrollToTarget } from "@/lib/dom";

const LazyBookingModal = React.lazy(() =>
  import("@/components/booking/BookingModal").then((m) => ({
    default: m.BookingModal,
  }))
);

export function BottomNav() {
  const [menuPhase, setMenuPhase] = useState<MenuPhase>("closed");
  const [contentRevealed, setContentRevealed] = useState(false);
  const [isNavDocked, setIsNavDocked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
  const cairoTimeRef = useRef<HTMLSpanElement | null>(null);
  const leadColRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainColRefs = useRef<(HTMLDivElement | null)[]>([]);

  const leadScalesRef = useRef<number[]>(Array(MENU_COLS).fill(0));
  const mainScalesRef = useRef<number[]>(Array(MENU_COLS).fill(0));
  const menuRafRef = useRef<number | null>(null);
  const isNavDockedRef = useRef(false);
  const menuPhaseRef = useRef<MenuPhase>("closed");
  const activeTabRef = useRef<string>("home");
  const scrollSpyLockedRef = useRef<boolean>(false);
  const scrollSpyTimerRef = useRef<number | null>(null);
  const syncOnScrollRef = useRef<() => void>(() => {});

  const magnetic = useMagneticHover<HTMLButtonElement>({
    xFactor: 0.22,
    yFactor: 0.22,
    scale: 1.04,
  });

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
    if (!isOpen) return;
    const syncClock = () => {
      if (cairoTimeRef.current) {
        cairoTimeRef.current.textContent = formatCairoClock12h();
      }
    };
    syncClock();
    const interval = window.setInterval(syncClock, 15000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  const positionDotForTab = (tabId: string) => {
    const dotEl = navDotRef.current;
    if (!dotEl) return;
    const idx = siteConfig.pillNavLinks.findIndex((item) => item.id === tabId);
    const linkEl = pillLinkRefs.current[idx >= 0 ? idx : 0];
    if (!linkEl) return;
    const centerX = linkEl.offsetLeft + linkEl.offsetWidth * 0.5 - 2.5;
    dotEl.style.transform = `translate3d(${centerX.toFixed(1)}px, 0, 0)`;
    dotEl.style.opacity = "1";
  };

  useEffect(() => {
    positionDotForTab(activeTab);
  }, [activeTab]);

  const onSyncCurrentDot = useEffectEvent(() => {
    positionDotForTab(activeTabRef.current);
  });

  useEffect(() => {
    let activeObserver: ResizeObserver | null = null;
    if (pillNavRef.current) {
      activeObserver = new ResizeObserver(onSyncCurrentDot);
      activeObserver.observe(pillNavRef.current);
    }
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) onSyncCurrentDot();
    });
    return () => {
      cancelled = true;
      activeObserver?.disconnect();
    };
  }, []);

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
      const barHeight =
        navBarRef.current?.offsetHeight || (window.innerWidth >= 768 ? 102 : 76);

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
    const initRaf = window.requestAnimationFrame(measureLayout);

    const initTimer = window.setTimeout(measureLayout, 60);
    const resizeObserver = new ResizeObserver(measureLayout);
    resizeObserver.observe(document.documentElement);
    if (navBarRef.current) resizeObserver.observe(navBarRef.current);

    document.fonts?.ready.then(() => {
      if (!cancelled) measureLayout();
    });

    window.addEventListener("scroll", syncOnScroll, { passive: true });
    window.addEventListener("resize", measureLayout);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(initRaf);
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

  const stopMenuRaf = useCallback(() => {
    if (menuRafRef.current !== null) {
      window.cancelAnimationFrame(menuRafRef.current);
      menuRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMenuRaf();
      getLenis()?.start();
    };
  }, [stopMenuRaf]);

  const applyColumnScale = useCallback(
    (idx: number, leadVal: number, mainVal: number) => {
      leadScalesRef.current[idx] = leadVal;
      mainScalesRef.current[idx] = mainVal;
      const leadEl = leadColRefs.current[idx];
      const mainEl = mainColRefs.current[idx];
      if (leadEl) leadEl.style.transform = `scaleY(${leadVal.toFixed(4)})`;
      if (mainEl) mainEl.style.transform = `scaleY(${mainVal.toFixed(4)})`;
    },
    []
  );

  const lockScrollSpy = useCallback((tabId: string) => {
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
  }, []);

  const openMenu = useCallback(() => {
    stopMenuRaf();
    setIsBookingOpen(false);
    setHoveredIdx(null);
    setContentRevealed(false);
    setIsNavDocked(true);
    setMenuPhase("opening");
    getLenis()?.stop();

    runOpenCurtainAnimation({
      rafRef: menuRafRef,
      leadScales: leadScalesRef.current,
      mainScales: mainScalesRef.current,
      applyColumnScale,
      onContentReveal: () => setContentRevealed(true),
      onComplete: () => setMenuPhase("open"),
    });
  }, [applyColumnScale, stopMenuRaf]);

  const closeMenu = useCallback(
    (scrollTarget?: string | null) => {
      stopMenuRaf();
      setHoveredIdx(null);
      setContentRevealed(false);
      setMenuPhase("closing");
      setIsNavDocked(true);
      getLenis()?.start();

      runCloseCurtainAnimation({
        rafRef: menuRafRef,
        leadScales: leadScalesRef.current,
        mainScales: mainScalesRef.current,
        applyColumnScale,
        onScrollStart: () => {
          if (scrollTarget !== undefined) scrollToTarget(scrollTarget);
        },
        onReleaseNav: () => setIsNavDocked(false),
        onComplete: () => setMenuPhase("closed"),
      });
    },
    [applyColumnScale, stopMenuRaf]
  );

  const onEscapeKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (
      e.key === "Escape" &&
      (menuPhaseRef.current === "open" || menuPhaseRef.current === "opening")
    ) {
      closeMenu();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onEscapeKeyDown);
    return () => window.removeEventListener("keydown", onEscapeKeyDown);
  }, []);

  const handleTopClick = () => {
    lockScrollSpy("home");
    if (isOpen) closeMenu(null);
    else scrollToTarget(null);
  };

  const handleLeadColRef = useCallback(
    (idx: number, el: HTMLDivElement | null) => {
      leadColRefs.current[idx] = el;
    },
    []
  );

  const handleMainColRef = useCallback(
    (idx: number, el: HTMLDivElement | null) => {
      mainColRefs.current[idx] = el;
    },
    []
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
    },
    [closeMenu, lockScrollSpy]
  );

  const handlePillClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof siteConfig.pillNavLinks)[number]
  ) => {
    e.preventDefault();
    setIsBookingOpen(false);
    lockScrollSpy(item.id);
    scrollToTarget(item.id === "home" ? null : item.href);
  };

  useEffect(() => {
    let cancelIdle: (() => void) | null = null;
    const warmTimer = window.setTimeout(() => {
      cancelIdle = scheduleIdle(() => {
        cancelIdle = null;
        prefetchBookingAvailability();
      }, 1500);
    }, 3200);

    return () => {
      window.clearTimeout(warmTimer);
      cancelIdle?.();
    };
  }, []);

  const preloadBooking = () => {
    void import("@/components/booking/BookingModal");
    prefetchBookingAvailability();
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
      <FullscreenMenuOverlay
        menuPhase={menuPhase}
        contentRevealed={contentRevealed}
        isOpen={isOpen}
        showMenuLayer={showMenuLayer}
        hoveredIdx={hoveredIdx}
        onHoverIdxChange={setHoveredIdx}
        onLinkClick={handleLinkClick}
        onLeadColRef={handleLeadColRef}
        onMainColRef={handleMainColRef}
      />

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
        <div>
          <button
            type="button"
            onClick={handleTopClick}
            onMouseEnter={magnetic.onMouseEnter}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            aria-label="Abdullah Elawady Studio — Scroll to top"
            className="voy-glass group pointer-events-auto h-[44px] w-[44px] md:h-[54px] md:w-auto md:px-5 rounded-[12px] md:rounded-[14px] flex items-center justify-center text-[11.5px] md:text-[14.5px] font-medium uppercase tracking-[-0.02em] md:tracking-[0.04em] transition-transform duration-200 ease-out cursor-pointer select-none"
          >
            <span className="relative h-[1.25em] overflow-hidden leading-[1.25em]">
              <span className="flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-0 group-hover:-translate-y-1/2">
                <span className="block h-[1.25em] whitespace-nowrap">
                  <span className="text-[#e7e1d7]">AE</span>
                  <span className="text-[#f34213]">.S</span>
                </span>
                <span
                  aria-hidden="true"
                  className="block h-[1.25em] whitespace-nowrap"
                >
                  <span className="text-[#e7e1d7]">AE</span>
                  <span className="text-[#f34213]">.S</span>
                </span>
              </span>
            </span>
          </button>
        </div>

        {/* Center Floating Translucent Glass Pill Navbar + Standalone Calendar Circle */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            ref={dockGroupRef}
            className="relative flex items-center gap-1.5 sm:gap-2 md:gap-2.5"
          >
            <nav
              ref={pillNavRef}
              data-glass-pill=""
              aria-label="Quick section navigation"
              aria-hidden={isOpen}
              inert={isOpen}
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

              <span
                ref={navDotRef}
                data-nav-dot=""
                aria-hidden="true"
                style={{ opacity: 0 }}
                className="pointer-events-none absolute left-0 bottom-[4px] md:bottom-[5px] h-[5px] w-[5px] rounded-full bg-[#f34213] shadow-[0_0_8px_rgba(243,66,19,0.65)] transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              />
            </nav>

            <button
              type="button"
              onPointerEnter={preloadBooking}
              onFocus={preloadBooking}
              onTouchStart={preloadBooking}
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
              onMouseEnter={magnetic.onMouseEnter}
              onMouseMove={magnetic.onMouseMove}
              onMouseLeave={magnetic.onMouseLeave}
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
              <span className="playfair-o">o</span>BALLY (
              <span ref={cairoTimeRef}>--:--</span> EET)
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
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 ${
                  isOpen ? "animate-ping" : ""
                }`}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.65)]" />
            </span>
            <span>
              AVAILABLE F<span className="playfair-o">o</span>R Q4
            </span>
          </div>
        </div>

        {/* Right MENU / CLOSE Toggle Button */}
        <div>
          <button
            type="button"
            onClick={() => (isOpen ? closeMenu() : openMenu())}
            onMouseEnter={magnetic.onMouseEnter}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
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

      {bookingOpenedAtMs > 0 ? (
        <React.Suspense fallback={null}>
          <LazyBookingModal
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
        </React.Suspense>
      ) : null}
    </>
  );
}
