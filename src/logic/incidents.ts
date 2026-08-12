// Incidencias de molestia con ciclo de vida: activa → en seguimiento →
// resuelta. Una molestia del pasado NUNCA bloquea para siempre: el estado se
// evalúa contra la exposición relevante más reciente (sesiones posteriores
// del mismo ejercicio) y evoluciona con sesiones limpias.
//
// Reglas del manual que no cambian:
// 0–2 tolerable · 3–4 modificar · >4 detener · nunca diagnosticar.

import { db, touch } from "../db/db";
import type { DiscomfortNote, IncidentStatus } from "../db/types";

/** Nivel a partir del cual una molestia es "significativa" (manual: 3). */
export const SIGNIFICANT_LEVEL = 3;

/** Sesiones limpias necesarias para pasar a seguimiento y a resuelta. */
export const CLEAN_FOR_FOLLOWUP = 1;
export const CLEAN_FOR_RESOLVED = 2;

export interface IncidentState {
  status: IncidentStatus | null;
  /** Último registro significativo, si existe. */
  incident: DiscomfortNote | null;
  /** Sesiones posteriores del ejercicio sin molestia significativa. */
  cleanSessionsSince: number;
}

/**
 * Evalúa (y persiste) el estado de incidencia de un ejercicio para un perfil.
 * La verdad se deriva del historial: qué pasó DESPUÉS de la última molestia
 * significativa, no de cuándo ocurrió.
 */
export const evaluateIncident = async (
  profileId: string,
  exerciseId: string
): Promise<IncidentState> => {
  const notes = await db.discomforts
    .where("[profileId+exerciseId]")
    .equals([profileId, exerciseId])
    .toArray();
  const significant = notes
    .filter((n) => n.level >= SIGNIFICANT_LEVEL)
    .sort((a, b) => a.createdAt - b.createdAt);
  const last = significant[significant.length - 1];
  if (!last) return { status: null, incident: null, cleanSessionsSince: 0 };

  // Sesiones posteriores donde el ejercicio se trabajó de verdad.
  const laterSets = await db.setLogs
    .where("[profileId+exerciseId]")
    .equals([profileId, exerciseId])
    .and((s) => s.createdAt > last.createdAt && !s.skipped && s.reps > 0)
    .toArray();
  const laterSessionIds = [...new Set(laterSets.map((s) => s.sessionId))].filter(
    (id) => id !== last.sessionId
  );
  // Una sesión posterior solo cuenta como limpia si no registró molestia
  // significativa del ejercicio.
  const dirtySessionIds = new Set(
    notes
      .filter((n) => n.level >= SIGNIFICANT_LEVEL && n.createdAt > last.createdAt)
      .map((n) => n.sessionId)
  );
  const clean = laterSessionIds.filter((id) => !dirtySessionIds.has(id)).length;

  const status: IncidentStatus =
    clean >= CLEAN_FOR_RESOLVED
      ? "resuelta"
      : clean >= CLEAN_FOR_FOLLOWUP
        ? "seguimiento"
        : "activa";

  if (last.incidentStatus !== status) {
    await db.discomforts.put(touch({ ...last, incidentStatus: status }));
  }
  return { status, incident: last, cleanSessionsSince: clean };
};

/** Texto honesto del estado, para mostrar junto a la sugerencia. */
export const incidentExplanation = (state: IncidentState): string | null => {
  if (!state.status || !state.incident) return null;
  const nivel = state.incident.level;
  switch (state.status) {
    case "activa":
      return `Molestia reciente (nivel ${nivel}) sin sesiones limpias posteriores: sin sugerencia de subida. Prioriza técnica y rango tolerable.`;
    case "seguimiento":
      return `Molestia en seguimiento (nivel ${nivel}; ${state.cleanSessionsSince} sesión limpia después): se sugiere mantener la carga, sin subidas todavía.`;
    case "resuelta":
      return `Molestia anterior resuelta (${state.cleanSessionsSince} sesiones limpias): las sugerencias vuelven con normalidad, de forma conservadora.`;
  }
};
