// Motor de sugerencias conservador (doble progresión, ver manual §2).
// Nunca modifica la prescripción: solo sugiere y el usuario decide.

import type { ExercisePrescription } from "../data/types";
import type { SetLog } from "../db/types";

export type SuggestionKind = "subir" | "mantener" | "bajar" | "sin-datos" | "molestia";

export interface Suggestion {
  kind: SuggestionKind;
  /** Peso sugerido para la primera serie, si procede */
  weightKg?: number;
  motivo: string;
}

export interface ProgressionInput {
  prescription: ExercisePrescription;
  /** Series de trabajo de la última sesión donde se hizo este ejercicio (mismo día de rutina). */
  lastSets: SetLog[];
  /** Hubo molestia significativa (nivel >= 3) asociada al ejercicio la última vez. */
  hadDiscomfort: boolean;
  /** Incremento configurable en kg. */
  incrementKg: number;
}

const isCompound = (p: ExercisePrescription) => p.restMinSec >= 150;

export const defaultIncrement = (
  p: ExercisePrescription,
  compoundKg: number,
  isolationKg: number
): number => (isCompound(p) ? compoundKg : isolationKg);

export const suggest = ({
  prescription,
  lastSets,
  hadDiscomfort,
  incrementKg
}: ProgressionInput): Suggestion => {
  if (hadDiscomfort) {
    return {
      kind: "molestia",
      motivo:
        "La última vez registraste molestia en este ejercicio. Sin sugerencia de subida: prioriza técnica y rango tolerable."
    };
  }
  const done = lastSets.filter((s) => !s.skipped && s.reps > 0);
  if (done.length === 0) {
    return {
      kind: "sin-datos",
      motivo:
        "Sin registro previo. Elige una carga que permita la parte media del rango con RIR 2 real y técnica estable."
    };
  }

  const { repMax, repMin, rirPerSet, sets } = prescription;
  const lastWeight = done[done.length - 1].weightKg;

  // ¿Todas las series prescritas al máximo del rango con el RIR objetivo (o más margen)?
  const allTop =
    done.length >= sets &&
    done.every((s, i) => {
      const target = rirPerSet[Math.min(i, rirPerSet.length - 1)].rir;
      return s.reps >= repMax && s.rir >= target.min;
    });
  if (allTop) {
    return {
      kind: "subir",
      weightKg: round25(lastWeight + incrementKg),
      motivo: `Todas las series llegaron a ${repMax} repeticiones con el RIR previsto. Sube ${incrementKg} kg y vuelve a la parte baja del rango.`
    };
  }

  const anyBelowMin = done.some((s) => s.reps < repMin);
  if (anyBelowMin) {
    return {
      kind: "bajar",
      weightKg: round25(Math.max(0, lastWeight * 0.95)),
      motivo: `Alguna serie quedó por debajo de ${repMin} repeticiones. Mantén o reduce un 5 % y recupera el rango.`
    };
  }

  return {
    kind: "mantener",
    weightKg: lastWeight,
    motivo: "Dentro del rango: mantén la carga y suma repeticiones respetando el RIR."
  };
};

/** Redondeo a 0.25 kg para evitar decimales absurdos en la sugerencia. */
const round25 = (w: number) => Math.round(w * 4) / 4;
