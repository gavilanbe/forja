// Ciclo de vida de una misión (sesión de entrenamiento).
// Toda mutación es local-first: validar → transacción IndexedDB → confirmar UI.
// La red no participa jamás en ese camino.

import { db, stamp, touch, now } from "../db/db";
import type {
  DiscomfortAction,
  Profile,
  Session,
  SetLog,
  SetSource,
  TimerState
} from "../db/types";
import { codexById } from "../data/codex";
import { loadTypeOf } from "../data/load";
import type { ExercisePrescription } from "../data/types";
import { XP } from "./xp";
import { enqueueOp } from "../sync/adapter";
import { campaignWeekOf, dateKeyOf } from "./dates";
import { forjaNow } from "./clock";
import { CAMPAIGN_WEEKS } from "../data/routine";

export const KV_TIMER = "activeTimer";
export const KV_ACTIVE_PROFILE = "activeProfileId";

/** Crea (o recupera) la sesión activa de hoy para un día de rutina. */
export const startSession = async (
  profile: Profile,
  dayId: string,
  today = forjaNow(),
  unscheduled = false
): Promise<Session> => {
  const dateKey = dateKeyOf(today);
  const existing = await db.sessions
    .where("[profileId+dateKey]")
    .equals([profile.id, dateKey])
    .and((s) => s.dayId === dayId && s.status === "activa")
    .first();
  if (existing) return existing;

  const session: Session = {
    ...stamp(),
    profileId: profile.id,
    dayId,
    dateKey,
    week: Math.max(1, campaignWeekOf(profile.campaignStart, today)),
    status: "activa",
    startedAt: now(),
    currentExerciseIndex: 0,
    unscheduled
  };
  await db.sessions.add(session);
  await enqueueOp(profile.id, "sessions", session.id, "put", session);
  return session;
};

export interface LogSetInput {
  weightKg: number;
  reps: number;
  rir: number;
  setNumber: number;
  exerciseId: string;
  source?: SetSource;
  altExerciseId?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Guarda una serie de forma transaccional y devuelve el registro guardado.
 * El XP solo se concede a series previstas (número ≤ prescrito) de sesiones
 * programadas: el volumen extra y los días de descanso no puntúan.
 */
export const logSet = async (
  session: Session,
  prescription: ExercisePrescription,
  input: LogSetInput
): Promise<SetLog> => {
  if (!input.skipped) {
    if (!(input.weightKg >= 0) || !(input.reps > 0)) {
      throw new Error("Serie no válida: revisa peso y repeticiones.");
    }
    if (input.weightKg === 0 && loadTypeOf(input.exerciseId) === "externa") {
      throw new Error(
        "Introduce el peso de trabajo: 0 kg no es una carga válida en este ejercicio."
      );
    }
    if (input.rir < 0 || input.rir > 4) {
      throw new Error("RIR fuera de rango (0–4+).");
    }
  }

  const record: SetLog = {
    ...stamp(),
    profileId: session.profileId,
    sessionId: session.id,
    exerciseId: input.exerciseId,
    dayId: session.dayId,
    setNumber: input.setNumber,
    weightKg: input.skipped ? 0 : input.weightKg,
    reps: input.skipped ? 0 : input.reps,
    rir: input.skipped ? 0 : input.rir,
    source: input.source ?? "normal",
    altExerciseId: input.altExerciseId,
    skipped: input.skipped,
    skipReason: input.skipReason
  };

  const earnsXp =
    !input.skipped &&
    !session.unscheduled &&
    input.setNumber <= prescription.sets;

  await db.transaction("rw", [db.setLogs, db.gameEvents, db.profiles], async () => {
    await db.setLogs.add(record);
    if (earnsXp) {
      await db.gameEvents.add({
        ...stamp(),
        profileId: session.profileId,
        type: "serie",
        xp: XP.seriePrevista,
        label: "Serie de trabajo registrada",
        sessionId: session.id,
        exerciseId: input.exerciseId
      });
      const p = await db.profiles.get(session.profileId);
      if (p) await db.profiles.put(touch({ ...p, xp: p.xp + XP.seriePrevista }));
    }
  });
  await enqueueOp(session.profileId, "setLogs", record.id, "put", record);
  return record;
};

export const setExerciseIndex = async (session: Session, index: number): Promise<void> => {
  const s = await db.sessions.get(session.id);
  if (!s) return;
  await db.sessions.put(touch({ ...s, currentExerciseIndex: index }));
};

export const recordDiscomfort = async (
  session: Session,
  exerciseId: string,
  level: number,
  action: DiscomfortAction,
  note?: string
): Promise<void> => {
  const record = {
    ...stamp(),
    profileId: session.profileId,
    sessionId: session.id,
    exerciseId,
    level,
    action,
    note
  };
  await db.discomforts.add(record);
  await enqueueOp(session.profileId, "discomforts", record.id, "put", record);
};

/** Mejor serie (peso máximo; a igualdad, más repeticiones). */
const topSet = (sets: SetLog[]): SetLog | undefined =>
  sets
    .filter((s) => !s.skipped && s.reps > 0)
    .sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];

