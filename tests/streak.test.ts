import { describe, expect, it } from "vitest";
import { flameStreak, summarizeWeeks } from "../src/logic/streak";

// Campaña que empieza el lunes 2026-08-03. Semana 1: 3–9 ago.
const START = "2026-08-03";

const session = (dateKey: string, status = "completada") => ({ dateKey, status });

describe("Llama de la Forja (racha semanal)", () => {
  it("los campamentos nunca rompen la llama: semana completa con días de descanso", () => {
    // Carlos: objetivo 3. Lunes, martes y viernes de la semana 1.
    const sessions = [
      session("2026-08-03"),
      session("2026-08-04"),
      session("2026-08-07")
    ];
    const today = new Date(2026, 7, 10); // lunes de la semana 2
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(weeks[0].met).toBe(true);
    expect(flameStreak(weeks, today, START)).toBe(1);
  });

  it("una sesión adaptada conserva la adherencia", () => {
    const sessions = [
      session("2026-08-03"),
      session("2026-08-04", "adaptada"),
      session("2026-08-07")
    ];
    const today = new Date(2026, 7, 12);
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(weeks[0].met).toBe(true);
  });

  it("una semana cerrada sin objetivo apaga la llama", () => {
    const sessions = [
      // Semana 1 completa (3), semana 2 solo 1, semana 3 completa (3)
      session("2026-08-03"),
      session("2026-08-04"),
      session("2026-08-07"),
      session("2026-08-10"),
      session("2026-08-17"),
      session("2026-08-18"),
      session("2026-08-21")
    ];
    const today = new Date(2026, 7, 24); // semana 4
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(weeks[1].met).toBe(false);
    // Solo cuenta la racha desde la semana 3: la semana 2 rompió.
    expect(flameStreak(weeks, today, START)).toBe(1);
  });

  it("la semana en curso sin completar todavía no rompe la racha", () => {
    const sessions = [
      session("2026-08-03"),
      session("2026-08-04"),
      session("2026-08-07")
      // semana 2 recién empezada, 0 sesiones
    ];
    const today = new Date(2026, 7, 11); // martes de semana 2
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(flameStreak(weeks, today, START)).toBe(1);
  });

  it("las sesiones abandonadas no cuentan para el objetivo", () => {
    const sessions = [
      session("2026-08-03", "abandonada"),
      session("2026-08-04"),
      session("2026-08-07")
    ];
    const today = new Date(2026, 7, 10);
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(weeks[0].met).toBe(false);
  });

  it("dos semanas seguidas al objetivo: racha de 2", () => {
    const sessions = [
      session("2026-08-03"),
      session("2026-08-04"),
      session("2026-08-07"),
      session("2026-08-10"),
      session("2026-08-11"),
      session("2026-08-14")
    ];
    const today = new Date(2026, 7, 17);
    const weeks = summarizeWeeks(sessions, START, 3, today, 6);
    expect(flameStreak(weeks, today, START)).toBe(2);
  });
});
