"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import {
  playBookingError,
  playBookingSuccess,
  playHoverTick,
  playSelectDate,
  playSelectSlot,
} from "@/lib/bookingAudio";
import {
  addDaysToCalendarDate,
  buildDaySlots,
  buildMonthGrid,
  formatTime12h,
  getCairoTodayParts,
  type BusyInterval,
  type TimeSlotItem,
} from "@/lib/bookingSlots";

type PopoverStep = "date" | "time" | "details" | "confirmed";
type DurationOption = (typeof siteConfig.booking.durations)[number];

interface SelectedDateState {
  year: number;
  month: number;
  day: number;
  dateKey: string;
}

interface ConfirmedBookingState {
  meetLink: string;
  guestEmail: string;
  dateLabel: string;
  timeRangeLabel: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const DURATION_LABELS: Record<DurationOption, string> = {
  30: "30m",
  45: "45m",
  60: "1h",
};

function formatCleanMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}

function formatShortDay(year: number, month: number, day: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatCompactDate(year: number, month: number, day: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function getInitialBookingSnapshot(nowMs: number): {
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
  const [{ today, initialDate, localTimeZone }] = useState(() =>
    getInitialBookingSnapshot(openedAtMs)
  );

  const [nowMs, setNowMs] = useState(openedAtMs);
  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [selectedDate, setSelectedDate] =
    useState<SelectedDateState>(initialDate);
  const [duration, setDuration] = useState<DurationOption>(
    siteConfig.booking.defaultDuration
  );
  const [step, setStep] = useState<PopoverStep>("date");

  const [loadingSlots, setLoadingSlots] = useState(isActive);
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
  const [copiedLink, setCopiedLink] = useState(false);

  const loadAvailability = (signal?: AbortSignal) => {
    const reqNowMs = Date.now();
    const fromIso = new Date(reqNowMs - 3_600_000).toISOString();
    const toIso = new Date(
      reqNowMs + (siteConfig.booking.maxAdvanceDays + 2) * 86_400_000
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
          busy?: BusyInterval[];
          error?: string;
        };
        if (signal?.aborted) return;
        setNowMs(Date.now());
        if (!res.ok || data.ok === false) {
          setFetchError(data.error || "Could not sync calendar");
        } else {
          setBusyIntervals(Array.isArray(data.busy) ? data.busy : []);
          setFetchError(null);
        }
        setLoadingSlots(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setFetchError("Could not sync calendar");
        setLoadingSlots(false);
      });
  };

  useEffect(() => {
    if (!isActive) return;
    const controller = new AbortController();
    loadAvailability(controller.signal);
    return () => {
      controller.abort();
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
    const maxUtc = todayUtc + siteConfig.booking.maxAdvanceDays * 86_400_000;
    return nextMonthStartUtc <= maxUtc;
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
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      playBookingError();
      setSubmitError("Enter a valid email");
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
      };

      if (res.status === 409 || data.code === "SLOT_TAKEN") {
        playBookingError();
        setLoadingSlots(true);
        await loadAvailability();
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
      setBusyIntervals((prev) => [
        ...prev,
        { start: selectedSlot.startIso, end: selectedSlot.endIso },
      ]);

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

  const handleCopyMeetLink = () => {
    if (!confirmed?.meetLink) return;
    playSelectDate();
    navigator.clipboard?.writeText(confirmed.meetLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1600);
  };

  if (step === "confirmed" && confirmed) {
    return (
      <div key="confirmed" className="booking-step-in px-4 py-5 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12] text-white">
          <Check className="h-4 w-4" />
        </div>

        <p className="mt-2.5 text-[14px] font-medium tracking-[-0.02em] text-white">
          Scheduled
        </p>
        <p className="mt-0.5 text-[12px] tabular-nums text-[#e7e1d7]/65">
          {confirmed.dateLabel} · {confirmed.timeRangeLabel}
        </p>
        <p className="mt-1 text-[11px] text-[#e7e1d7]/42 truncate">
          Invite sent to {confirmed.guestEmail}
        </p>

        <div className="mt-3.5 flex items-center justify-center gap-2">
          {confirmed.meetLink ? (
            <button
              type="button"
              onClick={handleCopyMeetLink}
              className="h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.13] px-3.5 text-[11.5px] text-white transition-colors cursor-pointer"
            >
              {copiedLink ? "Copied" : "Copy link"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-full bg-[#e7e1d7] hover:bg-white px-4 text-[11.5px] font-medium text-[#0b0b0b] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === "details" && selectedSlot) {
    return (
      <div key="details" className="booking-step-in">
        <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5 border-b border-white/[0.07]">
          <button
            type="button"
            onClick={() => {
              playHoverTick();
              setSubmitError(null);
              setStep("time");
            }}
            className="flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.02em] text-white hover:text-[#e7e1d7]/75 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>
              {formatCompactDate(
                selectedDate.year,
                selectedDate.month,
                selectedDate.day
              )}{" "}
              · {selectedSlot.label12h}
            </span>
          </button>

          <span className="text-[11.5px] text-[#e7e1d7]/45">
            {duration === 60 ? "1 hr" : `${duration} min`}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-2">
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Your name"
            className="h-9 w-full rounded-[10px] bg-white/[0.045] border border-white/[0.08] px-3 text-[12.5px] text-white placeholder:text-[#e7e1d7]/32 focus:border-white/30 focus:outline-none transition-colors"
          />

          <input
            type="email"
            required
            maxLength={120}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Your email"
            className="h-9 w-full rounded-[10px] bg-white/[0.045] border border-white/[0.08] px-3 text-[12.5px] text-white placeholder:text-[#e7e1d7]/32 focus:border-white/30 focus:outline-none transition-colors"
          />

          <input
            type="text"
            maxLength={600}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Optional note"
            className="h-9 w-full rounded-[10px] bg-white/[0.045] border border-white/[0.08] px-3 text-[12.5px] text-white placeholder:text-[#e7e1d7]/32 focus:border-white/30 focus:outline-none transition-colors"
          />

          {submitError ? (
            <p className="px-0.5 text-[11.5px] text-[#ff9482]">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded-[10px] bg-[#e7e1d7] hover:bg-white text-[#0b0b0b] text-[12.5px] font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (step === "time") {
    return (
      <div key="time" className="booking-step-in">
        <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5 border-b border-white/[0.07]">
          <button
            type="button"
            onClick={() => {
              playHoverTick();
              setSubmitError(null);
              setStep("date");
            }}
            className="flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.02em] text-white hover:text-[#e7e1d7]/75 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>
              {formatShortDay(
                selectedDate.year,
                selectedDate.month,
                selectedDate.day
              )}
            </span>
          </button>

          <div className="flex items-center rounded-full bg-white/[0.05] p-0.5 text-[11px]">
            {siteConfig.booking.durations.map((mins) => {
              const active = duration === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectDuration(mins)}
                  className={`rounded-full px-2.5 py-0.5 transition-colors ${
                    active
                      ? "bg-[#e7e1d7] text-[#0b0b0b] font-medium"
                      : "text-[#e7e1d7]/55 hover:text-white cursor-pointer"
                  }`}
                >
                  {DURATION_LABELS[mins]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3.5">
          {submitError ? (
            <p className="mb-2 text-[11.5px] text-[#ff9482]">{submitError}</p>
          ) : null}

          {loadingSlots ? (
            <div className="flex items-center justify-center py-9">
              <Loader2 className="h-4 w-4 animate-spin text-[#e7e1d7]/45" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-7 text-center">
              <p className="text-[12px] text-[#e7e1d7]/55">{fetchError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadingSlots(true);
                  loadAvailability();
                }}
                className="h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3.5 text-[11.5px] text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : visibleSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-7 text-center">
              <p className="text-[12px] text-[#e7e1d7]/55">
                No times left today
              </p>
              <button
                type="button"
                onClick={handleJumpTomorrow}
                className="h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3.5 text-[12px] text-white transition-colors cursor-pointer"
              >
                Tomorrow →
              </button>
            </div>
          ) : (
            <div
              data-lenis-prevent=""
              onWheel={(e) => e.stopPropagation()}
              className="booking-slots-scroll grid grid-cols-3 gap-1.5 max-h-[172px] overflow-y-auto pr-0.5"
            >
              {visibleSlots.map((slot) => {
                const isBooked = slot.status === "booked";
                return (
                  <button
                    key={slot.startIso}
                    type="button"
                    disabled={isBooked}
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
                    className={`h-8 rounded-[10px] border text-[11.5px] tabular-nums transition-all duration-150 ${
                      isBooked
                        ? "border-white/[0.03] text-[#e7e1d7]/20 cursor-not-allowed"
                        : "bg-white/[0.04] hover:bg-[#e7e1d7] border-white/[0.07] hover:border-[#e7e1d7] text-[#e7e1d7]/90 hover:text-[#0b0b0b] hover:font-medium cursor-pointer"
                    }`}
                  >
                    {slot.label12h}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div key="date" className="booking-step-in">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className="text-[13.5px] font-medium tracking-[-0.02em] text-white">
          {formatCleanMonth(viewYear, viewMonth)}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoPrevMonth}
            onClick={() => handleShiftMonth(-1)}
            aria-label="Previous month"
            className="h-7 w-7 rounded-full flex items-center justify-center text-[#e7e1d7]/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canGoNextMonth}
            onClick={() => handleShiftMonth(1)}
            aria-label="Next month"
            className="h-7 w-7 rounded-full flex items-center justify-center text-[#e7e1d7]/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 pb-1 grid grid-cols-7 text-center text-[10.5px] text-[#e7e1d7]/38">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-0.5">
            {day}
          </span>
        ))}
      </div>

      <div className="px-3 pb-3.5 grid grid-cols-7 gap-y-1 text-center">
        {monthCells.map((cell) => {
          if (!cell.inCurrentMonth) {
            return <span key={cell.dateKey} className="h-8 w-8 mx-auto" />;
          }

          if (cell.isPast || cell.isBeyondWindow) {
            return (
              <span
                key={cell.dateKey}
                className="h-8 w-8 mx-auto flex items-center justify-center text-[12.5px] tabular-nums text-[#e7e1d7]/18 select-none"
              >
                {cell.day}
              </span>
            );
          }

          const isSelected = selectedDate.dateKey === cell.dateKey;
          return (
            <button
              key={cell.dateKey}
              type="button"
              onMouseEnter={() => playHoverTick()}
              onClick={() => {
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
              className={`relative h-8 w-8 mx-auto rounded-full text-[12.5px] tabular-nums flex items-center justify-center transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#e7e1d7] text-[#0b0b0b] font-medium"
                  : "text-[#e7e1d7]/88 hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              <span>{cell.day}</span>
              {cell.isToday && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-white/45"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingModal({
  open,
  openUpward,
  sessionKey,
  openedAtMs,
  onClose,
}: {
  open: boolean;
  openUpward: boolean;
  sessionKey: number;
  openedAtMs: number;
  onClose: () => void;
}) {
  if (openedAtMs <= 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Schedule a call"
      aria-hidden={!open}
      data-lenis-prevent=""
      onWheel={(e) => e.stopPropagation()}
      className={`absolute z-30 w-[min(324px,calc(100vw-24px))] left-1/2 -translate-x-1/2 sm:w-auto sm:left-0 sm:right-0 sm:translate-x-0 ${
        openUpward
          ? "bottom-[calc(100%+12px)] origin-bottom"
          : "top-[calc(100%+12px)] origin-top"
      } transition-[opacity,transform,visibility] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto visible"
          : `opacity-0 ${
              openUpward ? "translate-y-2.5" : "-translate-y-2.5"
            } scale-[0.96] pointer-events-none invisible`
      }`}
    >
      <div className="rounded-[22px] border border-white/[0.1] bg-[#121110]/88 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)] overflow-hidden text-[#e7e1d7]">
        <BookingPopoverBody
          key={sessionKey}
          isActive={open}
          openedAtMs={openedAtMs}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