export interface CompletionResult {
  session: Session;
  xpGained: number;
  hitos: string[];
  workingSets: number;
  exercisesProgressed: number;
  avgRir: number | null;
  weekMet: boolean;
  weekCompleted: number;
  weekTarget: number;
}

/**
 * Completa la misión: fija el resumen, concede XP de misión, detecta hitos
 * (récords personales por ejercicio) y, si la semana alcanza su objetivo,
 * concede el bono de capítulo una única vez.
 */
export const completeSession = async (
  session: Session,
  profile: Profile,
  adapted: boolean
): Promise<CompletionResult> => {
  const sets = await db.setLogs.where("sessionId").equals(session.id).toArray();
  const done = sets.filter((s) => !s.skipped && s.reps > 0);
  const workingSets = done.length;
  const avgRir =
    done.length > 0
      ? Math.round((done.reduce((a, s) => a + s.rir, 0) / done.length) * 10) / 10
      : null;

  // Hitos y progresión por ejercicio, contra todo el historial anterior.
  const hitos: string[] = [];
  let exercisesProgressed = 0;
  const byExercise = new Map<string, SetLog[]>();
  for (const s of done) {
    const arr = byExercise.get(s.exerciseId) ?? [];
    arr.push(s);
    byExercise.set(s.exerciseId, arr);
  }
  for (const [exerciseId, exSets] of byExercise) {
    const best = topSet(exSets);
    if (!best) continue;
    const previous = await db.setLogs
      .where("[profileId+exerciseId]")
      .equals([session.profileId, exerciseId])
      .and((s) => s.sessionId !== session.id && !s.skipped && s.reps > 0)
      .toArray();
    const prevBest = topSet(previous);
    if (prevBest) {
      if (
        best.weightKg > prevBest.weightKg ||
        (best.weightKg === prevBest.weightKg && best.reps > prevBest.reps)
      ) {
        exercisesProgressed += 1;
        if (best.weightKg > prevBest.weightKg) {
          const nombre = codexById(exerciseId)?.nombre ?? exerciseId;
          hitos.push(`${nombre} — ${best.weightKg} kg × ${best.reps}`);
        }
      }
    }
  }

  const status = adapted ? "adaptada" : "completada";
  const missionXp = session.unscheduled ? 0 : adapted ? XP.misionAdaptada : XP.misionCompletada;
  const hitoXp = hitos.length * XP.hito;

  let weekMet = false;
  let weekCompleted = 0;
  let chapterXp = 0;

  await db.transaction(
    "rw",
    [db.sessions, db.profiles, db.gameEvents],
    async () => {
      const fresh = await db.sessions.get(session.id);
      if (!fresh) throw new Error("La sesión ya no existe.");
      const updated: Session = touch({
        ...fresh,
        status,
        completedAt: now(),
        summary: {
          workingSets,
          exercisesProgressed,
          avgRir,
          xpGained: 0, // se fija después de calcular el bono de capítulo
          hitos
        }
      });
      await db.sessions.put(updated);

      if (missionXp > 0) {
        await db.gameEvents.add({
          ...stamp(),
          profileId: session.profileId,
          type: adapted ? "mision-adaptada" : "mision-completada",
          xp: missionXp,
          label: adapted ? "Misión adaptada con cabeza" : "Misión completada",
          sessionId: session.id
        });
      }
      for (const h of hitos) {
        await db.gameEvents.add({
          ...stamp(),
          profileId: session.profileId,
          type: "hito",
          xp: XP.hito,
          label: `Hito: ${h}`,
          sessionId: session.id
        });
      }

      // Bono de capítulo: solo una vez por semana de campaña.
      const weekSessions = await db.sessions
        .where("profileId")
        .equals(session.profileId)
        .and(
          (s) =>
            s.week === session.week &&
            (s.status === "completada" || s.status === "adaptada") &&
            !s.unscheduled
        )
        .toArray();
      weekCompleted = weekSessions.length;
      weekMet = weekCompleted >= profile.weeklyTarget;
      // El bono de capítulo pertenece a la campaña (semanas 1..6); después
      // del bloque forjado la rutina sigue, pero sin fingir capítulos.
      if (weekMet && session.week <= CAMPAIGN_WEEKS) {
        const already = await db.gameEvents
          .where("[profileId+type]")
          .equals([session.profileId, "capitulo-completado"])
          .and((e) => e.label === `capitulo-${session.week}`)
          .count();
        if (already === 0) {
          chapterXp = XP.capituloCompletado;
          await db.gameEvents.add({
            ...stamp(),
            profileId: session.profileId,
            type: "capitulo-completado",
            xp: chapterXp,
            label: `capitulo-${session.week}`,
            sessionId: session.id
          });
        }
      }

      const totalXp = missionXp + hitoXp + chapterXp;
      const p = await db.profiles.get(session.profileId);
      if (p && totalXp > 0) {
        await db.profiles.put(touch({ ...p, xp: p.xp + totalXp }));
      }
      await db.sessions.put(
        touch({
          ...updated,
          summary: { ...updated.summary!, xpGained: totalXp }
        })
      );
    }
  );

  const finalSession = (await db.sessions.get(session.id))!;
  await enqueueOp(session.profileId, "sessions", session.id, "put", finalSession);
  return {
    session: finalSession,
    xpGained: finalSession.summary?.xpGained ?? 0,
    hitos,
    workingSets,
    exercisesProgressed,
    avgRir,
    weekMet,
    weekCompleted,
    weekTarget: profile.weeklyTarget
  };
};

/** Nota breve por ejercicio (o sesión, con exerciseId ""). Upsert local. */
export const saveSessionNote = async (
  session: Session,
  exerciseId: string,
  text: string
): Promise<void> => {
  const existing = await db.notes
    .where("[sessionId+exerciseId]")
    .equals([session.id, exerciseId])
    .first();
  if (text.trim() === "") {
    if (existing) await db.notes.delete(existing.id);
    return;
  }
  const record = existing
    ? touch({ ...existing, text: text.trim() })
    : {
        ...stamp(),
        profileId: session.profileId,
        sessionId: session.id,
        exerciseId,
        text: text.trim()
      };
  await db.notes.put(record);
  await enqueueOp(session.profileId, "notes", record.id, "put", record);
};

// ── Temporizador persistido ──────────────────────────────────────────────────

export const saveTimer = async (t: TimerState | null): Promise<void> => {
  if (t === null) await db.kv.delete(KV_TIMER);
  else await db.kv.put({ key: KV_TIMER, value: t });
};

export const loadTimer = async (): Promise<TimerState | null> => {
  const row = await db.kv.get(KV_TIMER);
  return (row?.value as TimerState) ?? null;
};
