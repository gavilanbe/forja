// Rutinas personalizadas sin destruir las plantillas del manual.
// Las plantillas (DAYS + SCHEDULES) son inmutables; una rutina personalizada
// es una copia editable por perfil que solo afecta a sesiones FUTURAS:
// cada sesión guarda su propio snapshot de prescripción al empezar.

import { db, stamp, touch } from "../db/db";
import type { CustomRoutine, Profile } from "../db/types";
import type { ExercisePrescription, WorkoutDay } from "../data/types";
import { DAYS, dayById, ROUTINE_VERSION, scheduleById } from "../data/routine";

/** Copia profunda de un día de plantilla (nunca se muta el original). */
const cloneDay = (d: WorkoutDay): WorkoutDay => JSON.parse(JSON.stringify(d));

export const getCustomRoutine = async (
  profileId: string
): Promise<CustomRoutine | undefined> => {
  const all = await db.customRoutines.where("profileId").equals(profileId).toArray();
  return all.find((r) => r.active);
};

/**
 * Día efectivo para un perfil: el de su rutina personalizada activa si la
 * tiene, la plantilla del manual en caso contrario.
 */
export const effectiveDay = async (
  profileId: string,
  dayId: string
): Promise<WorkoutDay | undefined> => {
  const custom = await getCustomRoutine(profileId);
  const customDay = custom?.days.find((d) => d.id === dayId);
  return customDay ?? dayById(dayId);
};

/** Horario semanal efectivo (personalizado o plantilla). */
export const effectiveWeek = async (profile: Profile): Promise<(string | null)[]> => {
  const custom = await getCustomRoutine(profile.id);
  return custom?.week ?? scheduleById(profile.scheduleId).week;
};

/** Versión efectiva de rutina, para snapshots. */
export const effectiveRoutineVersion = async (profileId: string): Promise<string> => {
  const custom = await getCustomRoutine(profileId);
  return custom ? `${ROUTINE_VERSION}+custom.${custom.localVersion}` : ROUTINE_VERSION;
};

/**
 * Duplica la plantilla del perfil como rutina personalizada editable.
 * Si ya existe una, la devuelve sin duplicar.
 */
export const forkTemplate = async (profile: Profile): Promise<CustomRoutine> => {
  const existing = await getCustomRoutine(profile.id);
  if (existing) return existing;
  const schedule = scheduleById(profile.scheduleId);
  const routine: CustomRoutine = {
    ...stamp(),
    profileId: profile.id,
    baseScheduleId: profile.scheduleId,
    name: `Rutina de ${profile.name}`,
    days: DAYS.map(cloneDay),
    week: [...schedule.week],
    weeklyTarget: profile.weeklyTarget,
    active: true
  };
  await db.customRoutines.add(routine);
  return routine;
};

export const saveCustomRoutine = async (routine: CustomRoutine): Promise<void> => {
  await db.customRoutines.put(touch(routine));
};

/** Restaura la plantilla original (elimina la personalización). */
export const restoreTemplate = async (profileId: string): Promise<void> => {
  const custom = await getCustomRoutine(profileId);
  if (custom) await db.customRoutines.delete(custom.id);
};

/** Restaura un único día a su versión de plantilla dentro de la rutina. */
export const restoreDay = async (profileId: string, dayId: string): Promise<void> => {
  const custom = await getCustomRoutine(profileId);
  const template = dayById(dayId);
  if (!custom || !template) return;
  const idx = custom.days.findIndex((d) => d.id === dayId);
  if (idx >= 0) {
    custom.days[idx] = cloneDay(template);
    await saveCustomRoutine(custom);
  }
};

// ── Ediciones concretas (siempre sobre la copia) ────────────────────────────

export const reorderEntries = (day: WorkoutDay, from: number, to: number): WorkoutDay => {
  const entries = [...day.entries];
  const [moved] = entries.splice(from, 1);
  entries.splice(Math.max(0, Math.min(entries.length, to)), 0, moved);
  return { ...day, entries };
};

export const updateEntry = (
  day: WorkoutDay,
  index: number,
  patch: Partial<ExercisePrescription>
): WorkoutDay => {
  const entries = day.entries.map((e, i) => (i === index ? { ...e, ...patch } : e));
  const entry = entries[index];
  // Coherencia: rirPerSet siempre con tantas entradas como series.
  if (entry.rirPerSet.length !== entry.sets) {
    const last = entry.rirPerSet[entry.rirPerSet.length - 1] ?? { rir: { min: 1, max: 2 } };
    entry.rirPerSet = Array.from(
      { length: entry.sets },
      (_, i) => entry.rirPerSet[i] ?? { rir: { ...last.rir } }
    );
  }
  return { ...day, entries };
};

export const addEntry = (day: WorkoutDay, entry: ExercisePrescription): WorkoutDay => ({
  ...day,
  entries: [...day.entries, entry]
});

export const removeEntry = (day: WorkoutDay, index: number): WorkoutDay => ({
  ...day,
  entries: day.entries.filter((_, i) => i !== index)
});

/** ¿El día difiere de su plantilla? (para previsualización y aviso). */
export const dayDiffersFromTemplate = (day: WorkoutDay): boolean => {
  const template = dayById(day.id);
  if (!template) return true;
  return JSON.stringify(day) !== JSON.stringify(template);
};
