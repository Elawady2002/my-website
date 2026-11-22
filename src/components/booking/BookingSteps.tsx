"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useClipboardCopy } from "@/hooks/useClipboardCopy";
import { playBookingSuccess, playHoverTick } from "@/lib/bookingAudio";
import type { CalendarDayCell, TimeSlotItem } from "@/lib/bookingSlots";
import type { SuccessOrbController } from "@/three/successOrbScene";

export type DurationOption = (typeof siteConfig.booking.durations)[number];

export interface SelectedDateState {
  year: number;
  month: number;
  day: number;
  dateKey: string;
}

export interface ConfirmedBookingState {
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

const CLEAN_MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const SHORT_DAY_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const COMPACT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

export function formatCompactDate(
  year: number,
  month: number,
  day: number
): string {
  return COMPACT_DATE_FMT.format(new Date(Date.UTC(year, month - 1, day)));
}

function InteractiveSuccessOrb({
  orbCtrlRef,
}: {
  orbCtrlRef: React.RefObject<SuccessOrbController | null>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let ctrl: SuccessOrbController | null = null;

    import("@/three/successOrbScene").then(({ mountSuccessOrbScene }) => {
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

export function DateStep({
  viewYear,
  viewMonth,
  monthCells,
  selectedDateKey,
  canGoPrevMonth,
  canGoNextMonth,
  onShiftMonth,
  onSelectDate,
}: {
  viewYear: number;
  viewMonth: number;
  monthCells: readonly CalendarDayCell[];
  selectedDateKey: string;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  onShiftMonth: (delta: -1 | 1) => void;
  onSelectDate: (cell: CalendarDayCell) => void;
}) {
  return (
    <div key="date" className="booking-step-in">
      <div className="flex items-center justify-between px-[18px] pt-4 pb-2.5">
        <span className="text-[14px] font-medium tracking-[-0.02em] text-white">
          {CLEAN_MONTH_FMT.format(new Date(Date.UTC(viewYear, viewMonth - 1, 15)))}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoPrevMonth}
            onClick={() => onShiftMonth(-1)}
            aria-label="Previous month"
            className="h-7 w-7 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canGoNextMonth}
            onClick={() => onShiftMonth(1)}
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

          const isSelected = selectedDateKey === cell.dateKey;
          return (
            <button
              key={cell.dateKey}
              type="button"
              onMouseEnter={() => playHoverTick()}
              onClick={() => onSelectDate(cell)}
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

export function TimeStep({
  selectedDate,
  duration,
  loadingSlots,
  fetchError,
  submitError,
  visibleSlots,
  onBack,
  onSelectDuration,
  onRetry,
  onJumpTomorrow,
  onSelectSlot,
}: {
  selectedDate: SelectedDateState;
  duration: DurationOption;
  loadingSlots: boolean;
  fetchError: string | null;
  submitError: string | null;
  visibleSlots: readonly TimeSlotItem[];
  onBack: () => void;
  onSelectDuration: (mins: DurationOption) => void;
  onRetry: () => void;
  onJumpTomorrow: () => void;
  onSelectSlot: (slot: TimeSlotItem) => void;
}) {
  return (
    <div key="time" className="booking-step-in">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-medium tracking-[-0.02em] text-white hover:text-white/75 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>
            {SHORT_DAY_FMT.format(
              new Date(
                Date.UTC(
                  selectedDate.year,
                  selectedDate.month - 1,
                  selectedDate.day
                )
              )
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
                onClick={() => onSelectDuration(mins)}
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
          <div
            aria-busy="true"
            aria-label="Loading available times"
            className="grid grid-cols-3 gap-2"
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[38px] rounded-[11px] border border-white/[0.06] bg-white/[0.045] animate-pulse"
              />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
            <p className="text-[12.5px] text-white/55">{fetchError}</p>
            <button
              type="button"
              onClick={onRetry}
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
              onClick={onJumpTomorrow}
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
                  onClick={() => onSelectSlot(slot)}
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

export function DetailsStep({
  selectedDate,
  selectedSlot,
  duration,
  name,
  email,
  notes,
  honeypot,
  submitting,
  submitError,
  nameInputRef,
  emailInputRef,
  onBack,
  onNameChange,
  onEmailChange,
  onNotesChange,
  onHoneypotChange,
  onSubmit,
}: {
  selectedDate: SelectedDateState;
  selectedSlot: TimeSlotItem;
  duration: DurationOption;
  name: string;
  email: string;
  notes: string;
  honeypot: string;
  submitting: boolean;
  submitError: string | null;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  emailInputRef: React.RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onHoneypotChange: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div key="details" className="booking-step-in">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={onBack}
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

      <form onSubmit={onSubmit} noValidate className="p-4 space-y-2.5">
        <div className="voy-glass-input rounded-[12px] h-[42px] px-3.5 flex items-center gap-2.5">
          <User className="h-3.5 w-3.5 shrink-0 text-white/38" />
          <input
            ref={nameInputRef}
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
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
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Optional note"
            className="w-full resize-none bg-transparent text-[16px] sm:text-[13px] leading-[1.45] text-white placeholder:text-white/32 focus:outline-none"
          />
        </div>

        {submitError ? (
          <p className="px-0.5 text-[11.5px] text-[#ff9482]">{submitError}</p>
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
            onChange={(e) => onHoneypotChange(e.target.value)}
            className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 opacity-0 p-0 border-0"
          />
        </div>
      </form>
    </div>
  );
}

export function ConfirmedStep({
  confirmed,
  onClose,
}: {
  confirmed: ConfirmedBookingState;
  onClose: () => void;
}) {
  const orbCtrlRef = useRef<SuccessOrbController | null>(null);
  const boxRectRef = useRef<DOMRect | null>(null);
  const { copied: copiedLink, copy } = useClipboardCopy();

  return (
    <div
      key="confirmed"
      onPointerEnter={(e) => {
        boxRectRef.current = e.currentTarget.getBoundingClientRect();
      }}
      onPointerMove={(e) => {
        const rect =
          boxRectRef.current || e.currentTarget.getBoundingClientRect();
        boxRectRef.current = rect;
        const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
        orbCtrlRef.current?.setHoverTilt(nx, ny);
      }}
      onPointerLeave={() => {
        boxRectRef.current = null;
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
            onClick={() => {
              if (!confirmed.meetLink) return;
              playHoverTick();
              copy(confirmed.meetLink);
            }}
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
