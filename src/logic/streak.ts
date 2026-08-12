// Llama de la Forja: racha SEMANAL, nunca diaria. Los campamentos (días de
// descanso) jamás rompen la llama; solo una semana ya cerrada sin alcanzar
// el objetivo la apaga. Una sesión adaptada por molestia cuenta para la
// adherencia (ver reglas de gamificación del super prompt).

import { campaignWeekOf, parseDateKey, weekStartKey, addDays, dateKeyOf } from "./dates";

export interface WeekSummary {
  week: number;
  startKey: string;
  completed: number;
  adapted: number;
  target: number;
  /** objetivo alcanzado (completadas + adaptadas >= objetivo) */
  met: boolean;
  /** la semana ya terminó por calendario */
  closed: boolean;
}

export interface SessionLike {
  dateKey: string;
  status: string;
}

export interface SummarizeOptions {
  /**
   * Fecha real de incorporación (dateKey). En la semana de incorporación el
   * objetivo efectivo se reduce a los días programados restantes: entrar un
   * sábado no convierte la semana en fallida ni marca días previos.
   */
  joinedKey?: string;
  /** Horario semanal (dayId|null por día, lunes=0) para prorratear objetivos. */
  scheduleWeek?: (string | null)[];
}

export const summarizeWeeks = (
  sessions: SessionLike[],
  campaignStart: string,
  weeklyTarget: number,
  today: Date,
  totalWeeks: number,
  opts: SummarizeOptions = {}
): WeekSummary[] => {
  const currentWeek = campaignWeekOf(campaignStart, today);
  const weeks: WeekSummary[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const startKey = weekStartKey(campaignStart, w);
    const endKey = dateKeyOf(addDays(parseDateKey(startKey), 6));
    const inWeek = sessions.filter((s) => s.dateKey >= startKey && s.dateKey <= endKey);
    const completed = inWeek.filter((s) => s.status === "completada").length;
    const adapted = inWeek.filter((s) => s.status === "adaptada").length;

    let target = weeklyTarget;
    // Semana de incorporación: solo cuentan los días programados desde la
    // fecha real de entrada. Los anteriores no existen para el objetivo.
    if (opts.joinedKey && opts.joinedKey > startKey && opts.joinedKey <= endKey) {
      if (opts.scheduleWeek) {
        const start = parseDateKey(startKey);
        let remaining = 0;
        for (let i = 0; i < 7; i++) {
          const key = dateKeyOf(addDays(start, i));
          if (key >= opts.joinedKey && opts.scheduleWeek[i]) remaining += 1;
        }
        target = Math.min(weeklyTarget, remaining);
      } else {
        target = 0;
      }
    } else if (opts.joinedKey && opts.joinedKey > endKey) {
      // Semana completa anterior a la incorporación: no exigible.
      target = 0;
    }

    weeks.push({
      week: w,
      startKey,
      completed,
      adapted,
      target,
      met: completed + adapted >= target && target > 0,
      closed: w < currentWeek
    });
  }
  return weeks;
};

/**
 * Semanas consecutivas con la llama viva, contando hacia atrás desde hoy.
 * La semana en curso suma si ya alcanzó el objetivo; si aún no, no rompe.
 */
export const flameStreak = (weeks: WeekSummary[], today: Date, campaignStart: string): number => {
  const currentWeek = campaignWeekOf(campaignStart, today);
  let streak = 0;
  for (let w = Math.min(currentWeek, weeks.length); w >= 1; w--) {
    const info = weeks[w - 1];
    if (!info) break;
    if (info.target === 0) continue; // semana no exigible (previa a la incorporación)
    if (info.met) {
      streak += 1;
    } else if (info.closed) {
      break; // semana cerrada sin objetivo: la llama se apagó ahí
    }
    // semana en curso sin objetivo todavía: ni suma ni rompe
  }
  return streak;
};

/** ¿Sigue viva la llama? (ninguna semana cerrada falló desde el último éxito) */
export const flameAlive = (weeks: WeekSummary[], today: Date, campaignStart: string): boolean => {
  const currentWeek = campaignWeekOf(campaignStart, today);
  if (currentWeek < 1) return true;
  if (currentWeek === 1) return true;
  const prev = weeks[currentWeek - 2];
  if (!prev) return true;
  return prev.target === 0 ? true : prev.met;
};
