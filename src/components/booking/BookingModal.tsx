"use client";

import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  ConfirmedStep,
  DateStep,
  DetailsStep,
  formatCompactDate,
  TimeStep,
  type ConfirmedBookingState,
  type DurationOption,
  type SelectedDateState,
} from "@/components/booking/BookingSteps";
import { siteConfig } from "@/data/site";
import {
  playBookingError,
  playBookingSuccess,
  playHoverTick,
  playSelectDate,
  playSelectSlot,
} from "@/lib/bookingAudio";
import {
  fetchBookingAvailability,
  getCachedAvailability,
  invalidateAvailabilityCache,
  isAvailabilityFresh,
  recordBookedSlotInCache,
} from "@/lib/bookingAvailabilityClient";
import {
  addDaysToCalendarDate,
  buildDaySlots,
  buildMonthGrid,
  formatTime12h,
  getCairoTodayParts,
  type BusyInterval,
  type TimeSlotItem,
} from "@/lib/bookingSlots";

export interface PopoverAnchorBox {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  openUpward: boolean;
}

type PopoverStep = "date" | "time" | "details" | "confirmed";

function getInitialBookingSnapshot(
  nowMs: number,
  initialBusy: readonly BusyInterval[] = []
): {
  today: SelectedDateState;
  initialDate: SelectedDateState;
  localTimeZone: string;
} {
  const today = getCairoTodayParts(nowMs);
  const todayHasSlots = buildDaySlots({
    year: today.year,
    month: today.month,
    day: today.day,
    durationMinutes: siteConfig.booking.defaultDuration,
    busyIntervals: initialBusy,
    nowMs,
  }).some((slot) => slot.status === "available");

  const initialDate = todayHasSlots
    ? today
    : addDaysToCalendarDate(today.year, today.month, today.day, 1);

  let localTimeZone: string = siteConfig.booking.timezoneIana;
  try {
    localTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      siteConfig.booking.timezoneIana;
  } catch {
    localTimeZone = siteConfig.booking.timezoneIana;
  }

  return { today, initialDate, localTimeZone };
}

