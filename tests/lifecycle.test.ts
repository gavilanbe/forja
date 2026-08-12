// Ciclo de vida de misión y libro mayor de XP (v3).
// Cubre: completar con una sola serie, doble finalización, abandono y
// reinicio sin cultivar XP, sesión adaptada con registro de omisiones,
// sesión legítimamente completada, corrección de series (editar, deshacer,
// eliminar) con recálculo, y campañas 1 → 2 sin mezclar recompensas.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile } from "../src/db/seed";
import {
  abandonSession,
  completeSession,
  deleteSet,
  logSet,
  reconcileSealedSession,
  startSession,
  undoLastSet,
  updateSet
} from "../src/logic/session";
import { startNewCampaign, getActiveCampaign, getCampaigns, campaignStats } from "../src/logic/campaigns";
import { evaluateIncident } from "../src/logic/incidents";
import { recordDiscomfort } from "../src/logic/session";
import { DAYS } from "../src/data/routine";
import { XP } from "../src/logic/xp";
import type { Profile } from "../src/db/types";

const torsoA = DAYS[0];
const press = torsoA.entries[0]; // 4 series
const remo = torsoA.entries[1]; // 3 series

const MONDAY = new Date(2026, 7, 3); // lunes 3 de agosto de 2026
const TUESDAY = new Date(2026, 7, 4);

const xpOf = async (profileId: string): Promise<number> =>
  (await db.profiles.get(profileId))!.xp;

const ledgerOf = async (profileId: string): Promise<number> => {
  const events = await db.gameEvents.where("profileId").equals(profileId).toArray();
  return events.reduce((a, e) => a + e.xp, 0);
};

/** Registra todas las series prescritas de todos los ejercicios del día. */
const logFullDay = async (session: Awaited<ReturnType<typeof startSession>>) => {
  for (const entry of torsoA.entries) {
    for (let n = 1; n <= entry.sets; n++) {
      await logSet(session, entry, {
        weightKg: 40,
        reps: entry.repMin + 1,
        rir: 2,
        setNumber: n,
        exerciseId: entry.exerciseId
      });
    }
  }
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

describe("estados de sesión al sellar", () => {
  it("terminar con UNA sola serie NO es misión completada: es parcial con recompensa reducida", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    const result = await completeSession(session, profile);
    expect(result.status).toBe("parcial");
    expect(result.session.status).toBe("parcial");
    expect(result.xpGained).toBe(XP.misionParcial);
    expect(result.xpGained).toBeLessThan(XP.misionCompletada);
    expect(await xpOf(profile.id)).toBe(XP.seriePrevista + XP.misionParcial);
  });

  it("todas las series prescritas realizadas → completada con recompensa completa", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logFullDay(session);
    const result = await completeSession(session, profile);
    expect(result.status).toBe("completada");
    const totalSets = torsoA.entries.reduce((a, e) => a + e.sets, 0);
    expect(result.workingSets).toBe(totalSets);
    expect(result.prescribedSets).toBe(totalSets);
    expect(await xpOf(profile.id)).toBe(
      totalSets * XP.seriePrevista + XP.misionCompletada
    );
  });

  it("sesión adaptada: registra qué se omitió y por qué, sin marcar esas series como hechas", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    // Todo el día menos: 1 serie de remo omitida con motivo y un ejercicio
    // detenido por molestia.
    for (const entry of torsoA.entries) {
      const isRemo = entry.exerciseId === remo.exerciseId;
      const isUltimo = entry.exerciseId === torsoA.entries[6].exerciseId;
      const target = isRemo ? entry.sets - 1 : isUltimo ? 1 : entry.sets;
      for (let n = 1; n <= target; n++) {
        await logSet(session, entry, {
          weightKg: 40, reps: entry.repMin + 1, rir: 2, setNumber: n,
          exerciseId: entry.exerciseId
        });
      }
    }
    await logSet(session, remo, {
      weightKg: 0, reps: 0, rir: 0, setNumber: remo.sets,
      exerciseId: remo.exerciseId, skipped: true, skipReason: "Fatiga"
    });
    await recordDiscomfort(session, torsoA.entries[6].exerciseId, 5, "detener");

    const result = await completeSession(session, profile);
    expect(result.status).toBe("adaptada");
    // Las omisiones quedan explícitas.
    expect(result.adaptaciones.some((a) => a.tipo === "serie-omitida" && a.detalle === "Fatiga")).toBe(true);
    expect(result.adaptaciones.some((a) => a.tipo === "ejercicio-detenido")).toBe(true);
    // Las series omitidas no cuentan como hechas.
    const totalSets = torsoA.entries.reduce((a, e) => a + e.sets, 0);
    expect(result.workingSets).toBeLessThan(totalSets);
    expect(result.xpGained).toBe(XP.misionAdaptada);
  });

  it("trabajo real con huecos sin explicar → parcial, nunca completada", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    for (let n = 1; n <= press.sets; n++) {
      await logSet(session, press, {
        weightKg: 60, reps: 8, rir: 2, setNumber: n, exerciseId: press.exerciseId
      });
    }
    const result = await completeSession(session, profile);
    expect(result.status).toBe("parcial");
  });
});

