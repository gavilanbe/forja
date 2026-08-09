// Ciclo de vida de la campaña: prólogo → capítulos 1..6 → bloque forjado.
// Antes del inicio no hay capítulo activo ni llama encendida; después de la
// semana 6 el bloque queda forjado y la rutina sigue disponible sin fingir
// un capítulo 6 eterno. Fechas siempre inyectadas: nada lee el reloj aquí.

import { addDays, campaignWeekOf, dateKeyOf, mondayOf, parseDateKey, weekdayIndex } from "./dates";
import { CAMPAIGN_WEEKS } from "../data/routine";
import type { WeekSummary } from "./streak";

export type CampaignPhase =
  | { kind: "prologo"; startKey: string; daysUntil: number }
  | { kind: "activa"; week: number }
  | { kind: "forjado"; weeksSince: number };

export const campaignPhase = (campaignStart: string, today: Date): CampaignPhase => {
  const week = campaignWeekOf(campaignStart, today);
  if (week < 1) {
    const start = parseDateKey(campaignStart);
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysUntil = Math.max(
      0,
      Math.round((start.getTime() - midnight.getTime()) / 86_400_000)
    );
    return { kind: "prologo", startKey: campaignStart, daysUntil };
  }
  if (week > CAMPAIGN_WEEKS) {
    return { kind: "forjado", weeksSince: week - CAMPAIGN_WEEKS };
  }
  return { kind: "activa", week };
};

/**
 * Estado visual de la Llama de la Forja.
 * - `apagada`: prólogo — todavía no hay nada que mantener vivo.
 * - `rescoldo`: semana en curso sin objetivo cumplido y sin racha previa.
 * - `encendida`: la racha viene viva de semanas anteriores; la actual aún no suma.
 * - `roja`: el objetivo de esta semana ya está cumplido.
 */
export type FlameState = "apagada" | "rescoldo" | "encendida" | "roja";

export const flameStateOf = (
  phase: CampaignPhase,
  weeks: WeekSummary[],
  streak: number
): FlameState => {
  if (phase.kind === "prologo") return "apagada";
  if (phase.kind === "activa") {
    const info = weeks[phase.week - 1];
    if (info?.met) return "roja";
    return streak > 0 ? "encendida" : "rescoldo";
  }
  // Bloque forjado: la llama refleja cómo terminó el bloque.
  return streak > 0 ? "encendida" : "rescoldo";
};

/** Resumen del bloque para la pantalla de «Bloque forjado». */
export interface BlockSummary {
  weeksMet: number;
  totalWeeks: number;
  completed: number;
  adapted: number;
}

/**
 * Inicio de una nueva campaña pedida hoy: este lunes si hoy es lunes,
 * el próximo lunes en cualquier otro caso. Nunca se reinicia sola.
 */
export const nextCampaignStart = (today: Date): string => {
  const monday = mondayOf(today);
  return dateKeyOf(weekdayIndex(today) === 0 ? monday : addDays(monday, 7));
};

export const summarizeBlock = (weeks: WeekSummary[]): BlockSummary => ({
  weeksMet: weeks.filter((w) => w.met).length,
  totalWeeks: weeks.length,
  completed: weeks.reduce((a, w) => a + w.completed, 0),
  adapted: weeks.reduce((a, w) => a + w.adapted, 0)
});
