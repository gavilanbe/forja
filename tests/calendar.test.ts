// Calendario semanal: mover misiones, ausencias, descarga, posponer y
// restaurar. Reprogramar no duplica misiones ni XP; el objetivo efectivo
// refleja la semana real.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile } from "../src/db/seed";
import {
  addOverride,
  effectiveWeekFor,
  resetWeek,
  setDeloadWeek
} from "../src/logic/calendar";
import { dateKeyOf, mondayOf } from "../src/logic/dates";

const MONDAY = new Date(2026, 7, 3);
const weekKey = dateKeyOf(mondayOf(MONDAY));

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

describe("excepciones de calendario", () => {
  it("mover una misión la quita del día original sin duplicarla", async () => {
    const profile = (await getActiveProfile())!;
    // Nahuel: lunes = torso-a, miércoles = descanso. Mover lunes → miércoles.
    await addOverride(profile, weekKey, "mover", { fromWeekday: 0, toWeekday: 2 });
    const week = await effectiveWeekFor(profile, MONDAY);
    expect(week.days[0].dayId).toBeNull();
    expect(week.days[2].dayId).toBe("torso-a");
    expect(week.days[2].movedFrom).toBe(0);
    // Sigue habiendo exactamente 5 días programados (nada duplicado).
    expect(week.days.filter((d) => d.dayId).length).toBe(5);
    expect(week.effectiveTarget).toBe(5);
  });

  it("una ausencia descuenta el día del objetivo efectivo", async () => {
    const profile = (await getActiveProfile())!;
    await addOverride(profile, weekKey, "ausencia", {
      weekdays: [4, 5],
      reason: "Viaje"
    });
    const week = await effectiveWeekFor(profile, MONDAY);
    expect(week.days[4].absent).toBe(true);
    expect(week.effectiveTarget).toBe(3); // 5 programados − 2 ausencias
  });

  it("la descarga marca la semana con su factor de volumen real", async () => {
    const profile = (await getActiveProfile())!;
    await setDeloadWeek(profile, weekKey, 0.5);
    const week = await effectiveWeekFor(profile, MONDAY);
    expect(week.deload).toBe(true);
    expect(week.deloadFactor).toBe(0.5);
    // Marcarla dos veces no duplica la excepción.
    await setDeloadWeek(profile, weekKey, 0.6);
    const overrides = await db.calendarOverrides
      .where("[profileId+weekStartKey]")
      .equals([profile.id, weekKey])
      .toArray();
    expect(overrides.filter((o) => o.type === "descarga")).toHaveLength(1);
    expect((await effectiveWeekFor(profile, MONDAY)).deloadFactor).toBe(0.6);
  });

  it("posponer la semana deja el objetivo a cero sin romper nada", async () => {
    const profile = (await getActiveProfile())!;
    await addOverride(profile, weekKey, "posponer", {});
    const week = await effectiveWeekFor(profile, MONDAY);
    expect(week.postponed).toBe(true);
    expect(week.effectiveTarget).toBe(0);
  });

  it("volver al calendario original elimina todas las excepciones de la semana", async () => {
    const profile = (await getActiveProfile())!;
    await addOverride(profile, weekKey, "mover", { fromWeekday: 0, toWeekday: 2 });
    await setDeloadWeek(profile, weekKey);
    await resetWeek(profile.id, weekKey);
    const week = await effectiveWeekFor(profile, MONDAY);
    expect(week.days[0].dayId).toBe("torso-a");
    expect(week.deload).toBe(false);
    expect(week.effectiveTarget).toBe(5);
  });
});