describe("idempotencia de finalización y recompensas", () => {
  it("doble finalización (doble toque / recarga) no duplica nada", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logFullDay(session);
    const r1 = await completeSession(session, profile);
    const xpAfterFirst = await xpOf(profile.id);
    const r2 = await completeSession(session, profile);
    const r3 = await completeSession(session, profile);
    expect(r2.alreadySealed).toBe(true);
    expect(r3.alreadySealed).toBe(true);
    expect(r2.xpGained).toBe(r1.xpGained);
    expect(await xpOf(profile.id)).toBe(xpAfterFirst);
    // El libro mayor y el perfil siempre coinciden.
    expect(await ledgerOf(profile.id)).toBe(xpAfterFirst);
    // Un solo evento de misión para esta sesión.
    const misiones = await db.gameEvents
      .where("[profileId+type]").equals([profile.id, "mision-completada"]).toArray();
    expect(misiones.filter((e) => e.sessionId === session.id)).toHaveLength(1);
  });

  it("abandonar y reiniciar no permite cultivar XP de series", async () => {
    const profile = (await getActiveProfile())!;
    const s1 = await startSession(profile, torsoA.id, MONDAY);
    await logSet(s1, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    const xpAfterSet = await xpOf(profile.id);
    expect(xpAfterSet).toBe(XP.seriePrevista);

    const abandoned = await abandonSession(s1, profile);
    expect(abandoned.status).toBe("abandonada");
    expect(abandoned.xpGained).toBe(0);

    // Reinicio: nueva sesión el mismo día, mismas series.
    const s2 = await startSession(profile, torsoA.id, MONDAY);
    expect(s2.id).not.toBe(s1.id);
    await logSet(s2, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    // La serie 1 de hoy ya puntuó una vez: no vuelve a puntuar.
    expect(await xpOf(profile.id)).toBe(XP.seriePrevista);

    // La serie 2 sí es trabajo nuevo.
    await logSet(s2, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 2, exerciseId: press.exerciseId
    });
    expect(await xpOf(profile.id)).toBe(2 * XP.seriePrevista);
  });

  it("abandonar es idempotente y no concede recompensa de misión", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    const r1 = await abandonSession(session, profile);
    const r2 = await abandonSession(session, profile);
    expect(r1.status).toBe("abandonada");
    expect(r2.alreadySealed).toBe(true);
    const eventos = await db.gameEvents.where("profileId").equals(profile.id).toArray();
    expect(eventos.filter((e) => e.type !== "serie")).toHaveLength(0);
  });

  it("terminar sin ninguna serie es abandono, no misión", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    const result = await completeSession(session, profile);
    expect(result.status).toBe("abandonada");
    expect(result.xpGained).toBe(0);
    expect(await xpOf(profile.id)).toBe(0);
  });
});

