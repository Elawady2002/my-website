let sharedAudioCtx: AudioContext | null = null;
let audioMuted = false;
let lastHoverTickMs = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || audioMuted) return null;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return null;
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function scheduleTone(
  ctx: AudioContext,
  opts: {
    startTime: number;
    durationSec: number;
    startFreq: number;
    endFreq?: number;
    peakGain: number;
    type?: OscillatorType;
  }
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "sine";

  osc.frequency.setValueAtTime(opts.startFreq, opts.startTime);
  if (opts.endFreq && opts.endFreq !== opts.startFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      opts.endFreq,
      opts.startTime + opts.durationSec
    );
  }

  gain.gain.setValueAtTime(0.0001, opts.startTime);
  gain.gain.linearRampToValueAtTime(opts.peakGain, opts.startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    opts.startTime + opts.durationSec
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(opts.startTime);
  osc.stop(opts.startTime + opts.durationSec + 0.015);
}

export function isBookingAudioMuted(): boolean {
  return audioMuted;
}

export function setBookingAudioMuted(muted: boolean): void {
  audioMuted = muted;
}

export function playModalOpen(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  scheduleTone(ctx, {
    startTime: t,
    durationSec: 0.14,
    startFreq: 220,
    endFreq: 440,
    peakGain: 0.055,
    type: "sine",
  });
  scheduleTone(ctx, {
    startTime: t + 0.045,
    durationSec: 0.14,
    startFreq: 554.37,
    endFreq: 659.25,
    peakGain: 0.032,
    type: "triangle",
  });
}

export function playModalClose(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  scheduleTone(ctx, {
    startTime: t,
    durationSec: 0.11,
    startFreq: 360,
    endFreq: 190,
    peakGain: 0.04,
    type: "sine",
  });
}

export function playHoverTick(): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastHoverTickMs < 55) return;
  lastHoverTickMs = now;

  const ctx = getAudioContext();
  if (!ctx) return;
  scheduleTone(ctx, {
    startTime: ctx.currentTime,
    durationSec: 0.018,
    startFreq: 1350,
    endFreq: 980,
    peakGain: 0.015,
    type: "sine",
  });
}

export function playSelectDate(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  scheduleTone(ctx, {
    startTime: ctx.currentTime,
    durationSec: 0.075,
    startFreq: 520,
    endFreq: 780,
    peakGain: 0.055,
    type: "sine",
  });
}

export function playSelectSlot(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  scheduleTone(ctx, {
    startTime: t,
    durationSec: 0.085,
    startFreq: 660,
    endFreq: 740,
    peakGain: 0.055,
    type: "sine",
  });
  scheduleTone(ctx, {
    startTime: t + 0.035,
    durationSec: 0.09,
    startFreq: 990,
    endFreq: 1046.5,
    peakGain: 0.04,
    type: "triangle",
  });
}

export function playBookingSuccess(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 987.77];
  const base = ctx.currentTime;
  notes.forEach((freq, idx) => {
    scheduleTone(ctx, {
      startTime: base + idx * 0.065,
      durationSec: 0.45,
      startFreq: freq,
      peakGain: 0.068 - idx * 0.008,
      type: idx === notes.length - 1 ? "triangle" : "sine",
    });
  });
}

export function playBookingError(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const base = ctx.currentTime;
  scheduleTone(ctx, {
    startTime: base,
    durationSec: 0.11,
    startFreq: 240,
    endFreq: 185,
    peakGain: 0.05,
    type: "triangle",
  });
  scheduleTone(ctx, {
    startTime: base + 0.12,
    durationSec: 0.13,
    startFreq: 210,
    endFreq: 160,
    peakGain: 0.045,
    type: "triangle",
  });
}
