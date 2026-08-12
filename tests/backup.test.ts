// Copias de seguridad: validación profunda (esquema, relaciones, rangos),
// compatibilidad por versión (migración de copias v2), y garantía de que una
// importación inválida jamás toca los datos existentes.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile } from "../src/db/seed";
import { logSet, startSession } from "../src/logic/session";
import { exportBackup, importBackup, validateBackup } from "../src/logic/backup";
import { DAYS } from "../src/data/routine";

const MONDAY = new Date(2026, 7, 3);
const press = DAYS[0].entries[0];

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

const seedOneSet = async () => {
  const profile = (await getActiveProfile())!;
  const session = await startSession(profile, DAYS[0].id, MONDAY);
  await logSet(session, press, {
    weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
  });
};

describe("validación de copias", () => {
  it("exporta e importa una copia v3 completa", async () => {
    await seedOneSet();
    const backup = await exportBackup();
    const v = validateBackup(backup);
    expect(v.ok).toBe(true);
    expect(v.counts?.setLogs).toBe(1);
    expect(v.counts?.campaigns).toBe(2);

    await db.setLogs.clear();
    await importBackup(backup);
    expect(await db.setLogs.count()).toBe(1);
    expect(await db.campaigns.count()).toBe(2);
  });

  it("rechaza archivos que no son copias de FORJA", () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup({}).ok).toBe(false);
    expect(validateBackup({ app: "otra" }).ok).toBe(false);
    expect(
      validateBackup({ app: "forja", schemaVersion: 999, tables: { profiles: [{}] } }).ok
    ).toBe(false);
  });

  it("detecta registros corruptos con rangos imposibles y NO importa nada", async () => {
    await seedOneSet();
    const backup = await exportBackup();
    const setsAntes = await db.setLogs.count();

    // Corromper: RIR imposible y peso negativo.
    const corrupt = JSON.parse(JSON.stringify(backup));
    corrupt.tables.setLogs[0].rir = 99;
    corrupt.tables.setLogs[0].weightKg = -5;
    const v = validateBackup(corrupt);
    expect(v.ok).toBe(false);
    expect(v.error).toContain("intactos");

    await expect(importBackup(corrupt)).rejects.toThrow();
    // La base sigue exactamente igual.
    expect(await db.setLogs.count()).toBe(setsAntes);
  });

  it("detecta relaciones rotas (series de sesiones inexistentes)", async () => {
    await seedOneSet();
    const backup = await exportBackup();
    const broken = JSON.parse(JSON.stringify(backup));
    broken.tables.setLogs[0].sessionId = "sesion-fantasma";
    const v = validateBackup(broken);
    expect(v.ok).toBe(false);
    expect(v.issues?.some((i) => i.table === "setLogs")).toBe(true);
  });

  it("acepta y migra una copia antigua (esquema v2, sin campañas ni dedupeKey)", async () => {
    await seedOneSet();
    const backup = await exportBackup();
    // Simular una copia v2: sin tablas nuevas, eventos sin dedupeKey,
    // series sin campaignId ni variantId.
    const legacy = JSON.parse(JSON.stringify(backup));
    legacy.schemaVersion = 2;
    delete legacy.tables.campaigns;
    delete legacy.tables.gymSettings;
    delete legacy.tables.customRoutines;
    delete legacy.tables.calendarOverrides;
    delete legacy.tables.codexPrefs;
    delete legacy.tables.unlocks;
    for (const e of legacy.tables.gameEvents) delete e.dedupeKey;
    for (const s of legacy.tables.setLogs) {
      delete s.campaignId;
      delete s.variantId;
    }
    for (const s of legacy.tables.sessions) delete s.campaignId;

    const v = validateBackup(legacy);
    expect(v.ok).toBe(true);
    expect(v.legacy).toBe(true);

    await importBackup(legacy);
    // La migración reconstruye campañas y claves de deduplicación.
    expect(await db.campaigns.count()).toBeGreaterThan(0);
    const events = await db.gameEvents.toArray();
    expect(events.every((e) => e.dedupeKey)).toBe(true);
    const sessions = await db.sessions.toArray();
    expect(sessions.every((s) => s.campaignId)).toBe(true);
  });

  it("una copia parcialmente incompatible (tabla corrupta) se rechaza entera", async () => {
    await seedOneSet();
    const backup = await exportBackup();
    const bad = JSON.parse(JSON.stringify(backup));
    bad.tables.sessions = "no-es-un-array";
    const v = validateBackup(bad);
    expect(v.ok).toBe(false);
    await expect(importBackup(bad)).rejects.toThrow();
    expect(await db.profiles.count()).toBe(2);
  });
});