describe("corrección de series", () => {
  it("editar peso/reps/RIR persiste y no toca la XP", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    const set = await logSet(session, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    const updated = await updateSet(set.id, { weightKg: 62.5, reps: 9, rir: 1 });
    expect(updated.weightKg).toBe(62.5);
    expect(updated.reps).toBe(9);
    expect(updated.rir).toBe(1);
    const stored = (await db.setLogs.get(set.id))!;
    expect(stored.weightKg).toBe(62.5);
    expect(await xpOf(profile.id)).toBe(XP.seriePrevista);
  });

  it("editar con valores inválidos se rechaza sin tocar la base", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    const set = await logSet(session, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    await expect(updateSet(set.id, { reps: 0 })).rejects.toThrow();
    expect((await db.setLogs.get(set.id))!.reps).toBe(8);
  });

  it("deshacer la última serie retira su XP y permite reregistrarla", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    await logSet(session, press, {
      weightKg: 60, reps: 7, rir: 2, setNumber: 2, exerciseId: press.exerciseId
    });
    expect(await xpOf(profile.id)).toBe(2 * XP.seriePrevista);

    const undone = await undoLastSet(session.id);
    expect(undone?.setNumber).toBe(2);
    expect(await db.setLogs.where("sessionId").equals(session.id).count()).toBe(1);
    expect(await xpOf(profile.id)).toBe(XP.seriePrevista);

    // Reregistrar la serie deshecha vuelve a puntuar exactamente una vez.
    await logSet(session, press, {
      weightKg: 62.5, reps: 8, rir: 2, setNumber: 2, exerciseId: press.exerciseId
    });
    expect(await xpOf(profile.id)).toBe(2 * XP.seriePrevista);
  });

  it("eliminar una serie renumera las siguientes y reconcilia la XP", async () => {
    const profile = (await getActiveProfile())!;
    const session = await startSession(profile, torsoA.id, MONDAY);
    for (let n = 1; n <= 3; n++) {
      await logSet(session, press, {
        weightKg: 60, reps: 8, rir: 2, setNumber: n, exerciseId: press.exerciseId
      });
    }
    expect(await xpOf(profile.id)).toBe(3 * XP.seriePrevista);
    const sets = await db.setLogs.where("sessionId").equals(session.id).sortBy("createdAt");
    await deleteSet(sets[1].id); // borrar la serie 2

    const remaining = await db.setLogs.where("sessionId").equals(session.id).sortBy("createdAt");
    expect(remaining).toHaveLength(2);
    expect(remaining.map((s) => s.setNumber).sort()).toEqual([1, 2]);
    expect(await xpOf(profile.id)).toBe(2 * XP.seriePrevista);
    expect(await ledgerOf(profile.id)).toBe(2 * XP.seriePrevista);
  });

  it("editar una sesión sellada desde el historial recalcula resumen, hitos y XP sin duplicar", async () => {
    const profile = (await getActiveProfile())!;
    // Sesión 1: referencia de cargas.
    const s1 = await startSession(profile, torsoA.id, MONDAY);
    await logFullDay(s1);
    await completeSession(s1, profile);

    // Sesión 2 (jueves): récord en press → hito.
    const jueves = new Date(2026, 7, 6);
    const s2 = await startSession(profile, torsoA.id, jueves);
    for (const entry of torsoA.entries) {
      for (let n = 1; n <= entry.sets; n++) {
        await logSet(s2, entry, {
          weightKg: entry.exerciseId === press.exerciseId ? 45 : 40,
          reps: entry.repMin + 1,
          rir: 2,
          setNumber: n,
          exerciseId: entry.exerciseId
        });
      }
    }
    const r2 = await completeSession(s2, profile);
    expect(r2.hitos.length).toBeGreaterThan(0);
    const xpConHito = await xpOf(profile.id);

    // Corrección desde el historial: el récord era un error de dedo (45 → 40).
    const s2Sets = await db.setLogs
      .where("sessionId").equals(s2.id)
      .and((s) => s.exerciseId === press.exerciseId)
      .toArray();
    for (const s of s2Sets) {
      await updateSet(s.id, { weightKg: 40 });
    }

    const sealed = (await db.sessions.get(s2.id))!;
    expect(sealed.summary?.hitos ?? []).toHaveLength(0);
    // El hito revocado restó exactamente su XP; nada más cambió.
    expect(await xpOf(profile.id)).toBe(xpConHito - r2.hitos.length * XP.hito);
    expect(await ledgerOf(profile.id)).toBe(await xpOf(profile.id));

    // Reconciliar de nuevo es un no-op (idempotente).
    await reconcileSealedSession(s2.id);
    expect(await ledgerOf(profile.id)).toBe(await xpOf(profile.id));
  });
});

