import { useEffect, useRef } from "react";

// ── AudioContext singleton — created once, reused across calls ────────────────
let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
  if (audioCtx && audioCtx.state !== "closed") return audioCtx;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
};

// Unlock AudioContext on ANY user interaction — browsers require a gesture
// before audio can play. This runs as soon as the admin clicks anything.
const unlockAudio = () => {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume();
};

if (typeof window !== "undefined") {
  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);
}

// ── Synthesized two-tone ding ─────────────────────────────────────────────────
export const playDing = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const doPlay = () => {
    const beep = (freq: number, startAt: number, duration: number, vol = 0.35) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
        gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startAt + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration + 0.05);
      } catch { /* ignore */ }
    };
    // Ascending two-tone: G5 (784Hz) → B5 (988Hz)
    beep(784, 0,    0.18);
    beep(988, 0.22, 0.30);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(doPlay).catch(() => {});
  } else {
    doPlay();
  }
};

// ── Hook ──────────────────────────────────────────────────────────────────────
// Usage: call useOrderAlert(orders) inside the Admin component.
// Plays a ding whenever a genuinely new order appears.
// Does NOT fire on the initial data load — only on live incoming orders.

export const useOrderAlert = (orders: any[]) => {
  const seenIds = useRef<Set<string>>(new Set());
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      orders.forEach((o) => seenIds.current.add(o.id));
      initialised.current = true;
      return;
    }
    let hasNew = false;
    orders.forEach((o) => {
      if (!seenIds.current.has(o.id)) {
        seenIds.current.add(o.id);
        hasNew = true;
      }
    });
    if (hasNew) playDing();
  }, [orders]);
};