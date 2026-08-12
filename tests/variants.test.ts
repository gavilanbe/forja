// Variantes estructuradas: identificadores estables, migración de textos
// legados, historial independiente por variante e hitos no mezclados.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { ensureSeed, getActiveProfile } from "../src/db/seed";
import { completeSession, logSet, startSession } from "../src/logic/session";
import {
  VARIANTS,
  isAdvice,
  variantById,
  variantIdFromLegacyText,
  variantsOf
} from "../src/data/variants";
import { DAYS } from "../src/data/routine";

const torsoA = DAYS[0];
const press = torsoA.entries[0];
const MONDAY = new Date(2026, 7, 3);

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeed(MONDAY);
});

describe("registro de variantes", () => {
  it("cada variante tiene id estable, padre, tipo de carga y unidad", () => {
    expect(VARIANTS.length).toBeGreaterThan(30);
    for (const v of VARIANTS) {
      expect(v.id).toMatch(/^[a-z0-9-]+--[a-z0-9-]+$/);
      expect(v.parentExerciseId).toBeTruthy();
      expect(["externa", "corporal", "asistencia"]).toContain(v.loadType);
      expect(v.unit).toBe("kg");
    }
  });

  it("los consejos del manual no se convierten en variantes", () => {
    expect(isAdvice("Si molesta: sube algo los pies")).toBe(true);
    expect(
      variantsOf("hack-squat").some((v) => v.nombre.startsWith("Si molesta"))
    ).toBe(false);
  });

  it("la dominada asistida es carga de asistencia, no externa", () => {
    const dominada = variantsOf("jalon-neutro").find((v) =>
      v.nombre.includes("Dominada asistida")
    );
    expect(dominada?.loadType).toBe("asistencia");
  });

  it("migra el texto legado de alternativa a su variantId", () => {
    const id = variantIdFromLegacyText(
      "press-inclinado-maquina",
      "Press inclinado con mancuernas"
    );
    expect(id).toBeTruthy();
    expect(variantById(id!)?.parentExerciseId).toBe("press-inclinado-maquina");
    expect(variantIdFromLegacyText("press-inclinado-maquina", "algo inventado")).toBeUndefined();
  });
});

describe("historial independiente por variante", () => {
  it("un récord con una variante no genera hito frente al historial de otra máquina", async () => {
    const profile = (await getActiveProfile())!;
    const smith = variantsOf(press.exerciseId)[0];

    // Sesión 1: ejercicio principal a 60 kg. Completa para que haya sello.
    const s1 = await startSession(profile, torsoA.id, MONDAY);
    for (const entry of torsoA.entries) {
      for (let n = 1; n <= entry.sets; n++) {
        await logSet(s1, entry, {
          weightKg: entry.exerciseId === press.exerciseId ? 60 : 40,
          reps: entry.repMin + 1, rir: 2, setNumber: n, exerciseId: entry.exerciseId
        });
      }
    }
    await completeSession(s1, profile);

    // Sesión 2: press con VARIANTE a 40 kg (menos peso que el principal).
    const jueves = new Date(2026, 7, 6);
    const s2 = await startSession(profile, torsoA.id, jueves);
    for (const entry of torsoA.entries) {
      for (let n = 1; n <= entry.sets; n++) {
        await logSet(s2, entry, {
          weightKg: 40,
          reps: entry.repMin + 1, rir: 2, setNumber: n,
          exerciseId: entry.exerciseId,
          variantId: entry.exerciseId === press.exerciseId ? smith.id : undefined
        });
      }
    }
    const r2 = await completeSession(s2, profile);
    // 40 kg con la variante NO es récord frente a los 60 kg del principal:
    // historiales no comparables no se mezclan. Tampoco es hito "primera vez"
    // porque sin historial previo de esa variante no hay comparación.
    expect(r2.hitos.some((h) => h.includes("Smith"))).toBe(false);

    // Sesión 3: la misma variante sube a 45 kg → ahora SÍ es hito de SU historial.
    const lunes2 = new Date(2026, 7, 10);
    const s3 = await startSession(profile, torsoA.id, lunes2);
    for (const entry of torsoA.entries) {
      for (let n = 1; n <= entry.sets; n++) {
        await logSet(s3, entry, {
          weightKg: entry.exerciseId === press.exerciseId ? 45 : 40,
          reps: entry.repMin + 1, rir: 2, setNumber: n,
          exerciseId: entry.exerciseId,
          variantId: entry.exerciseId === press.exerciseId ? smith.id : undefined
        });
      }
    }
    const r3 = await completeSession(s3, profile);
    const hitoVariante = r3.hitos.find((h) => h.includes(smith.nombre));
    expect(hitoVariante).toBeTruthy();
    expect(hitoVariante).toContain("45");
  });

  it("la serie guarda el variantId utilizado y conserva el texto legado", async () => {
    const profile = (await getActiveProfile())!;
    const smith = variantsOf(press.exerciseId)[0];
    const session = await startSession(profile, torsoA.id, MONDAY);
    await logSet(session, press, {
      weightKg: 40, reps: 8, rir: 2, setNumber: 1,
      exerciseId: press.exerciseId,
      variantId: smith.id,
      altExerciseId: smith.nombre,
      source: "alternativa"
    });
    const stored = (await db.setLogs.toArray())[0];
    expect(stored.variantId).toBe(smith.id);
    expect(stored.altExerciseId).toBe(smith.nombre);
  });
});