describe("campañas independientes (1 → 2)", () => {
  const runWeek = async (profile: Profile, day: Date) => {
    const session = await startSession(profile, torsoA.id, day);
    await logFullDay(session);
    return await completeSession(session, profile);
  };

  it("iniciar campaña nueva archiva la anterior y nunca hay dos activas", async () => {
    const profile = (await getActiveProfile())!;
    const c1 = (await getActiveCampaign(profile.id))!;
    await startNewCampaign(profile, "2026-09-14");
    const campaigns = await getCampaigns(profile.id);
    expect(campaigns).toHaveLength(2);
    expect(campaigns.filter((c) => c.status === "activa")).toHaveLength(1);
    const archived = campaigns.find((c) => c.id === c1.id)!;
    expect(archived.status).toBe("archivada");
    expect(archived.endedAt).toBeDefined();
    // El espejo del perfil apunta a la nueva.
    expect((await db.profiles.get(profile.id))!.campaignStart).toBe("2026-09-14");
  });

  it("el bono de capítulo se reinicia en la campaña 2 sin duplicarse dentro de cada una", async () => {
    const profile = (await getActiveProfile())!;
    await db.profiles.put({ ...profile, weeklyTarget: 1 });
    let p = (await db.profiles.get(profile.id))!;

    // Campaña 1, semana 1: objetivo cumplido → bono.
    const r1 = await runWeek(p, MONDAY);
    expect(r1.weekMet).toBe(true);
    const capitulos1 = await db.gameEvents
      .where("[profileId+type]").equals([p.id, "capitulo-completado"]).count();
    expect(capitulos1).toBe(1);

    // Segunda misión en la misma semana: sin segundo bono.
    const s2 = await startSession(p, torsoA.id, TUESDAY);
    await logFullDay(s2);
    await completeSession(s2, p);
    expect(
      await db.gameEvents.where("[profileId+type]").equals([p.id, "capitulo-completado"]).count()
    ).toBe(1);

    // Campaña 2: misma semana-número, bono propio (identidad por campaña).
    await startNewCampaign(p, "2026-09-14");
    p = (await db.profiles.get(p.id))!;
    const sept = new Date(2026, 8, 14);
    const r3 = await runWeek(p, sept);
    expect(r3.weekMet).toBe(true);
    expect(
      await db.gameEvents.where("[profileId+type]").equals([p.id, "capitulo-completado"]).count()
    ).toBe(2);
  });

  it("las estadísticas de campañas no se mezclan y las pasadas se pueden consultar", async () => {
    const profile = (await getActiveProfile())!;
    await db.profiles.put({ ...profile, weeklyTarget: 1 });
    let p = (await db.profiles.get(profile.id))!;

    await runWeek(p, MONDAY);
    await startNewCampaign(p, "2026-09-14");
    p = (await db.profiles.get(p.id))!;
    await runWeek(p, new Date(2026, 8, 14));
    await runWeek(p, new Date(2026, 8, 15));

    const [c1, c2] = await getCampaigns(p.id);
    const stats1 = await campaignStats(c1, new Date(2026, 9, 30));
    const stats2 = await campaignStats(c2, new Date(2026, 9, 30));
    expect(stats1.completed).toBe(1);
    expect(stats2.completed).toBe(2);
    // Todo el historial de la campaña 1 sigue ahí.
    expect(stats1.sessions.length).toBe(1);
    expect(stats1.totalSets).toBeGreaterThan(0);
    // Y las sesiones de la 2 no aparecen en la 1.
    const ids1 = new Set(stats1.sessions.map((s) => s.id));
    expect(stats2.sessions.every((s) => !ids1.has(s.id))).toBe(true);
  });
});

describe("incidencias de molestia", () => {
  it("activa sin sesiones limpias; seguimiento con 1; resuelta con 2", async () => {
    const profile = (await getActiveProfile())!;
    const s1 = await startSession(profile, torsoA.id, MONDAY);
    await logSet(s1, press, {
      weightKg: 60, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    await recordDiscomfort(s1, press.exerciseId, 4, "adaptar");
    await completeSession(s1, profile);

    let state = await evaluateIncident(profile.id, press.exerciseId);
    expect(state.status).toBe("activa");

    // Sesión limpia 1.
    const s2 = await startSession(profile, torsoA.id, new Date(2026, 7, 6));
    await logSet(s2, press, {
      weightKg: 55, reps: 8, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    await completeSession(s2, profile);
    state = await evaluateIncident(profile.id, press.exerciseId);
    expect(state.status).toBe("seguimiento");

    // Sesión limpia 2 → resuelta: la molestia del pasado ya no bloquea.
    const s3 = await startSession(profile, torsoA.id, new Date(2026, 7, 10));
    await logSet(s3, press, {
      weightKg: 55, reps: 9, rir: 2, setNumber: 1, exerciseId: press.exerciseId
    });
    await completeSession(s3, profile);
    state = await evaluateIncident(profile.id, press.exerciseId);
    expect(state.status).toBe("resuelta");
    expect(state.cleanSessionsSince).toBe(2);
  });
});
