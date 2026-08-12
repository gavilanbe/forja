// Cosméticos: desbloqueo por progreso legítimo, idempotente, y sin ninguna
// influencia sobre el entrenamiento. MI GIMNASIO: ajustes por perfil.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile, PROFILE_CARLOS } from "../src/db/seed";
import { completeSession, logSet, startSession } from "../src/logic/session";
import { cosmeticProgress, meetsRule, syncUnlocks, COSMETICS } from "../src/logic/cosmetics";
import { effectiveGymSetting, effectiveIncrement, saveGymSetting } from "../src/logic/gym";
import { DAYS } from "../src/data/routine";

const torsoA = DAYS[0];
const MONDAY = new Date(2026, 7, 3);

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

const completeFullDay = async (day: Date) => {
  const profile = (await getActiveProfile())!;
  const session = await startSession(profile, torsoA.id, day);
  for (const entry of torsoA.entries) {
    for (let n = 1; n <= entry.sets; n++) {
      await logSet(session, entry, {
        weightKg: 40, reps: entry.repMin + 1, rir: 2, setNumber: n,
        exerciseId: entry.exerciseId
      });
    }
  }
  return await completeSession(session, profile);
};

describe("cosméticos", () => {
  it("el desbloqueo es idempotente: sincronizar mil veces no duplica", async () => {
    await completeFullDay(MONDAY);
    let profile = (await getActiveProfile())!;
    const first = await syncUnlocks(profile);
    const countAfterFirst = await db.unlocks.count();
    await Promise.all([syncUnlocks(profile), syncUnlocks(profile)]);
    await syncUnlocks(profile);
    expect(await db.unlocks.count()).toBe(countAfterFirst);
    void first;
  });

  it("las reglas jamás premian volumen extra ni dolor: solo misiones, capítulos, hitos, campañas y nivel", () => {
    for (const item of COSMETICS) {
      if (!item.rule) continue;
      expect(["misiones", "capitulos", "hitos", "campanas", "nivel"]).toContain(
        item.rule.kind
      );
    }
  });

  it("el progreso se deriva del libro mayor (misiones del plan, no series sueltas)", async () => {
    const profile0 = (await getActiveProfile())!;
    const before = await cosmeticProgress(profile0);
    expect(before.misiones).toBe(0);
    await completeFullDay(MONDAY);
    const profile = (await getActiveProfile())!;
    const after = await cosmeticProgress(profile);
    expect(after.misiones).toBe(1);
    expect(meetsRule({ kind: "misiones", count: 1 }, after)).toBe(true);
    expect(meetsRule({ kind: "misiones", count: 5 }, after)).toBe(false);
  });
});

describe("MI GIMNASIO", () => {
  it("cada perfil guarda su propio equipamiento y su incremento manda", async () => {
    const nahuel = (await getActiveProfile())!;
    await saveGymSetting(nahuel.id, "press-inclinado-maquina", undefined, {
      machineName: "Panatta azul",
      seatPosition: "4",
      minIncrementKg: 2
    });
    await saveGymSetting(PROFILE_CARLOS, "press-inclinado-maquina", undefined, {
      machineName: "Technogym",
      seatPosition: "6"
    });

    const deNahuel = await effectiveGymSetting(nahuel.id, "press-inclinado-maquina");
    const deCarlos = await effectiveGymSetting(PROFILE_CARLOS, "press-inclinado-maquina");
    expect(deNahuel?.machineName).toBe("Panatta azul");
    expect(deCarlos?.machineName).toBe("Technogym");
    expect(effectiveIncrement(deNahuel ?? undefined, 2.5)).toBe(2);
    expect(effectiveIncrement(deCarlos ?? undefined, 2.5)).toBe(2.5);
  });

  it("el ajuste de una variante cae al del ejercicio principal si no existe", async () => {
    const nahuel = (await getActiveProfile())!;
    await saveGymSetting(nahuel.id, "press-inclinado-maquina", undefined, {
      setupNotes: "agarre ancho"
    });
    const eff = await effectiveGymSetting(
      nahuel.id,
      "press-inclinado-maquina",
      "press-inclinado-maquina--press-inclinado-con-mancuernas"
    );
    expect(eff?.setupNotes).toBe("agarre ancho");
  });

  it("guardar dos veces actualiza el mismo registro (id determinista)", async () => {
    const nahuel = (await getActiveProfile())!;
    await saveGymSetting(nahuel.id, "hack-squat", undefined, { seatPosition: "2" });
    await saveGymSetting(nahuel.id, "hack-squat", undefined, { seatPosition: "3" });
    const all = await db.gymSettings
      .where("[profileId+exerciseId]")
      .equals([nahuel.id, "hack-squat"])
      .toArray();
    expect(all).toHaveLength(1);
    expect(all[0].seatPosition).toBe("3");
  });
});
