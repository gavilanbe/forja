// Personalización del calendario semanal: mover una misión dentro de su
// semana, registrar ausencias (viaje/enfermedad), semanas de descarga y
// posponer una semana. Nada de esto genera XP ni duplica misiones: solo
// cambia QUÉ se espera cada día y cómo se evalúa el objetivo semanal.

import { db, stamp, touch } from "../db/db";
import type { CalendarOverride, CalendarOverrideType, Profile } from "../db/types";
import { dateKeyOf, mondayOf } from "./dates";
import { effectiveWeek } from "./routines";
import { getActiveCampaign } from "./campaigns";

export const overridesForWeek = async (
  profileId: string,
  weekStartKey: string
): Promise<CalendarOverride[]> =>
  await db.calendarOverrides
    .where("[profileId+weekStartKey]")
    .equals([profileId, weekStartKey])
    .toArray();

export interface EffectiveWeekDay {
  weekday: number;
  dayId: string | null;
  /** La misión fue movida desde otro día. */
  movedFrom?: number;
  /** Día marcado como ausencia (no cuenta como fallada ni para el objetivo). */
  absent?: boolean;
  absenceReason?: string;
}

export interface EffectiveWeekInfo {
  days: EffectiveWeekDay[];
  /** Objetivo semanal efectivo (descuenta ausencias y descarga). */
  effectiveTarget: number;
  deload: boolean;
  deloadFactor: number;
  postponed: boolean;
}

/**
 * Semana efectiva de un perfil para la semana que contiene `date`:
 * plantilla/rutina personalizada + excepciones de calendario.
 */
export const effectiveWeekFor = async (
  profile: Profile,
  date: Date
): Promise<EffectiveWeekInfo> => {
  const weekStartKey = dateKeyOf(mondayOf(date));
  const baseWeek = await effectiveWeek(profile);
  const overrides = await overridesForWeek(profile.id, weekStartKey);

  const days: EffectiveWeekDay[] = baseWeek.map((dayId, weekday) => ({
    weekday,
    dayId
  }));

  let deload = false;
  let deloadFactor = 1;
  let postponed = false;

  for (const o of overrides) {
    if (o.type === "mover" && o.fromWeekday !== undefined && o.toWeekday !== undefined) {
      const moved = days[o.fromWeekday]?.dayId;
      if (moved && days[o.toWeekday]) {
        days[o.toWeekday] = {
          ...days[o.toWeekday],
          dayId: moved,
          movedFrom: o.fromWeekday
        };
        days[o.fromWeekday] = { ...days[o.fromWeekday], dayId: null };
      }
    } else if (o.type === "ausencia") {
      for (const wd of o.weekdays ?? []) {
        if (days[wd]) {
          days[wd] = { ...days[wd], absent: true, absenceReason: o.reason };
        }
      }
    } else if (o.type === "descarga") {
      deload = true;
      deloadFactor = o.volumeFactor ?? 0.5;
    } else if (o.type === "posponer") {
      postponed = true;
    }
  }

  const plannedDays = days.filter((d) => d.dayId && !d.absent).length;
  const effectiveTarget = postponed
    ? 0
    : Math.min(profile.weeklyTarget, plannedDays);

  return { days, effectiveTarget, deload, deloadFactor, postponed };
};

export const addOverride = async (
  profile: Profile,
  weekStartKey: string,
  type: CalendarOverrideType,
  data: Partial<CalendarOverride>
): Promise<CalendarOverride | null> => {
  const campaign = await getActiveCampaign(profile.id);
  if (!campaign) return null;
  const record: CalendarOverride = {
    ...stamp(),
    profileId: profile.id,
    campaignId: campaign.id,
    weekStartKey,
    type,
    ...data
  };
  await db.calendarOverrides.add(record);
  return record;
};

export const removeOverride = async (id: string): Promise<void> => {
  await db.calendarOverrides.delete(id);
};

/** Vuelve al calendario original de la semana (borra sus excepciones). */
export const resetWeek = async (
  profileId: string,
  weekStartKey: string
): Promise<void> => {
  const overrides = await overridesForWeek(profileId, weekStartKey);
  for (const o of overrides) await db.calendarOverrides.delete(o.id);
};

/** Cambia los días habituales de entrenamiento (rutina personalizada). */
export const updateHabitualWeek = async (
  profile: Profile,
  week: (string | null)[]
): Promise<void> => {
  const { forkTemplate, saveCustomRoutine } = await import("./routines");
  const routine = await forkTemplate(profile);
  await saveCustomRoutine({ ...routine, week });
};

/** Marca/actualiza una semana de descarga con su factor de volumen. */
export const setDeloadWeek = async (
  profile: Profile,
  weekStartKey: string,
  volumeFactor = 0.5,
  reason = "Semana de descarga"
): Promise<void> => {
  const existing = (await overridesForWeek(profile.id, weekStartKey)).find(
    (o) => o.type === "descarga"
  );
  if (existing) {
    await db.calendarOverrides.put(touch({ ...existing, volumeFactor, reason }));
  } else {
    await addOverride(profile, weekStartKey, "descarga", { volumeFactor, reason });
  }
};
