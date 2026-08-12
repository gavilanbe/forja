// Incorporación a mitad de semana: el objetivo semanal se prorratea desde la
// fecha real de entrada (joinedKey) y NADA anterior cuenta como fallado.
// Casos exigidos: primera instalación en miércoles, sábado y domingo.
import { describe, expect, it } from "vitest";
import { flameStreak, summarizeWeeks } from "../src/logic/streak";
import { SCHEDULES } from "../src/data/routine";

const START = "2026-08-10"; // lunes de la semana 1
const nahuelWeek = SCHEDULES[0].week; // L M · J V S ·  (5 días)
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

describe("incorporación a mitad de semana", () => {
  it("instalación en miércoles: el objetivo de la semana 1 baja a los días restantes", () => {
    // Se une el miércoles 12: quedan jueves, viernes y sábado programados.
    const weeks = summarizeWeeks([], START, 5, d(2026, 8, 12), 6, {
      joinedKey: "2026-08-12",
      scheduleWeek: nahuelWeek
    });
    expect(weeks[0].target).toBe(3);
    // Cumpliendo esos 3, la semana se considera lograda.
    const met = summarizeWeeks(
      [
        { dateKey: "2026-08-13", status: "completada" },
        { dateKey: "2026-08-14", status: "completada" },
        { dateKey: "2026-08-15", status: "completada" }
      ],
      START,
      5,
      d(2026, 8, 16),
      6,
      { joinedKey: "2026-08-12", scheduleWeek: nahuelWeek }
    );
    expect(met[0].met).toBe(true);
  });

  it("instalación en sábado: solo queda 1 día programado y basta con él", () => {
    const weeks = summarizeWeeks(
      [{ dateKey: "2026-08-15", status: "completada" }],
      START,
      5,
      d(2026, 8, 15),
      6,
      { joinedKey: "2026-08-15", scheduleWeek: nahuelWeek }
    );
    expect(weeks[0].target).toBe(1);
    expect(weeks[0].met).toBe(true);
  });

  it("instalación en domingo: semana 1 sin objetivo exigible y sin romper la llama", () => {
    const weeks = summarizeWeeks([], START, 5, d(2026, 8, 16), 6, {
      joinedKey: "2026-08-16",
      scheduleWeek: nahuelWeek
    });
    expect(weeks[0].target).toBe(0);
    expect(weeks[0].met).toBe(false);

    // La semana 2 completa no arrastra el "fallo" de la semana 0-exigible.
    const later = summarizeWeeks(
      [
        { dateKey: "2026-08-17", status: "completada" },
        { dateKey: "2026-08-18", status: "completada" },
        { dateKey: "2026-08-20", status: "completada" },
        { dateKey: "2026-08-21", status: "completada" },
        { dateKey: "2026-08-22", status: "completada" }
      ],
      START,
      5,
      d(2026, 8, 23),
      6,
      { joinedKey: "2026-08-16", scheduleWeek: nahuelWeek }
    );
    expect(later[1].met).toBe(true);
    expect(flameStreak(later, d(2026, 8, 23), START)).toBe(1);
  });

  it("semanas completas previas a la incorporación nunca son exigibles", () => {
    const weeks = summarizeWeeks([], START, 5, d(2026, 8, 25), 6, {
      joinedKey: "2026-08-17", // se unió en la semana 2
      scheduleWeek: nahuelWeek
    });
    expect(weeks[0].target).toBe(0); // la semana 1 no cuenta como fallada
    expect(flameStreak(weeks, d(2026, 8, 25), START)).toBe(0); // y no rompe nada
  });
});
