"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Mail,
  MessageSquare,
  User,
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
import type { SuccessOrbController } from "@/components/successOrbScene";

export interface PopoverAnchorBox {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  openUpward: boolean;
}

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

function InteractiveSuccessOrb({
  orbCtrlRef,
}: {
  orbCtrlRef: React.MutableRefObject<SuccessOrbController | null>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let ctrl: SuccessOrbController | null = null;

    import("./successOrbScene").then(({ mountSuccessOrbScene }) => {
      if (disposed || !containerRef.current) return;
      ctrl = mountSuccessOrbScene(containerRef.current, {
        onTriggerChime: () => playBookingSuccess(),
      });
      if (!ctrl) {
        setWebglFailed(true);
      } else {
        orbCtrlRef.current = ctrl;
      }
    });

    return () => {
      disposed = true;
      ctrl?.dispose();
      orbCtrlRef.current = null;
    };
  }, [orbCtrlRef]);

  if (webglFailed) {
    return (
      <button
        type="button"
        onClick={() => playBookingSuccess()}
        aria-label="Confirmed"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#119e49] text-white shadow-lg cursor-pointer"
      >
        <Check className="h-7 w-7 stroke-[2.6]" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      title="Drag or tap"
      className="relative mx-auto h-[84px] w-[84px] select-none"
    />
  );
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
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBookingState | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const orbCtrlRef = useRef<SuccessOrbController | null>(null);

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
      <div
        key="confirmed"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
          const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
          orbCtrlRef.current?.setHoverTilt(nx, ny);
        }}
        onPointerLeave={() => {
          orbCtrlRef.current?.setHoverTilt(0, 0);
        }}
        className="booking-step-in px-5 pt-4 pb-6 text-center"
      >
        <InteractiveSuccessOrb orbCtrlRef={orbCtrlRef} />

        <p className="mt-1.5 text-[14.5px] font-medium tracking-[-0.02em] text-white">
          Scheduled
        </p>
        <p className="mt-0.5 text-[12.5px] tabular-nums text-white/60">
          {confirmed.dateLabel} · {confirmed.timeRangeLabel}
        </p>
        <p className="mt-1 text-[11.5px] text-white/40 truncate">
          Invite sent to {confirmed.guestEmail}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          {confirmed.meetLink ? (
            <button
              type="button"
              onClick={handleCopyMeetLink}
              className="h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-4 text-[12px] text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#4ade80]" />
                  <span className="text-[#4ade80]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-white/75" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="voy-glass-cta h-9 rounded-full px-5 text-[12px] font-medium text-white cursor-pointer"
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
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              playHoverTick();
              setSubmitError(null);
              setStep("time");
            }}
            className="flex items-center gap-1.5 text-[13.5px] font-medium tracking-[-0.02em] text-white hover:text-white/75 transition-colors cursor-pointer"
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

          <span className="rounded-full bg-white/[0.06] border border-white/[0.09] px-2.5 py-0.5 text-[11px] text-white/65">
            {duration === 60 ? "1 hr" : `${duration} min`}
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-2.5">
          <div className="voy-glass-input rounded-[12px] h-[42px] px-3.5 flex items-center gap-2.5">
            <User className="h-3.5 w-3.5 shrink-0 text-white/38" />
            <input
              ref={nameInputRef}
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              className="w-full bg-transparent text-[16px] sm:text-[13px] text-white placeholder:text-white/32 focus:outline-none"
            />
          </div>

          <div className="voy-glass-input rounded-[12px] h-[42px] px-3.5 flex items-center gap-2.5">
            <Mail className="h-3.5 w-3.5 shrink-0 text-white/38" />
            <input
              ref={emailInputRef}
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-label="Your email"
              className="w-full bg-transparent text-[16px] sm:text-[13px] text-white placeholder:text-white/32 focus:outline-none"
            />
          </div>

          <div className="voy-glass-input rounded-[12px] px-3.5 py-2.5 flex items-start gap-2.5">
            <MessageSquare className="mt-1 h-3.5 w-3.5 shrink-0 text-white/38" />
            <textarea
              rows={2}
              maxLength={600}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note (optional)"
              aria-label="Optional note"
              className="w-full resize-none bg-transparent text-[16px] sm:text-[13px] leading-[1.45] text-white placeholder:text-white/32 focus:outline-none"
            />
          </div>

          {submitError ? (
            <p className="px-0.5 text-[11.5px] text-[#ff9482]">
              {submitError}
            </p>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="voy-glass-cta h-[42px] w-full rounded-[12px] text-[13px] font-medium tracking-[-0.01em] text-white disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
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
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 opacity-0 p-0 border-0"
            />
          </div>
        </form>
      </div>
    );
  }

  if (step === "time") {
    return (
      <div key="time" className="booking-step-in">
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              playHoverTick();
              setSubmitError(null);
              setStep("date");
            }}
            className="flex items-center gap-1.5 text-[13.5px] font-medium tracking-[-0.02em] text-white hover:text-white/75 transition-colors cursor-pointer"
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

          <div className="h-[32px] rounded-full bg-white/[0.05] border border-white/[0.08] p-[3px] flex items-center gap-0.5 text-[11.5px]">
            {siteConfig.booking.durations.map((mins) => {
              const active = duration === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectDuration(mins)}
                  className={`h-full px-2.5 rounded-full flex items-center justify-center transition-all ${
                    active
                      ? "bg-white/[0.16] text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_4px_rgba(0,0,0,0.3)]"
                      : "text-white/50 hover:text-white/85 cursor-pointer"
                  }`}
                >
                  {DURATION_LABELS[mins]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {submitError ? (
            <p className="mb-2.5 text-[11.5px] text-[#ff9482]">{submitError}</p>
          ) : null}

          {loadingSlots ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-4 w-4 animate-spin text-white/45" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
              <p className="text-[12.5px] text-white/55">{fetchError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadingSlots(true);
                  loadAvailability();
                }}
                className="h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-4 text-[12px] text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : visibleSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-[12.5px] text-white/55">No times left today</p>
              <button
                type="button"
                onClick={handleJumpTomorrow}
                className="h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-4 text-[12px] text-white transition-colors cursor-pointer"
              >
                Tomorrow →
              </button>
            </div>
          ) : (
            <div
              data-lenis-prevent=""
              onWheel={(e) => e.stopPropagation()}
              className="booking-slots-scroll grid grid-cols-3 gap-2 max-h-[264px] overflow-y-auto pr-1"
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
                    className={`h-[38px] rounded-[11px] border text-[12px] tabular-nums transition-all duration-150 ${
                      isBooked
                        ? "border-white/[0.03] text-white/18 cursor-not-allowed"
                        : "bg-white/[0.04] hover:bg-white/[0.14] border-white/[0.075] hover:border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] text-white/85 hover:text-white cursor-pointer"
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
      <div className="flex items-center justify-between px-[18px] pt-4 pb-2.5">
        <span className="text-[14px] font-medium tracking-[-0.02em] text-white">
          {formatCleanMonth(viewYear, viewMonth)}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoPrevMonth}
            onClick={() => handleShiftMonth(-1)}
            aria-label="Previous month"
            className="h-7 w-7 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canGoNextMonth}
            onClick={() => handleShiftMonth(1)}
            aria-label="Next month"
            className="h-7 w-7 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3.5 pb-1.5 grid grid-cols-7 text-center text-[11px] text-white/35">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-0.5">
            {day}
          </span>
        ))}
      </div>

      <div className="px-3.5 pb-4 grid grid-cols-7 gap-y-1.5 text-center">
        {monthCells.map((cell) => {
          if (!cell.inCurrentMonth) {
            return <span key={cell.dateKey} className="h-9 w-9 mx-auto" />;
          }

          if (cell.isPast || cell.isBeyondWindow) {
            return (
              <span
                key={cell.dateKey}
                className="h-9 w-9 mx-auto flex items-center justify-center text-[13px] tabular-nums text-white/16 select-none"
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
              className={`relative h-9 w-9 mx-auto rounded-full text-[13px] tabular-nums flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-white/[0.15] text-white font-medium border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "text-white/85 hover:bg-white/[0.09] hover:text-white"
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
    </div>
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
        const cardH = Math.min(shell.offsetHeight || 300, maxH);
        const top = vv.offsetTop + Math.max(8, (vv.height - cardH) * 0.5);
        shell.style.top = `${top.toFixed(1)}px`;
        shell.style.bottom = "auto";
        shell.style.transformOrigin = "50% 50%";
        return;
      }

      shell.style.maxHeight = "";
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
      className={`voy-popover-glass fixed z-[52] rounded-[24px] overflow-x-hidden overflow-y-auto overscroll-contain text-white transition-[opacity,transform,visibility] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