function BookingPopoverBody({
  isActive,
  openedAtMs,
  onClose,
}: {
  isActive: boolean;
  openedAtMs: number;
  onClose: () => void;
}) {
  const [{ today, initialDate, localTimeZone, initialBusy, needsInitialSync }] =
    useState(() => {
      const initialCache = getCachedAvailability(openedAtMs);
      const cachedBusy = initialCache?.busy ?? [];
      return {
        ...getInitialBookingSnapshot(openedAtMs, cachedBusy),
        initialBusy: cachedBusy,
        needsInitialSync: isActive && !initialCache,
      };
    });

  const [nowMs, setNowMs] = useState(openedAtMs);
  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [selectedDate, setSelectedDate] =
    useState<SelectedDateState>(initialDate);
  const [duration, setDuration] = useState<DurationOption>(
    siteConfig.booking.defaultDuration
  );
  const [step, setStep] = useState<PopoverStep>("date");

  const [loadingSlots, setLoadingSlots] = useState(needsInitialSync);
  const [busyIntervals, setBusyIntervals] =
    useState<BusyInterval[]>(initialBusy);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlotItem | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBookingState | null>(
    null
  );

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const syncAvailability = (
    options: { force?: boolean; isCancelled?: () => boolean } = {}
  ) =>
    fetchBookingAvailability({ force: options.force })
      .then((snapshot) => {
        if (options.isCancelled?.()) return;
        setNowMs(Date.now());
        setBusyIntervals(snapshot.busy);
        setFetchError(null);
        setLoadingSlots(false);
      })
      .catch((err: unknown) => {
        if (options.isCancelled?.()) return;
        if (!getCachedAvailability()) {
          setFetchError(
            err instanceof Error ? err.message : "Could not sync calendar"
          );
        }
        setLoadingSlots(false);
      });

  const runInitialSync = useEffectEvent((isCancelled: () => boolean) =>
    syncAvailability({ isCancelled })
  );

  useEffect(() => {
    if (!isActive || isAvailabilityFresh()) return;
    let cancelled = false;
    void runInitialSync(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isActive]);

  const monthCells = useMemo(() => {
    const cells = buildMonthGrid(
      viewYear,
      viewMonth,
      nowMs,
      siteConfig.booking.maxAdvanceDays
    );
    return cells.slice(35).every((c) => !c.inCurrentMonth)
      ? cells.slice(0, 35)
      : cells;
  }, [viewYear, viewMonth, nowMs]);

  const daySlots = useMemo(
    () =>
      buildDaySlots({
        year: selectedDate.year,
        month: selectedDate.month,
        day: selectedDate.day,
        durationMinutes: duration,
        busyIntervals,
        displayTimeZone: siteConfig.booking.timezoneIana,
        nowMs,
      }),
    [selectedDate, duration, busyIntervals, nowMs]
  );

  const visibleSlots = useMemo(
    () => daySlots.filter((slot) => slot.status !== "past"),
    [daySlots]
  );

  const canGoPrevMonth =
    viewYear > today.year ||
    (viewYear === today.year && viewMonth > today.month);

  const canGoNextMonth = useMemo(() => {
    const nextMonthYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextMonthStartUtc = Date.UTC(nextMonthYear, nextMonth - 1, 1);
    const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
    return (
      nextMonthStartUtc <=
      todayUtc + siteConfig.booking.maxAdvanceDays * 86_400_000
    );
  }, [viewYear, viewMonth, today]);

  const handleShiftMonth = (delta: -1 | 1) => {
    if (delta === -1 && !canGoPrevMonth) return;
    if (delta === 1 && !canGoNextMonth) return;
    playSelectDate();
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  };

  const handleSelectDuration = (nextDuration: DurationOption) => {
    if (nextDuration === duration) return;
    playSelectDate();
    setDuration(nextDuration);
    setSubmitError(null);
    if (selectedSlot) {
      const nextEndMs = selectedSlot.startMs + nextDuration * 60_000;
      const matchingSlot = buildDaySlots({
        year: selectedDate.year,
        month: selectedDate.month,
        day: selectedDate.day,
        durationMinutes: nextDuration,
        busyIntervals,
        displayTimeZone: siteConfig.booking.timezoneIana,
        nowMs,
      }).find((s) => s.startIso === selectedSlot.startIso);

      if (!matchingSlot || matchingSlot.status !== "available") {
        setSelectedSlot(null);
      } else {
        setSelectedSlot({
          ...matchingSlot,
          endIso: new Date(nextEndMs).toISOString(),
        });
      }
    }
  };

  const handleJumpTomorrow = () => {
    playSelectDate();
    const tomorrow = addDaysToCalendarDate(
      today.year,
      today.month,
      today.day,
      1
    );
    setSelectedDate(tomorrow);
    setViewYear(tomorrow.year);
    setViewMonth(tomorrow.month);
    setSelectedSlot(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot || submitting) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (cleanName.length < 2) {
      playBookingError();
      setSubmitError("Enter your name");
      nameInputRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      playBookingError();
      setSubmitError("Enter a valid email");
      emailInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          notes: notes.trim(),
          website: honeypot,
          startIso: selectedSlot.startIso,
          endIso: selectedSlot.endIso,
          durationMinutes: duration,
          visitorTimeZone: localTimeZone,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        meetLink?: string;
      };

      if (res.status === 409 || data.code === "SLOT_TAKEN") {
        playBookingError();
        invalidateAvailabilityCache();
        setLoadingSlots(true);
        await syncAvailability({ force: true });
        setSelectedSlot(null);
        setStep("time");
        setSubmitError("Slot just taken — pick another");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.ok) {
        playBookingError();
        setSubmitError(data.error || "Could not schedule call");
        setSubmitting(false);
        return;
      }

      playBookingSuccess();
      const bookedInterval = {
        start: selectedSlot.startIso,
        end: selectedSlot.endIso,
      };
      recordBookedSlotInCache(bookedInterval);
      setBusyIntervals((prev) => [...prev, bookedInterval]);

      const startFmt = formatTime12h(
        selectedSlot.startMs,
        siteConfig.booking.timezoneIana
      );
      const endFmt = formatTime12h(
        selectedSlot.endMs,
        siteConfig.booking.timezoneIana
      );

      setConfirmed({
        meetLink: data.meetLink || "",
        guestEmail: cleanEmail,
        dateLabel: formatCompactDate(
          selectedDate.year,
          selectedDate.month,
          selectedDate.day
        ),
        timeRangeLabel: `${startFmt} – ${endFmt}`,
      });
      setStep("confirmed");
      setSubmitting(false);
    } catch {
      playBookingError();
      setSubmitError("Network error — try again");
      setSubmitting(false);
    }
  };

  if (step === "confirmed" && confirmed) {
    return <ConfirmedStep confirmed={confirmed} onClose={onClose} />;
  }

  if (step === "details" && selectedSlot) {
    return (
      <DetailsStep
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        duration={duration}
        name={name}
        email={email}
        notes={notes}
        honeypot={honeypot}
        submitting={submitting}
        submitError={submitError}
        nameInputRef={nameInputRef}
        emailInputRef={emailInputRef}
        onBack={() => {
          playHoverTick();
          setSubmitError(null);
          setStep("time");
        }}
        onNameChange={setName}
        onEmailChange={setEmail}
        onNotesChange={setNotes}
        onHoneypotChange={setHoneypot}
        onSubmit={handleSubmit}
      />
    );
  }

  if (step === "time") {
    return (
      <TimeStep
        selectedDate={selectedDate}
        duration={duration}
        loadingSlots={loadingSlots}
        fetchError={fetchError}
        submitError={submitError}
        visibleSlots={visibleSlots}
        onBack={() => {
          playHoverTick();
          setSubmitError(null);
          setStep("date");
        }}
        onSelectDuration={handleSelectDuration}
        onRetry={() => {
          setLoadingSlots(true);
          void syncAvailability({ force: true });
        }}
        onJumpTomorrow={handleJumpTomorrow}
        onSelectSlot={(slot) => {
          if (slot.status === "booked") return;
          playSelectSlot();
          setSelectedSlot(slot);
          setSubmitError(null);
          setStep("details");
        }}
      />
    );
  }

  return (
    <DateStep
      viewYear={viewYear}
      viewMonth={viewMonth}
      monthCells={monthCells}
      selectedDateKey={selectedDate.dateKey}
      canGoPrevMonth={canGoPrevMonth}
      canGoNextMonth={canGoNextMonth}
      onShiftMonth={handleShiftMonth}
      onSelectDate={(cell) => {
        playSelectDate();
        setSelectedDate({
          year: cell.year,
          month: cell.month,
          day: cell.day,
          dateKey: cell.dateKey,
        });
        setSelectedSlot(null);
        setSubmitError(null);
        setStep("time");
      }}
    />
  );
}

