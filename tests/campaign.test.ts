// Ciclo de campaña con fechas fijas: prólogo, capítulos 1..6 y bloque
// forjado. Nada depende del día real de ejecución.

import { describe, expect, it } from "vitest";
import { campaignPhase, flameStateOf, summarizeBlock } from "../src/logic/campaign";
import { summarizeWeeks, flameStreak, type SessionLike } from "../src/logic/streak";

// Lunes 10 de agosto de 2026: inicio de campaña de referencia.
const START = "2026-08-10";
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

const sessionsFor = (dateKeys: string[], status = "completada"): SessionLike[] =>
  dateKeys.map((dateKey) => ({ dateKey, status }));

describe("campaignPhase", () => {
  it("prólogo antes del inicio, con cuenta atrás y sin capítulo activo", () => {
    const phase = campaignPhase(START, d(2026, 8, 9)); // domingo previo
    expect(phase).toEqual({ kind: "prologo", startKey: START, daysUntil: 1 });
  });

  it("prólogo de varios días (instalación en jueves)", () => {
    const phase = campaignPhase(START, d(2026, 8, 6));
    expect(phase.kind).toBe("prologo");
    if (phase.kind === "prologo") expect(phase.daysUntil).toBe(4);
  });

  it("semana 1 el mismo lunes de inicio", () => {
    expect(campaignPhase(START, d(2026, 8, 10))).toEqual({ kind: "activa", week: 1 });
  });

  it("semana 6 hasta el domingo final", () => {
    expect(campaignPhase(START, d(2026, 9, 14))).toEqual({ kind: "activa", week: 6 });
    expect(campaignPhase(START, d(2026, 9, 20))).toEqual({ kind: "activa", week: 6 });
  });

  it("bloque forjado después de la semana 6", () => {
    expect(campaignPhase(START, d(2026, 9, 21))).toEqual({ kind: "forjado", weeksSince: 1 });
    expect(campaignPhase(START, d(2026, 10, 5))).toEqual({ kind: "forjado", weeksSince: 3 });
  });
});

describe("flameStateOf", () => {
  const weeksAt = (today: Date, sessions: SessionLike[] = []) =>
    summarizeWeeks(sessions, START, 3, today, 6);

  it("apagada durante el prólogo", () => {
    const today = d(2026, 8, 9);
    const weeks = weeksAt(today);
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, weeks, flameStreak(weeks, today, START))).toBe("apagada");
  });

  it("rescoldo en la primera semana sin objetivo aún", () => {
    const today = d(2026, 8, 12);
    const weeks = weeksAt(today, sessionsFor(["2026-08-10"]));
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, weeks, flameStreak(weeks, today, START))).toBe("rescoldo");
  });

  it("roja cuando la semana en curso cumple el objetivo", () => {
    const today = d(2026, 8, 14);
    const weeks = weeksAt(
      today,
      sessionsFor(["2026-08-10", "2026-08-11", "2026-08-14"])
    );
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, weeks, flameStreak(weeks, today, START))).toBe("roja");
  });

  it("encendida si la racha viene de la semana anterior y la actual aún no suma", () => {
    const today = d(2026, 8, 18); // semana 2
    const weeks = weeksAt(
      today,
      sessionsFor(["2026-08-10", "2026-08-11", "2026-08-14"]) // semana 1 cumplida
    );
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, weeks, flameStreak(weeks, today, START))).toBe("encendida");
  });

  it("las sesiones adaptadas también mantienen la llama", () => {
    const today = d(2026, 8, 14);
    const weeks = summarizeWeeks(
      [
        ...sessionsFor(["2026-08-10", "2026-08-11"]),
        ...sessionsFor(["2026-08-14"], "adaptada")
      ],
      START,
      3,
      today,
      6
    );
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, weeks, flameStreak(weeks, today, START))).toBe("roja");
  });

  it("tras el bloque: encendida si terminó con racha, rescoldo si no", () => {
    const today = d(2026, 9, 22); // lunes tras la semana 6
    const met = summarizeWeeks(
      sessionsFor(["2026-09-14", "2026-09-15", "2026-09-18"]), // semana 6 cumplida
      START,
      3,
      today,
      6
    );
    const phase = campaignPhase(START, today);
    expect(flameStateOf(phase, met, flameStreak(met, today, START))).toBe("encendida");

    const unmet = summarizeWeeks([], START, 3, today, 6);
    expect(flameStateOf(phase, unmet, flameStreak(unmet, today, START))).toBe("rescoldo");
  });
});

describe("summarizeBlock", () => {
  it("agrega semanas cumplidas y misiones del bloque", () => {
    const today = d(2026, 9, 22);
    const weeks = summarizeWeeks(
      [
        ...sessionsFor(["2026-08-10", "2026-08-11", "2026-08-14"]),
        ...sessionsFor(["2026-08-17", "2026-08-18"]),
        ...sessionsFor(["2026-08-21"], "adaptada")
      ],
      START,
      3,
      today,
      6
    );
    const block = summarizeBlock(weeks);
    expect(block.totalWeeks).toBe(6);
    expect(block.weeksMet).toBe(2);
    expect(block.completed).toBe(5);
    expect(block.adapted).toBe(1);
  });
});
