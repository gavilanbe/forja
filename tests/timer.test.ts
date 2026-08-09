import { describe, expect, it } from "vitest";
import {
  addSeconds,
  formatClock,
  isFinished,
  pause,
  remainingMs,
  resume
} from "../src/logic/timer";
import type { TimerState } from "../src/db/types";

const base = (over: Partial<TimerState> = {}): TimerState => ({
  sessionId: "s",
  exerciseId: "e",
  exerciseIndex: 0,
  nextSetNumber: 2,
  totalSec: 180,
  targetEndAt: 1_000_000 + 180_000,
  pausedRemainingMs: null,
  ...over
});

describe("temporizador con timestamp absoluto", () => {
  it("el tiempo restante se calcula contra el reloj real (sobrevive al segundo plano)", () => {
    const t = base();
    expect(remainingMs(t, 1_000_000)).toBe(180_000);
    // La app estuvo 2 minutos en segundo plano:
    expect(remainingMs(t, 1_000_000 + 120_000)).toBe(60_000);
    expect(isFinished(t, 1_000_000 + 180_000)).toBe(true);
    expect(remainingMs(t, 1_000_000 + 999_000)).toBe(0);
  });

  it("pausar congela el restante y reanudar recoloca el objetivo", () => {
    let t = base();
    t = pause(t, 1_000_000 + 60_000); // quedaban 120 s
    expect(remainingMs(t, 1_000_000 + 500_000)).toBe(120_000); // congelado
    t = resume(t, 2_000_000);
    expect(t.pausedRemainingMs).toBeNull();
    expect(remainingMs(t, 2_000_000)).toBe(120_000);
    expect(remainingMs(t, 2_000_000 + 120_000)).toBe(0);
  });

  it("añadir 15 s funciona corriendo y en pausa", () => {
    const running = addSeconds(base(), 15, 1_000_000);
    expect(remainingMs(running, 1_000_000)).toBe(195_000);
    const paused = addSeconds(
      base({ pausedRemainingMs: 30_000 }),
      15,
      1_000_000
    );
    expect(remainingMs(paused, 9_999_999)).toBe(45_000);
  });

  it("si el objetivo ya pasó, +15 s parte de ahora", () => {
    const t = base();
    const late = 1_000_000 + 300_000; // terminó hace 2 min
    const extended = addSeconds(t, 15, late);
    expect(remainingMs(extended, late)).toBe(15_000);
  });

  it("formatea el reloj como m:ss", () => {
    expect(formatClock(180_000)).toBe("3:00");
    expect(formatClock(61_000)).toBe("1:01");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-5)).toBe("0:00");
  });
});
