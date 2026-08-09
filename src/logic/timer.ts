// Temporizador de descanso basado en timestamp absoluto (targetEndAt).
// Nunca depende de un contador en memoria: al volver del segundo plano
// el tiempo restante se recalcula contra el reloj real.

import type { TimerState } from "../db/types";

export const remainingMs = (t: TimerState, nowMs: number): number => {
  if (t.pausedRemainingMs !== null) return Math.max(0, t.pausedRemainingMs);
  return Math.max(0, t.targetEndAt - nowMs);
};

export const isFinished = (t: TimerState, nowMs: number): boolean =>
  remainingMs(t, nowMs) <= 0;

export const pause = (t: TimerState, nowMs: number): TimerState => ({
  ...t,
  pausedRemainingMs: remainingMs(t, nowMs)
});

export const resume = (t: TimerState, nowMs: number): TimerState => ({
  ...t,
  targetEndAt: nowMs + (t.pausedRemainingMs ?? 0),
  pausedRemainingMs: null
});

export const addSeconds = (t: TimerState, sec: number, nowMs: number): TimerState => {
  if (t.pausedRemainingMs !== null) {
    return { ...t, pausedRemainingMs: t.pausedRemainingMs + sec * 1000, totalSec: t.totalSec + sec };
  }
  return {
    ...t,
    targetEndAt: Math.max(t.targetEndAt, nowMs) + sec * 1000,
    totalSec: t.totalSec + sec
  };
};

export const formatClock = (ms: number): string => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const formatRestRange = (minSec: number, maxSec: number): string => {
  const f = (s: number) =>
    s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return minSec === maxSec ? f(minSec) : `${f(minSec)}–${f(maxSec)}`;
};
