// Motor de sugerencias conservador (doble progresión, ver manual §2).
// Nunca modifica la prescripción ni aplica nada por su cuenta: SIEMPRE
// explica el porqué y el usuario confirma cualquier cambio de carga.
//
// La molestia no es un veto eterno: entra como estado de incidencia
// (activa / seguimiento / resuelta) evaluado contra la exposición más
// reciente (ver incidents.ts).

import type { ExercisePrescription } from "../data/types";
import type { SetLog, IncidentStatus } from "../db/types";

export type SuggestionKind =
  | "subir"
  | "mantener"
  | "bajar"
  | "sin-datos"
  | "molestia"
  | "seguimiento";

export interface Suggestion {
  kind: SuggestionKind;
  /** Peso sugerido para la primera serie, si procede */
  weightKg?: number;
  /** Explicación SIEMPRE presente: por qué se sugiere lo que se sugiere. */
  motivo: string;
}

export interface ProgressionInput {
  prescription: ExercisePrescription;
  /**
   * Series de trabajo de la última sesión donde se hizo este ejercicio CON LA
   * MISMA VARIANTE (historiales de máquinas distintas no son comparables).
   */
  lastSets: SetLog[];
  /** Estado de incidencia del ejercicio (null = sin incidencias). */
  incidentStatus?: IncidentStatus | null;
  /** Explicación del estado de incidencia, si existe. */
  incidentMotivo?: string | null;
  /** Incremento configurable en kg (real del gimnasio si está configurado). */
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
  incidentStatus,
  incidentMotivo,
  incrementKg
}: ProgressionInput): Suggestion => {
  // Incidencia activa: sin sugerencia de subida, con explicación honesta.
  if (incidentStatus === "activa") {
    return {
      kind: "molestia",
      motivo:
        incidentMotivo ??
        "Molestia reciente sin sesiones limpias posteriores: sin sugerencia de subida. Prioriza técnica y rango tolerable."
    };
  }

  const done = lastSets.filter((s) => !s.skipped && s.reps > 0);
  if (done.length === 0) {
    return {
      kind: "sin-datos",
      motivo:
        "Sin registro previo con esta variante. Elige una carga que permita la parte media del rango con RIR 2 real y técnica estable."
    };
  }

  const { repMax, repMin, rirPerSet, sets } = prescription;
  const lastWeight = done[done.length - 1].weightKg;

  // En seguimiento: se mantiene aunque los números pidieran subir.
  if (incidentStatus === "seguimiento") {
    return {
      kind: "seguimiento",
      weightKg: lastWeight,
      motivo:
        incidentMotivo ??
        "Molestia en seguimiento: mantén la carga esta sesión; si sigue limpia, las subidas vuelven."
    };
  }

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
      motivo: `Todas las series llegaron a ${repMax} repeticiones con el RIR previsto. Sube ${incrementKg} kg y vuelve a la parte baja del rango. Confírmalo tú: la app nunca cambia la carga sola.`
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
