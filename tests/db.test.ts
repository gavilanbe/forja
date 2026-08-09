// Pruebas de la base local: siembra, misiones, XP honesta, bono de capítulo,
// hitos, persistencia tras reapertura y copia de seguridad.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile, PROFILE_CARLOS, PROFILE_NAHUEL } from "../src/db/seed";
import {
  completeSession,
  loadTimer,
  logSet,
  saveTimer,
  startSession
} from "../src/logic/session";
import { DAYS } from "../src/data/routine";
import { exportBackup, importBackup, validateBackup } from "../src/logic/backup";
import type { TimerState } from "../src/db/types";

const torsoA = DAYS[0];
const press = torsoA.entries[0];

const MONDAY = new Date(2026, 7, 3); // lunes 3 de agosto de 2026

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

describe("siembra", () => {
  it("crea los dos perfiles con sus horarios correctos", async () => {
    const nahuel = await db.profiles.get(PROFILE_NAHUEL);
    const carlos = await db.profiles.get(PROFILE_CARLOS);
    expect(nahuel?.weeklyTarget).toBe(5);
    expect(nahuel?.scheduleId).toBe("nahuel-5");
    expect(carlos?.weeklyTarget).toBe(3);
    expect(carlos?.scheduleId).toBe("carlos-3");
    expect(nahuel?.campaignStart).toBe("2026-08-03");
  });

  it("es idempotente, incluso con llamadas concurrentes", async () => {
    await ensureSeed(MONDAY);
    await Promise.all([ensureSeed(MONDAY), ensureSeed(MONDAY)]);
    expect(await db.profiles.count()).toBe(2);
  });

  it("instalación a final de semana: la campaña arranca el lunes siguiente", async () => {
    await db.delete();
    await db.open();
    const sunday = new Date(2026, 7, 9);
    await ensureSeed(sunday);
    const nahuel = await db.profiles.get(PROFILE_NAHUEL);
    expect(nahuel?.campaignStart).toBe("2026-08-10");
  });
});

describe("misión local-first", () => {
  it("guardar una serie prescrita concede XP y persiste", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const sets = await db.setLogs.where("sessionId").equals(session.id).toArray();
    expect(sets).toHaveLength(1);
    expect(sets[0].weightKg).toBe(60);
    const fresh = (await db.profiles.get(profile.id))!;
    expect(fresh.xp).toBe(10);
  });

  it("las series extra por encima de lo prescrito no dan XP", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    for (let n = 1; n <= press.sets + 2; n++) {
      await logSet(session, press, {
        weightKg: 60,
        reps: 8,
        rir: 2,
        setNumber: n,
        exerciseId: press.exerciseId
      });
    }
    const fresh = (await db.profiles.get(profile.id))!;
    expect(fresh.xp).toBe(press.sets * 10);
  });

  it("entrenar fuera de horario (unscheduled) no da XP", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY, true);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const result = await completeSession(session, profile, false);
    expect(result.xpGained).toBe(0);
    const fresh = (await db.profiles.get(profile.id))!;
    expect(fresh.xp).toBe(0);
  });

  it("una serie inválida se rechaza sin tocar la base", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await expect(
      logSet(session, press, {
        weightKg: 60,
        reps: 0,
        rir: 2,
        setNumber: 1,
        exerciseId: press.exerciseId
      })
    ).rejects.toThrow();
    expect(await db.setLogs.count()).toBe(0);
  });

  it("recupera la sesión activa en vez de duplicarla", async () => {
    const profile = (await getActiveProfile())!;
    const a = await startSession(profile, torsoA.id, MONDAY);
    const b = await startSession(profile, torsoA.id, MONDAY);
    expect(b.id).toBe(a.id);
    expect(await db.sessions.count()).toBe(1);
  });
});

describe("completar misión", () => {
  it("sella la sesión con resumen y XP de misión", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const result = await completeSession(session, profile, false);
    expect(result.session.status).toBe("completada");
    expect(result.workingSets).toBe(1);
    expect(result.xpGained).toBe(60); // misión, sin hitos ni capítulo
    expect(result.session.summary?.avgRir).toBe(2);
  });

  it("una sesión adaptada conserva estado y XP de misión", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const result = await completeSession(session, profile, true);
    expect(result.session.status).toBe("adaptada");
    expect(result.xpGained).toBe(60);
  });

  it("detecta hitos y progresión frente a la sesión anterior", async () => {
    const profile = (await getActiveProfile())!;
    const s1 = await startSession(profile, torsoA.id, MONDAY);
    await logSet(s1, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    await completeSession(s1, profile, false);

    const jueves = new Date(2026, 7, 6);
    const s2 = await startSession(profile, torsoA.id, jueves);
    await logSet(s2, press, {
      weightKg: 62.5,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const result = await completeSession(s2, profile, false);
    expect(result.exercisesProgressed).toBe(1);
    expect(result.hitos).toHaveLength(1);
    expect(result.hitos[0]).toContain("62.5 kg");
    expect(result.xpGained).toBe(60 + 25);
  });

  it("el bono de capítulo se concede una sola vez por semana", async () => {
    const profile = (await getActiveProfile())!;
    await db.profiles.put({ ...profile, weeklyTarget: 1 });
    const p = (await db.profiles.get(profile.id))!;

    const s1 = await startSession(p, torsoA.id, MONDAY);
    await logSet(s1, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const r1 = await completeSession(s1, p, false);
    expect(r1.weekMet).toBe(true);
    expect(r1.xpGained).toBe(60 + 150);

    const martes = new Date(2026, 7, 4);
    const s2 = await startSession(p, "pierna-a", martes);
    await logSet(s2, DAYS[1].entries[0], {
      weightKg: 100,
      reps: 10,
      rir: 2,
      setNumber: 1,
      exerciseId: DAYS[1].entries[0].exerciseId
    });
    const r2 = await completeSession(s2, p, false);
    expect(r2.xpGained).toBe(60); // sin segundo bono de capítulo
  });
});

describe("persistencia y temporizador", () => {
  it("el temporizador persiste y se recupera tras reabrir la base", async () => {
    const t: TimerState = {
      sessionId: "s1",
      exerciseId: press.exerciseId,
      exerciseIndex: 0,
      nextSetNumber: 2,
      totalSec: 180,
      targetEndAt: Date.now() + 180_000,
      pausedRemainingMs: null
    };
    await saveTimer(t);
    db.close();
    await db.open();
    const loaded = await loadTimer();
    expect(loaded?.targetEndAt).toBe(t.targetEndAt);
  });

  it("los datos sobreviven a cerrar y reabrir la base", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    db.close();
    await db.open();
    expect(await db.setLogs.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
  });
});

describe("copia de seguridad", () => {
  it("exporta, valida e importa una copia completa", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60,
      reps: 8,
      rir: 2,
      setNumber: 1,
      exerciseId: press.exerciseId
    });
    const backup = await exportBackup();
    const validation = validateBackup(backup);
    expect(validation.ok).toBe(true);
    expect(validation.counts?.setLogs).toBe(1);

    await db.setLogs.clear();
    expect(await db.setLogs.count()).toBe(0);
    await importBackup(backup);
    expect(await db.setLogs.count()).toBe(1);
    expect(await db.profiles.count()).toBe(2);
  });

  it("rechaza archivos que no son copias de FORJA", () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup({}).ok).toBe(false);
    expect(validateBackup({ app: "otra" }).ok).toBe(false);
    expect(
      validateBackup({ app: "forja", schemaVersion: 999, tables: { profiles: [{}] } }).ok
    ).toBe(false);
  });
});
