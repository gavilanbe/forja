import { describe, expect, it } from "vitest";
import {
  campaignWeekOf,
  dateKeyOf,
  mondayOf,
  parseDateKey,
  weekdayIndex
} from "../src/logic/dates";

describe("fechas locales con semana de lunes", () => {
  it("weekdayIndex: lunes=0 … domingo=6", () => {
    expect(weekdayIndex(new Date(2026, 7, 3))).toBe(0); // lunes
    expect(weekdayIndex(new Date(2026, 7, 9))).toBe(6); // domingo
  });

  it("mondayOf devuelve el lunes de la semana", () => {
    expect(dateKeyOf(mondayOf(new Date(2026, 7, 9)))).toBe("2026-08-03");
    expect(dateKeyOf(mondayOf(new Date(2026, 7, 3)))).toBe("2026-08-03");
  });

  it("campaignWeekOf: 1-based desde el lunes de inicio", () => {
    expect(campaignWeekOf("2026-08-03", new Date(2026, 7, 3))).toBe(1);
    expect(campaignWeekOf("2026-08-03", new Date(2026, 7, 9))).toBe(1);
    expect(campaignWeekOf("2026-08-03", new Date(2026, 7, 10))).toBe(2);
    expect(campaignWeekOf("2026-08-03", new Date(2026, 8, 13))).toBe(6);
  });

  it("dateKey ida y vuelta", () => {
    const d = parseDateKey("2026-08-07");
    expect(d.getDate()).toBe(7);
    expect(dateKeyOf(d)).toBe("2026-08-07");
  });
});
