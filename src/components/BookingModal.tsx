"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type Lenis from "lenis";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { StylizedText } from "@/components/StylizedText";
import { siteConfig } from "@/data/site";
import {
  isBookingAudioMuted,
  playBookingError,
  playBookingSuccess,
  playHoverTick,
  playSelectDate,
  playSelectSlot,
  setBookingAudioMuted,
} from "@/lib/bookingAudio";
import {
  addDaysToCalendarDate,
  buildDaySlots,
  buildMonthGrid,
  formatDateHeading,
  formatMonthHeading,
  formatTime12h,
  getCairoTodayParts,
  type BusyInterval,
  type TimeSlotItem,
} from "@/lib/bookingSlots";

type BookingStep = "slots" | "details" | "confirmed";
type DurationOption = (typeof siteConfig.booking.durations)[number];

interface SelectedDateState {
  year: number;
  month: number;
  day: number;
  dateKey: string;
}

interface ConfirmedBookingState {
  meetLink: string;
  htmlLink: string;
  eventId: string;
  startIso: string;
  endIso: string;
  durationMinutes: DurationOption;
  guestName: string;
  guestEmail: string;
  dateHeading: string;
  timeRangeLabel: string;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function getInitialBookingTarget(): {
  today: SelectedDateState;
  initialDate: SelectedDateState;
  localTimeZone: string;
  nowMs: number;
} {
  const nowMs = Date.now();
  const today = getCairoTodayParts(nowMs);
  const todayHasSlots = buildDaySlots({
    year: today.year,
    month: today.month,
    day: today.day,
    durationMinutes: siteConfig.booking.defaultDuration,
    busyIntervals: [],
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

  return { today, initialDate, localTimeZone, nowMs };
}

function BookingModalContent({ onClose }: { onClose: () => void }) {
  const [{ today, initialDate, localTimeZone, nowMs: initialNowMs }] =
    useState(getInitialBookingTarget);

  const [nowMs, setNowMs] = useState(initialNowMs);
  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [selectedDate, setSelectedDate] =
    useState<SelectedDateState>(initialDate);
  const [duration, setDuration] = useState<DurationOption>(
    siteConfig.booking.defaultDuration
  );
  const [tzMode, setTzMode] = useState<"cairo" | "local">("cairo");
  const [step, setStep] = useState<BookingStep>("slots");

  const [loadingSlots, setLoadingSlots] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlotItem | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBookingState | null>(
    null
  );
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [muted, setMuted] = useState(() => isBookingAudioMuted());

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const loadAvailability = (signal?: AbortSignal) => {
    const nowMs = Date.now();
    const fromIso = new Date(nowMs - 3_600_000).toISOString();
    const toIso = new Date(
      nowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
    ).toISOString();

    return fetch(
      `/api/booking?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(
        toIso
      )}`,
      { cache: "no-store", signal }
    )
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          configured?: boolean;
          busy?: BusyInterval[];
          error?: string;
        };
        if (signal?.aborted) return;
        setNowMs(Date.now());
        if (typeof data.configured === "boolean") {
          setIsConfigured(data.configured);
        }
        if (!res.ok || data.ok === false) {
          setFetchError(data.error || "Unable to sync live calendar slots.");
        } else {
          setBusyIntervals(Array.isArray(data.busy) ? data.busy : []);
          setFetchError(null);
        }
        setLoadingSlots(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setFetchError("Unable to reach booking server.");
        setLoadingSlots(false);
      });
  };

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.stop();

    const controller = new AbortController();
    loadAvailability(controller.signal);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      controller.abort();
      window.removeEventListener("keydown", onKeyDown);
      lenis?.start();
    };
  }, []);

  const displayTimeZone =
    tzMode === "local" ? localTimeZone : siteConfig.booking.timezoneIana;
  const hasDistinctLocalTz = localTimeZone !== siteConfig.booking.timezoneIana;

  const monthCells = useMemo(
    () =>
      buildMonthGrid(
        viewYear,
        viewMonth,
        nowMs,
        siteConfig.booking.maxAdvanceDays
      ),
    [viewYear, viewMonth, nowMs]
  );

  const daySlots = useMemo(
    () =>
      buildDaySlots({
        year: selectedDate.year,
        month: selectedDate.month,
        day: selectedDate.day,
        durationMinutes: duration,
        busyIntervals,
        displayTimeZone,
        nowMs,
      }),
    [selectedDate, duration, busyIntervals, displayTimeZone, nowMs]
  );

  const visibleSlots = useMemo(
    () => daySlots.filter((slot) => slot.status !== "past"),
    [daySlots]
  );

  const availableCount = useMemo(
    () => visibleSlots.filter((s) => s.status === "available").length,
    [visibleSlots]
  );

  const canGoPrevMonth =
    viewYear > today.year ||
    (viewYear === today.year && viewMonth > today.month);

  const canGoNextMonth = useMemo(() => {
    const nextMonthYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextMonthStartUtc = Date.UTC(nextMonthYear, nextMonth - 1, 1);
    const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
    const maxUtc = todayUtc + siteConfig.booking.maxAdvanceDays * 86_400_000;
    return nextMonthStartUtc <= maxUtc;
  }, [viewYear, viewMonth, today]);

  const handleShiftMonth = (delta: -1 | 1) => {
    playSelectDate();
    if (delta === -1 && !canGoPrevMonth) return;
    if (delta === 1 && !canGoNextMonth) return;
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
      const nextEndIso = new Date(nextEndMs).toISOString();
      const matchingSlot = buildDaySlots({
        year: selectedDate.year,
        month: selectedDate.month,
        day: selectedDate.day,
        durationMinutes: nextDuration,
        busyIntervals,
        displayTimeZone,
        nowMs,
      }).find((s) => s.startIso === selectedSlot.startIso);

      if (!matchingSlot || matchingSlot.status !== "available") {
        setSelectedSlot(null);
        if (step === "details") setStep("slots");
      } else {
        setSelectedSlot({
          ...matchingSlot,
          endIso: nextEndIso,
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
    setStep("slots");
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setBookingAudioMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      playSelectDate();
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot || submitting) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (cleanName.length < 2) {
      playBookingError();
      setSubmitError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      playBookingError();
      setSubmitError("Please enter a valid email address for the Meet invite.");
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
        htmlLink?: string;
        eventId?: string;
      };

      if (res.status === 409 || data.code === "SLOT_TAKEN") {
        playBookingError();
        setLoadingSlots(true);
        await loadAvailability();
        setSelectedSlot(null);
        setStep("slots");
        setSubmitError(
          "That slot was just booked. Please pick another available time."
        );
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.ok) {
        playBookingError();
        setSubmitError(
          data.error || "Could not schedule the call. Please try again."
        );
        setSubmitting(false);
        return;
      }

      playBookingSuccess();
      setBusyIntervals((prev) => [
        ...prev,
        { start: selectedSlot.startIso, end: selectedSlot.endIso },
      ]);

      const startFormatted = formatTime12h(
        selectedSlot.startMs,
        displayTimeZone
      );
      const endFormatted = formatTime12h(selectedSlot.endMs, displayTimeZone);

      setConfirmed({
        meetLink: data.meetLink || "",
        htmlLink: data.htmlLink || "",
        eventId: data.eventId || "",
        startIso: selectedSlot.startIso,
        endIso: selectedSlot.endIso,
        durationMinutes: duration,
        guestName: cleanName,
        guestEmail: cleanEmail,
        dateHeading: formatDateHeading(
          selectedDate.year,
          selectedDate.month,
          selectedDate.day
        ),
        timeRangeLabel: `${startFormatted} – ${endFormatted}`,
      });
      setStep("confirmed");
      setSubmitting(false);
    } catch {
      playBookingError();
      setSubmitError("Network error while booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handleCopyMeetLink = () => {
    if (!confirmed?.meetLink) return;
    playSelectDate();
    navigator.clipboard?.writeText(confirmed.meetLink);
    setCopiedMeet(true);
    window.setTimeout(() => setCopiedMeet(false), 1800);
  };

  const selectedDateHeading = formatDateHeading(
    selectedDate.year,
    selectedDate.month,
    selectedDate.day
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a Google Meet call"
      data-lenis-prevent=""
      className="booking-backdrop-in fixed inset-0 z-[55] flex items-center justify-center p-3 sm:p-6 bg-[#060606]/82 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-lenis-prevent=""
        className="booking-panel-in relative w-full max-w-[920px] max-h-[92svh] overflow-y-auto rounded-[24px] sm:rounded-[28px] bg-[#0e0d0c]/95 border border-[#e7e1d7]/[0.12] shadow-[0_32px_90px_rgba(0,0,0,0.75)] text-[#e7e1d7]"
      >
        {/* Subtle top vermilion studio ambient highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 rounded-t-[28px]"
          style={{
            background:
              "radial-gradient(ellipse 65% 80% at 50% -15%, rgba(243, 66, 19, 0.2), transparent 72%)",
          }}
        />

        {/* Modal Top Header */}
        <div className="relative z-10 flex items-center justify-between gap-4 px-5 sm:px-8 pt-5 sm:pt-7 pb-5 border-b border-[#e7e1d7]/12">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/65">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.65)]" />
              </span>
              <span className="truncate">
                LIVE G<span className="playfair-o">o</span>OGLE MEET SCHEDULING
              </span>
            </div>

            <h2 className="mt-1.5 text-[22px] sm:text-[28px] leading-[1.08] tracking-[-0.025em] font-normal uppercase text-[#e7e1d7]">
              <StylizedText text="BOOK A DISCOVERY CALL" />
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? "Unmute booking sounds" : "Mute booking sounds"}
              title={muted ? "Unmute tactile sounds" : "Mute tactile sounds"}
              className="voy-glass h-10 w-10 rounded-full flex items-center justify-center text-[#e7e1d7]/75 hover:text-[#e7e1d7] hover:border-white/25 transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#f34213]" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking calendar"
              className="voy-glass h-10 w-10 rounded-full flex items-center justify-center text-[#e7e1d7]/80 hover:text-[#f34213] hover:border-[#f34213]/45 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Studio Body */}
        {step === "confirmed" && confirmed ? (
          <div className="relative z-10 px-5 sm:px-8 py-8 sm:py-10">
            <div className="mx-auto max-w-[560px] rounded-[20px] border border-[#22c55e]/25 bg-[#22c55e]/[0.04] p-6 sm:p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e]/15 border border-[#22c55e]/35 text-[#22c55e]">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-[#22c55e]">
                CONFIRMED · CALENDAR INVITE SENT
              </p>
              <h3 className="mt-1.5 text-[24px] sm:text-[30px] leading-[1.1] tracking-[-0.02em] uppercase text-[#e7e1d7]">
                <StylizedText text="YOU'RE BOOKED" />
              </h3>
              <p className="mt-2 text-[14px] text-[#e7e1d7]/70">
                A Google Calendar invitation with your private Google Meet room
                has been sent to{" "}
                <span className="text-[#e7e1d7] font-medium">
                  {confirmed.guestEmail}
                </span>{" "}
                and{" "}
                <span className="text-[#e7e1d7] font-medium">
                  {siteConfig.booking.hostEmail}
                </span>
                .
              </p>

              <div className="mt-6 rounded-2xl border border-[#e7e1d7]/12 bg-[#0b0b0b]/70 p-4 sm:p-5 text-left space-y-3 text-[13px]">
                <div className="flex items-center justify-between gap-4 border-b border-[#e7e1d7]/10 pb-2.5">
                  <span className="text-[#e7e1d7]/55 uppercase tracking-[0.06em]">
                    DATE
                  </span>
                  <span className="text-[#e7e1d7] font-medium">
                    {confirmed.dateHeading}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[#e7e1d7]/10 pb-2.5">
                  <span className="text-[#e7e1d7]/55 uppercase tracking-[0.06em]">
                    TIME
                  </span>
                  <span className="text-[#e7e1d7] font-medium tabular-nums">
                    {confirmed.timeRangeLabel} (
                    {tzMode === "local" ? localTimeZone : "CAI"})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#e7e1d7]/55 uppercase tracking-[0.06em]">
                    DURATION
                  </span>
                  <span className="text-[#e7e1d7] font-medium">
                    {confirmed.durationMinutes} MIN · GOOGLE MEET
                  </span>
                </div>
              </div>

              {confirmed.meetLink ? (
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <a
                    href={confirmed.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f34213] px-6 text-[13px] font-medium uppercase tracking-[0.05em] text-[#0b0b0b] hover:bg-[#ff5629] transition-colors cursor-pointer"
                  >
                    <Video className="h-4 w-4" />
                    <span>OPEN GOOGLE MEET</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyMeetLink}
                    className="voy-glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7] hover:border-white/30 transition-colors cursor-pointer"
                  >
                    {copiedMeet ? (
                      <>
                        <Check className="h-4 w-4 text-[#22c55e]" />
                        <span className="text-[#22c55e]">COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>COPY MEET LINK</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-center gap-5 text-[12px] uppercase tracking-[0.06em]">
                {confirmed.htmlLink ? (
                  <a
                    href={confirmed.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#e7e1d7]/65 hover:text-[#f34213] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>VIEW IN CALENDAR</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#e7e1d7]/75 hover:text-[#e7e1d7] underline underline-offset-4 cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT COLUMN: Duration + Interactive Month Calendar */}
            <div className="lg:col-span-6 p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[#e7e1d7]/12">
              {/* Duration Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/55">
                  <span>CALL DURATION</span>
                  <span>MAX 60 MIN</span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {siteConfig.booking.durations.map((mins) => {
                    const active = duration === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onMouseEnter={() => playHoverTick()}
                        onClick={() => handleSelectDuration(mins)}
                        className={`h-10 rounded-xl border text-[12.5px] uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                          active
                            ? "bg-[#f34213] border-[#f34213] text-[#0b0b0b] font-semibold shadow-[0_0_20px_rgba(243,66,19,0.35)]"
                            : "bg-white/[0.03] border-[#e7e1d7]/12 text-[#e7e1d7]/80 hover:border-[#e7e1d7]/30 hover:bg-white/[0.06]"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{mins} MIN</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Header */}
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-[14px] sm:text-[15px] uppercase tracking-[0.06em] text-[#e7e1d7]">
                  <StylizedText text={formatMonthHeading(viewYear, viewMonth)} />
                </h3>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!canGoPrevMonth}
                    onClick={() => handleShiftMonth(-1)}
                    aria-label="Previous month"
                    className="h-8 w-8 rounded-full border border-[#e7e1d7]/15 bg-white/[0.03] flex items-center justify-center text-[#e7e1d7]/80 hover:border-[#e7e1d7]/35 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!canGoNextMonth}
                    onClick={() => handleShiftMonth(1)}
                    aria-label="Next month"
                    className="h-8 w-8 rounded-full border border-[#e7e1d7]/15 bg-white/[0.03] flex items-center justify-center text-[#e7e1d7]/80 hover:border-[#e7e1d7]/35 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="py-1 text-[10px] uppercase tracking-[0.08em] text-[#e7e1d7]/45"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* 42-Cell Calendar Grid */}
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {monthCells.map((cell) => {
                  if (!cell.inCurrentMonth) {
                    return (
                      <div
                        key={cell.dateKey}
                        aria-hidden="true"
                        className="h-10 sm:h-11 rounded-xl flex items-center justify-center text-[13px] text-[#e7e1d7]/12 select-none"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const disabled = cell.isPast || cell.isBeyondWindow;
                  const isSelected = selectedDate.dateKey === cell.dateKey;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      disabled={disabled}
                      onMouseEnter={() => {
                        if (!disabled) playHoverTick();
                      }}
                      onClick={() => {
                        if (disabled) return;
                        playSelectDate();
                        setSelectedDate({
                          year: cell.year,
                          month: cell.month,
                          day: cell.day,
                          dateKey: cell.dateKey,
                        });
                        setSelectedSlot(null);
                        setSubmitError(null);
                        if (step === "details") setStep("slots");
                      }}
                      className={`relative h-10 sm:h-11 rounded-xl border text-[13px] tabular-nums transition-all duration-200 flex flex-col items-center justify-center ${
                        disabled
                          ? "border-transparent text-[#e7e1d7]/20 line-through cursor-not-allowed"
                          : isSelected
                          ? "bg-[#f34213] border-[#f34213] text-[#0b0b0b] font-semibold shadow-[0_0_22px_rgba(243,66,19,0.42)] scale-[1.03] cursor-pointer"
                          : cell.isToday
                          ? "bg-white/[0.04] border-[#f34213]/45 text-[#e7e1d7] hover:bg-white/[0.09] hover:border-[#f34213] cursor-pointer"
                          : "bg-white/[0.025] border-[#e7e1d7]/10 text-[#e7e1d7]/85 hover:bg-white/[0.08] hover:border-[#e7e1d7]/30 cursor-pointer"
                      }`}
                    >
                      <span>{cell.day}</span>
                      {cell.isToday && !isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 h-1 w-1 rounded-full bg-[#f34213]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Timezone & Availability Footer */}
              <div className="mt-5 pt-4 border-t border-[#e7e1d7]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.06em] text-[#e7e1d7]/55">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#f34213]" />
                  <span>
                    {tzMode === "local"
                      ? `${localTimeZone} (12H)`
                      : "CAIRO TIME · 10 AM – 10 PM"}
                  </span>
                </div>

                {hasDistinctLocalTz ? (
                  <button
                    type="button"
                    onClick={() => {
                      playSelectDate();
                      setTzMode((prev) =>
                        prev === "cairo" ? "local" : "cairo"
                      );
                    }}
                    className="rounded-full border border-[#e7e1d7]/15 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#e7e1d7]/80 hover:border-[#f34213]/50 hover:text-white transition-colors cursor-pointer"
                  >
                    SWITCH TO {tzMode === "cairo" ? "LOCAL TIME" : "CAIRO TIME"}
                  </button>
                ) : (
                  <span>ALL 7 DAYS OPEN</span>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Time Slots OR Booking Details Form */}
            <div className="lg:col-span-6 p-5 sm:p-7 flex flex-col justify-between">
              {step === "slots" ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#e7e1d7]/55">
                        AVAILABLE TIMES ({duration} MIN)
                      </p>
                      <h3 className="mt-1 text-[16px] sm:text-[18px] uppercase tracking-[0.03em] text-[#e7e1d7]">
                        <StylizedText text={selectedDateHeading} />
                      </h3>
                    </div>

                    <div className="shrink-0">
                      {loadingSlots ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e1d7]/15 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-[#e7e1d7]/70">
                          <Loader2 className="h-3 w-3 animate-spin text-[#f34213]" />
                          SYNCING
                        </span>
                      ) : !isConfigured ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-amber-300">
                          LINK CALENDAR SCRIPT
                        </span>
                      ) : fetchError ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLoadingSlots(true);
                            loadAvailability();
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-[#f34213]/40 bg-[#f34213]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-[#f34213] hover:bg-[#f34213]/20 cursor-pointer"
                        >
                          RETRY SYNC
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-[#22c55e]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                          {availableCount} OPEN
                        </span>
                      )}
                    </div>
                  </div>

                  {submitError ? (
                    <div className="mt-3 rounded-xl border border-[#f34213]/40 bg-[#f34213]/10 px-3.5 py-2.5 text-[12.5px] text-[#ffb8a6]">
                      {submitError}
                    </div>
                  ) : null}

                  {fetchError ? (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-[12px] text-amber-200/90">
                      {fetchError}
                    </div>
                  ) : null}

                  {/* Slots Grid */}
                  <div
                    data-lenis-prevent=""
                    className="mt-4 max-h-[300px] sm:max-h-[330px] overflow-y-auto pr-1"
                  >
                    {visibleSlots.length === 0 ? (
                      <div className="rounded-2xl border border-[#e7e1d7]/12 bg-white/[0.025] p-6 text-center">
                        <Calendar className="mx-auto h-7 w-7 text-[#f34213]/80" />
                        <p className="mt-3 text-[13px] uppercase tracking-[0.05em] text-[#e7e1d7]">
                          NO UPCOMING SLOTS LEFT ON THIS DAY
                        </p>
                        <p className="mt-1 text-[12.5px] text-[#e7e1d7]/60">
                          Pick tomorrow or any upcoming day on the calendar.
                        </p>
                        <button
                          type="button"
                          onClick={handleJumpTomorrow}
                          className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#f34213] px-5 text-[12px] font-medium uppercase tracking-[0.05em] text-[#0b0b0b] hover:bg-[#ff5629] transition-colors cursor-pointer"
                        >
                          <span>GO TO TOMORROW</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {visibleSlots.map((slot) => {
                          const isBooked = slot.status === "booked";
                          const isPicked =
                            selectedSlot?.startIso === slot.startIso;

                          return (
                            <button
                              key={slot.startIso}
                              type="button"
                              disabled={isBooked}
                              title={
                                isBooked
                                  ? "Already booked on Abdullah's calendar"
                                  : `Select ${slot.label12h}`
                              }
                              onMouseEnter={() => {
                                if (!isBooked) playHoverTick();
                              }}
                              onClick={() => {
                                if (isBooked) return;
                                playSelectSlot();
                                setSelectedSlot(slot);
                                setSubmitError(null);
                                setStep("details");
                              }}
                              className={`group relative h-11 rounded-xl border px-3 text-[12.5px] tabular-nums transition-all duration-200 flex items-center justify-between gap-1.5 ${
                                isBooked
                                  ? "border-white/[0.05] bg-white/[0.02] text-[#e7e1d7]/30 line-through cursor-not-allowed"
                                  : isPicked
                                  ? "border-[#f34213] bg-[#f34213] text-[#0b0b0b] font-semibold cursor-pointer"
                                  : "border-[#e7e1d7]/14 bg-white/[0.03] text-[#e7e1d7] hover:border-[#f34213] hover:bg-[#f34213]/[0.12] cursor-pointer"
                              }`}
                            >
                              <span>{slot.label12h}</span>
                              {isBooked ? (
                                <Lock className="h-3 w-3 shrink-0 opacity-60" />
                              ) : (
                                <ArrowRight className="h-3 w-3 shrink-0 opacity-40 transition-transform duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#f34213]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="mt-4 pt-3 border-t border-[#e7e1d7]/10 text-[11.5px] text-[#e7e1d7]/55 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-[#f34213]" />
                      Google Meet link generated instantly
                    </span>
                    <span className="uppercase tracking-[0.05em]">
                      12H AM/PM
                    </span>
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitBooking}
                  className="flex flex-col h-full justify-between gap-4"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playHoverTick();
                        setSubmitError(null);
                        setStep("slots");
                      }}
                      className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.06em] text-[#e7e1d7]/65 hover:text-[#f34213] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>CHANGE DATE / TIME</span>
                    </button>

                    {selectedSlot ? (
                      <div className="mt-3 rounded-2xl border border-[#f34213]/35 bg-[#f34213]/[0.08] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.07em] text-[#f34213]">
                            {selectedDateHeading}
                          </p>
                          <p className="mt-0.5 text-[15px] font-medium tabular-nums text-[#e7e1d7]">
                            {selectedSlot.label12h} – {selectedSlot.endLabel12h}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#e7e1d7]/15 bg-[#0b0b0b]/60 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#e7e1d7]">
                          {duration} MIN · MEET
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3.5">
                      <div>
                        <label
                          htmlFor="booking-name"
                          className="block text-[11px] uppercase tracking-[0.07em] text-[#e7e1d7]/65"
                        >
                          YOUR NAME *
                        </label>
                        <input
                          id="booking-name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={80}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ahmed Hassan"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#e7e1d7]/15 bg-white/[0.04] px-3.5 text-[14px] text-[#e7e1d7] placeholder:text-[#e7e1d7]/30 focus:border-[#f34213] focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="booking-email"
                          className="block text-[11px] uppercase tracking-[0.07em] text-[#e7e1d7]/65"
                        >
                          YOUR EMAIL (FOR GOOGLE MEET INVITE) *
                        </label>
                        <input
                          id="booking-email"
                          type="email"
                          required
                          maxLength={120}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#e7e1d7]/15 bg-white/[0.04] px-3.5 text-[14px] text-[#e7e1d7] placeholder:text-[#e7e1d7]/30 focus:border-[#f34213] focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="booking-notes"
                          className="block text-[11px] uppercase tracking-[0.07em] text-[#e7e1d7]/65"
                        >
                          PROJECT BRIEF / TOPIC (OPTIONAL)
                        </label>
                        <textarea
                          id="booking-notes"
                          rows={3}
                          maxLength={600}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Mobile app, UI/UX redesign, timeline, or goals..."
                          className="mt-1.5 w-full resize-none rounded-xl border border-[#e7e1d7]/15 bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-[#e7e1d7] placeholder:text-[#e7e1d7]/30 focus:border-[#f34213] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {submitError ? (
                      <div className="mt-3 rounded-xl border border-[#f34213]/40 bg-[#f34213]/10 px-3.5 py-2.5 text-[12.5px] text-[#ffb8a6]">
                        {submitError}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedSlot}
                    className="mt-2 h-12 w-full rounded-full bg-[#f34213] px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0b0b0b] hover:bg-[#ff5629] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_28px_rgba(243,66,19,0.35)]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>CREATING GOOGLE MEET...</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        <span>CONFIRM & BOOK GOOGLE MEET</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BookingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <BookingModalContent onClose={onClose} />;
}