export function BookingModal({
  open,
  anchorRef,
  initialBox,
  sessionKey,
  openedAtMs,
  onClose,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  initialBox: PopoverAnchorBox | null;
  sessionKey: number;
  openedAtMs: number;
  onClose: () => void;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const focusTimers: number[] = [];
    const shellEl = shellRef.current;
    const vv = window.visualViewport;

    const syncPosition = () => {
      const anchor = anchorRef.current;
      const shell = shellRef.current;
      if (!anchor || !shell) return;
      const r = anchor.getBoundingClientRect();
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 900;
      const isSmUp = vw >= 640;
      const width = isSmUp ? r.width : Math.min(340, vw - 24);
      const left = isSmUp ? r.left : (vw - width) * 0.5;
      const upward = r.top > vh * 0.48;

      shell.style.left = `${left.toFixed(1)}px`;
      shell.style.width = `${width.toFixed(1)}px`;

      const keyboardOpen = Boolean(!isSmUp && vv && vh - vv.height > 110);
      if (keyboardOpen && vv) {
        const maxH = Math.max(210, vv.height - 16);
        shell.style.maxHeight = `${maxH.toFixed(0)}px`;
        shell.style.overflowY = "auto";
        const cardH = Math.min(shell.offsetHeight || 300, maxH);
        const top = vv.offsetTop + Math.max(8, (vv.height - cardH) * 0.5);
        shell.style.top = `${top.toFixed(1)}px`;
        shell.style.bottom = "auto";
        shell.style.transformOrigin = "50% 50%";
        return;
      }

      shell.style.maxHeight = "";
      shell.style.overflowY = "";
      if (upward) {
        shell.style.bottom = `${(vh - r.top + 12).toFixed(1)}px`;
        shell.style.top = "auto";
        shell.style.transformOrigin = "50% 100%";
      } else {
        shell.style.top = `${(r.bottom + 12).toFixed(1)}px`;
        shell.style.bottom = "auto";
        shell.style.transformOrigin = "50% 0%";
      }
    };

    const scheduleKeyboardSync = () => {
      syncPosition();
      focusTimers.push(
        window.setTimeout(syncPosition, 140),
        window.setTimeout(syncPosition, 320)
      );
    };

    let resizeObserver: ResizeObserver | null = null;
    if (shellEl) {
      resizeObserver = new ResizeObserver(syncPosition);
      resizeObserver.observe(shellEl);
      shellEl.addEventListener("focusin", scheduleKeyboardSync);
      shellEl.addEventListener("focusout", scheduleKeyboardSync);
    }

    syncPosition();
    window.addEventListener("scroll", syncPosition, { passive: true });
    window.addEventListener("resize", syncPosition);
    vv?.addEventListener("resize", syncPosition);
    vv?.addEventListener("scroll", syncPosition);
    return () => {
      window.removeEventListener("scroll", syncPosition);
      window.removeEventListener("resize", syncPosition);
      vv?.removeEventListener("resize", syncPosition);
      vv?.removeEventListener("scroll", syncPosition);
      shellEl?.removeEventListener("focusin", scheduleKeyboardSync);
      shellEl?.removeEventListener("focusout", scheduleKeyboardSync);
      resizeObserver?.disconnect();
      focusTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [open, anchorRef]);

  if (openedAtMs <= 0 || !initialBox) return null;

  return (
    <div
      ref={shellRef}
      data-booking-popover=""
      role="dialog"
      aria-modal="false"
      aria-label="Schedule a call"
      aria-hidden={!open}
      inert={!open}
      data-lenis-prevent=""
      onWheel={(e) => e.stopPropagation()}
      style={{
        left: `${initialBox.left.toFixed(1)}px`,
        width: `${initialBox.width.toFixed(1)}px`,
        top:
          initialBox.top !== undefined ? `${initialBox.top.toFixed(1)}px` : "auto",
        bottom:
          initialBox.bottom !== undefined
            ? `${initialBox.bottom.toFixed(1)}px`
            : "auto",
        transformOrigin: initialBox.openUpward ? "50% 100%" : "50% 0%",
      }}
      className={`voy-popover-glass fixed z-[52] rounded-[24px] overflow-hidden overscroll-contain text-white transition-[opacity,transform,visibility] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto visible"
          : `opacity-0 ${
              initialBox.openUpward ? "translate-y-2.5" : "-translate-y-2.5"
            } scale-[0.96] pointer-events-none invisible`
      }`}
    >
      <BookingPopoverBody
        key={sessionKey}
        isActive={open}
        openedAtMs={openedAtMs}
        onClose={onClose}
      />
    </div>
  );
}
