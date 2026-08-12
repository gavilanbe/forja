// Ciclo de vida de una misión (sesión de entrenamiento).
// Toda mutación es local-first: validar → transacción IndexedDB → confirmar UI.
// La red no participa jamás en ese camino.
//
// Recompensas (v3): la XP es un libro mayor de gameEvents. Cada recompensa
// tiene un dedupeKey único por perfil (índice único en IndexedDB), de modo
// que doble toque, recarga, reinicio o reintento NUNCA duplican XP. El campo
// profile.xp se recalcula siempre desde el libro mayor.

import { db, stamp, touch, now } from "../db/db";
import type {
  Adaptation,
  DiscomfortAction,
  GameEvent,
  GameEventType,
  IncidentStatus,
  Profile,
  Session,
  SessionStatus,
  SetLog,
  SetSource,
  TimerState
} from "../db/types";
import { codexById } from "../data/codex";
import { loadTypeOf } from "../data/load";
import { variantById, variantDisplayName } from "../data/variants";
import type { ExercisePrescription } from "../data/types";
import { XP } from "./xp";
import { enqueueOp } from "../sync/adapter";
import { campaignWeekOf, dateKeyOf } from "./dates";
import { forjaNow } from "./clock";
import { dayById } from "../data/routine";
import { getActiveCampaign } from "./campaigns";
import { effectiveDay, effectiveRoutineVersion } from "./routines";

export const KV_ACTIVE_PROFILE = "activeProfileId";

/** Clave del temporizador persistido, POR PERFIL (modo Entrenar Juntos). */
export const timerKey = (profileId: string): string => `activeTimer:${profileId}`;

// ── Libro mayor ─────────────────────────────────────────────────────────────

/** Suma del libro mayor de un perfil. Debe llamarse dentro de una tx rw. */
const recomputeXp = async (profileId: string): Promise<void> => {
  const events = await db.gameEvents.where("profileId").equals(profileId).toArray();
  const xp = events.reduce((a, e) => a + e.xp, 0);
  const p = await db.profiles.get(profileId);
  if (p && p.xp !== xp) await db.profiles.put(touch({ ...p, xp }));
};

/**
 * Concede una recompensa una única vez. Si el dedupeKey ya existe, no hace
 * nada y devuelve false. Debe llamarse dentro de una transacción rw que
 * incluya gameEvents.
 */
const awardOnce = async (
  e: Omit<GameEvent, keyof ReturnType<typeof stamp>>
): Promise<boolean> => {
  const existing = await db.gameEvents
    .where("[profileId+dedupeKey]")
    .equals([e.profileId, e.dedupeKey])
    .first();
  if (existing) return false;
  try {
    await db.gameEvents.add({ ...stamp(), ...e });
    return true;
  } catch {
    // Carrera perdida contra otra escritura con el mismo dedupeKey: correcto.
    return false;
  }
};

/** Retira recompensas cuyo dedupeKey ya no corresponde a nada real. */
const revokeByKeys = async (profileId: string, keys: string[]): Promise<void> => {
  for (const key of keys) {
    const e = await db.gameEvents
      .where("[profileId+dedupeKey]")
      .equals([profileId, key])
      .first();
    if (e) await db.gameEvents.delete(e.id);
  }
};

// ── Identidades de recompensa ───────────────────────────────────────────────

const serieKey = (s: Session, exerciseId: string, setNumber: number): string =>
  `serie:${s.campaignId ?? "sin"}:${s.dateKey}:${s.dayId}:${exerciseId}:${setNumber}`;

const seriePrefix = (s: Session): string =>
  `serie:${s.campaignId ?? "sin"}:${s.dateKey}:${s.dayId}:`;

const misionKey = (sessionId: string): string => `mision:${sessionId}`;
const hitoKey = (sessionId: string, exerciseId: string): string =>
  `hito:${sessionId}:${exerciseId}`;
const capituloKey = (campaignId: string | undefined, week: number): string =>
  `capitulo:${campaignId ?? "sin"}:${week}`;

// ── Sesión ──────────────────────────────────────────────────────────────────

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

  const campaign = await getActiveCampaign(profile.id);
  const day = await effectiveDay(profile.id, dayId);
  const routineVersion = await effectiveRoutineVersion(profile.id);

  const session: Session = {
    ...stamp(),
    profileId: profile.id,
    campaignId: campaign?.id,
    dayId,
    dateKey,
    week: Math.max(
      1,
      campaignWeekOf(campaign?.startKey ?? profile.campaignStart, today)
    ),
    status: "activa",
    startedAt: now(),
    currentExerciseIndex: 0,
    unscheduled,
    prescriptionSnapshot: day
      ? {
          dayName: day.name,
          routineVersion,
          entries: JSON.parse(JSON.stringify(day.entries))
        }
      : undefined
  };
  await db.sessions.add(session);
  await enqueueOp(profile.id, "sessions", session.id, "put", session);
  return session;
};

/** Prescripción con la que se realiza/realizó una sesión (snapshot primero). */
export const sessionEntries = (s: Session): ExercisePrescription[] =>
  s.prescriptionSnapshot?.entries ?? dayById(s.dayId)?.entries ?? [];

export interface LogSetInput {
  weightKg: number;
  reps: number;
  rir: number;
  setNumber: number;
  exerciseId: string;
  variantId?: string;
  source?: SetSource;
  side?: "izq" | "der";
  altExerciseId?: string;
  skipped?: boolean;
  skipReason?: string;
}

const validateSetValues = (input: {
  weightKg: number;
  reps: number;
  rir: number;
  exerciseId: string;
  variantId?: string;
  skipped?: boolean;
}): void => {
  if (input.skipped) return;
  if (!(input.weightKg >= 0) || !(input.reps > 0)) {
    throw new Error("Serie no válida: revisa peso y repeticiones.");
  }
  const loadType =
    variantById(input.variantId)?.loadType ?? loadTypeOf(input.exerciseId);
  if (input.weightKg === 0 && loadType === "externa") {
    throw new Error(
      "Introduce el peso de trabajo: 0 kg no es una carga válida en este ejercicio."
    );
  }
  if (input.rir < 0 || input.rir > 4) {
    throw new Error("RIR fuera de rango (0–4+).");
  }
};

/**
 * Guarda una serie de forma transaccional y devuelve el registro guardado.
 * El XP solo se concede a series previstas (número ≤ prescrito) de sesiones
 * programadas; su identidad (día + ejercicio + número) hace imposible
 * cultivarlo abandonando y reiniciando la misma misión.
 */
export const logSet = async (
  session: Session,
  prescription: ExercisePrescription,
  input: LogSetInput
): Promise<SetLog> => {
  validateSetValues(input);

  const record: SetLog = {
    ...stamp(),
    profileId: session.profileId,
    sessionId: session.id,
    campaignId: session.campaignId,
    exerciseId: input.exerciseId,
    variantId: input.variantId,
    dayId: session.dayId,
    setNumber: input.setNumber,
    weightKg: input.skipped ? 0 : input.weightKg,
    reps: input.skipped ? 0 : input.reps,
    rir: input.skipped ? 0 : input.rir,
    source: input.source ?? "normal",
    side: input.side,
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
      const granted = await awardOnce({
        profileId: session.profileId,
        campaignId: session.campaignId,
        type: "serie",
        xp: XP.seriePrevista,
        label: "Serie de trabajo registrada",
        dedupeKey: serieKey(session, input.exerciseId, input.setNumber),
        sessionId: session.id,
        exerciseId: input.exerciseId
      });
      if (granted) await recomputeXp(session.profileId);
    }
  });
  await enqueueOp(session.profileId, "setLogs", record.id, "put", record);
  return record;
};

// ── Corrección de series: editar, deshacer, eliminar ────────────────────────

export interface UpdateSetPatch {
  weightKg?: number;
  reps?: number;
  rir?: number;
}

/**
 * Edita peso/repeticiones/RIR de una serie ya guardada. Local-first y
 * offline. Si la sesión ya estaba sellada, recalcula resumen, hitos y XP
 * sin duplicaciones.
 */
export const updateSet = async (setId: string, patch: UpdateSetPatch): Promise<SetLog> => {
  const existing = await db.setLogs.get(setId);
  if (!existing) throw new Error("La serie ya no existe.");
  const next: SetLog = touch({
    ...existing,
    weightKg: patch.weightKg ?? existing.weightKg,
    reps: patch.reps ?? existing.reps,
    rir: patch.rir ?? existing.rir
  });
  validateSetValues(next);
  await db.setLogs.put(next);
  await enqueueOp(next.profileId, "setLogs", next.id, "put", next);
  const session = await db.sessions.get(existing.sessionId);
  if (session && session.status !== "activa") {
    await reconcileSealedSession(session.id);
  }
  return next;
};

/**
 * Elimina una serie (la UI SIEMPRE pide confirmación antes). Renumera las
 * series posteriores del mismo ejercicio en la sesión y reconcilia el libro
 * mayor: la XP de series que ya no existen se retira; nada se duplica.
 */
export const deleteSet = async (setId: string): Promise<void> => {
  const target = await db.setLogs.get(setId);
  if (!target) return;
  const session = await db.sessions.get(target.sessionId);

  await db.transaction(
    "rw",
    [db.setLogs, db.gameEvents, db.profiles, db.sessions],
    async () => {
    await db.setLogs.delete(setId);
    // Renumerar series posteriores del mismo ejercicio en esta sesión.
    const siblings = await db.setLogs
      .where("[sessionId+exerciseId]")
      .equals([target.sessionId, target.exerciseId])
      .toArray();
    for (const s of siblings.sort((a, b) => a.setNumber - b.setNumber)) {
      if (s.setNumber > target.setNumber) {
        await db.setLogs.put(touch({ ...s, setNumber: s.setNumber - 1 }));
      }
    }
    if (session) await reconcileSerieXp(session);
    }
  );
  await enqueueOp(target.profileId, "setLogs", target.id, "delete", { id: target.id });
  if (session && session.status !== "activa") {
    await reconcileSealedSession(session.id);
  }
};

/**
 * Deshace la última serie guardada de la sesión. Devuelve la serie retirada
 * para que la UI restaure la fase correcta (número de serie y descanso).
 */
export const undoLastSet = async (sessionId: string): Promise<SetLog | null> => {
  const sets = (
    await db.setLogs.where("sessionId").equals(sessionId).toArray()
  ).sort((a, b) => a.createdAt - b.createdAt || a.setNumber - b.setNumber);
  const last = sets[sets.length - 1];
  if (!last) return null;
  await deleteSet(last.id);
  return last;
};

/**
 * Reconciliación del XP de series para el ámbito (perfil, campaña, fecha,
 * día): el conjunto de eventos "serie" debe corresponder EXACTAMENTE al
 * conjunto de series reales. Elimina eventos huérfanos y añade los que
 * falten. Debe llamarse dentro de una tx rw con setLogs+gameEvents+profiles.
 */
const reconcileSerieXp = async (session: Session): Promise<void> => {
  if (session.unscheduled) return;
  // Series reales de TODAS las sesiones del mismo día/rutina (una misión
  // abandonada y reiniciada comparte identidad de recompensa).
  const daySessions = await db.sessions
    .where("[profileId+dateKey]")
    .equals([session.profileId, session.dateKey])
    .and((s) => s.dayId === session.dayId && !s.unscheduled)
    .toArray();
  const entries = sessionEntries(session);
  const prescribedOf = (exerciseId: string): number =>
    entries.find((e) => e.exerciseId === exerciseId)?.sets ?? 0;

  const desired = new Map<string, { exerciseId: string; sessionId: string }>();
  for (const ds of daySessions) {
    const sets = await db.setLogs.where("sessionId").equals(ds.id).toArray();
    for (const s of sets) {
      if (s.skipped) continue;
      if (s.setNumber > prescribedOf(s.exerciseId)) continue;
      desired.set(serieKey(session, s.exerciseId, s.setNumber), {
        exerciseId: s.exerciseId,
        sessionId: ds.id
      });
    }
  }

  const prefix = seriePrefix(session);
  const existing = await db.gameEvents
    .where("profileId")
    .equals(session.profileId)
    .and((e) => e.type === "serie" && e.dedupeKey.startsWith(prefix))
    .toArray();

  for (const e of existing) {
    if (!desired.has(e.dedupeKey)) await db.gameEvents.delete(e.id);
  }
  for (const [key, info] of desired) {
    await awardOnce({
      profileId: session.profileId,
      campaignId: session.campaignId,
      type: "serie",
      xp: XP.seriePrevista,
      label: "Serie de trabajo registrada",
      dedupeKey: key,
      sessionId: info.sessionId,
      exerciseId: info.exerciseId
    });
  }
  await recomputeXp(session.profileId);
};

// ── Navegación y molestias ──────────────────────────────────────────────────

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
  note?: string,
  variantId?: string
): Promise<void> => {
  const record = {
    ...stamp(),
    profileId: session.profileId,
    sessionId: session.id,
    exerciseId,
    variantId,
    level,
    action,
    note,
    incidentStatus: (level >= 3 ? "activa" : "resuelta") as IncidentStatus
  };
  await db.discomforts.add(record);
  await enqueueOp(session.profileId, "discomforts", record.id, "put", record);
};

// ── Sellado de la misión ────────────────────────────────────────────────────

/** Mejor serie (peso máximo; a igualdad, más repeticiones). */
const topSet = (sets: SetLog[]): SetLog | undefined =>
  sets
    .filter((s) => !s.skipped && s.reps > 0)
    .sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];

export interface CompletionResult {
  session: Session;
  status: SessionStatus;
  xpGained: number;
  hitos: string[];
  workingSets: number;
  prescribedSets: number;
  exercisesProgressed: number;
  avgRir: number | null;
  adaptaciones: Adaptation[];
  weekMet: boolean;
  weekCompleted: number;
  weekTarget: number;
  /** true si esta llamada era una repetición (idempotencia). */
  alreadySealed: boolean;
}

/**
 * Clasifica el cierre de una sesión.
 * - completada: TODAS las series prescritas realizadas (no omitidas).
 * - adaptada: faltó trabajo, pero cada hueco está explicado (serie omitida
 *   con motivo, ejercicio detenido por molestia, adaptación explícita).
 * - parcial: hay trabajo real pero huecos sin explicar.
 * - abandonada: sin ninguna serie de trabajo.
 */
const classify = (
  entries: ExercisePrescription[],
  sets: SetLog[],
  adaptations: Adaptation[],
  stoppedExercises: Set<string>
): { status: Exclude<SessionStatus, "activa">; gaps: Adaptation[] } => {
  const done = sets.filter((s) => !s.skipped && s.reps > 0);
  if (done.length === 0) return { status: "abandonada", gaps: [] };

  const gaps: Adaptation[] = [];
  let missingUnexplained = 0;
  for (const entry of entries) {
    const doneCount = done.filter((s) => s.exerciseId === entry.exerciseId).length;
    const skippedSets = sets.filter(
      (s) => s.exerciseId === entry.exerciseId && s.skipped
    );
    const missing = Math.max(0, entry.sets - doneCount);
    if (missing === 0) continue;
    const explainedBySkips = Math.min(missing, skippedSets.length);
    for (const sk of skippedSets.slice(0, explainedBySkips)) {
      gaps.push({
        exerciseId: entry.exerciseId,
        tipo: "serie-omitida",
        detalle: sk.skipReason ?? "Serie omitida"
      });
    }
    let remaining = missing - explainedBySkips;
    if (remaining > 0 && stoppedExercises.has(entry.exerciseId)) {
      gaps.push({
        exerciseId: entry.exerciseId,
        tipo: "ejercicio-detenido",
        detalle: `Detenido por molestia: ${remaining} ${remaining === 1 ? "serie" : "series"} sin hacer`
      });
      remaining = 0;
    }
    if (
      remaining > 0 &&
      adaptations.some((a) => a.exerciseId === entry.exerciseId || a.exerciseId === "")
    ) {
      remaining = 0;
    }
    missingUnexplained += remaining;
  }

  const prescribedTotal = entries.reduce((a, e) => a + e.sets, 0);
  if (done.length >= prescribedTotal && missingUnexplained === 0 && gaps.length === 0) {
    return { status: "completada", gaps };
  }
  if (missingUnexplained === 0) return { status: "adaptada", gaps };
  return { status: "parcial", gaps };
};

const missionEventOf = (
  status: Exclude<SessionStatus, "activa">
): { type: GameEventType; xp: number; label: string } | null => {
  switch (status) {
    case "completada":
      return { type: "mision-completada", xp: XP.misionCompletada, label: "Misión completada" };
    case "adaptada":
      return { type: "mision-adaptada", xp: XP.misionAdaptada, label: "Misión adaptada con cabeza" };
    case "parcial":
      return { type: "mision-parcial", xp: XP.misionParcial, label: "Misión parcial" };
    case "abandonada":
      return null;
  }
};

export interface CompleteOptions {
  /** Adaptaciones explícitas añadidas por el usuario al cerrar. */
  adaptations?: Adaptation[];
  /** true = el usuario abandona explícitamente la misión. */
  abandon?: boolean;
}

/**
 * Sella la misión de forma IDEMPOTENTE: una segunda llamada (doble toque,
 * recarga, reintento) devuelve el resultado ya sellado sin conceder nada.
 */
export const completeSession = async (
  session: Session,
  profile: Profile,
  opts: CompleteOptions | boolean = {}
): Promise<CompletionResult> => {
  // Compatibilidad con la firma v2 (tercer argumento booleano "adapted").
  const options: CompleteOptions =
    typeof opts === "boolean"
      ? opts
        ? { adaptations: [{ exerciseId: "", tipo: "otro", detalle: "Sesión adaptada" }] }
        : {}
      : opts;

  const weekTarget = profile.weeklyTarget;
  let result: CompletionResult | null = null;

  await db.transaction(
    "rw",
    [db.sessions, db.profiles, db.gameEvents, db.setLogs, db.discomforts, db.campaigns],
    async () => {
      const fresh = await db.sessions.get(session.id);
      if (!fresh) throw new Error("La sesión ya no existe.");

      // Idempotencia: sellada es sellada.
      if (fresh.status !== "activa") {
        const weekInfo = await weekProgress(fresh, weekTarget);
        result = {
          session: fresh,
          status: fresh.status,
          xpGained: fresh.summary?.xpGained ?? 0,
          hitos: fresh.summary?.hitos ?? [],
          workingSets: fresh.summary?.workingSets ?? 0,
          prescribedSets: fresh.summary?.prescribedSets ?? 0,
          exercisesProgressed: fresh.summary?.exercisesProgressed ?? 0,
          avgRir: fresh.summary?.avgRir ?? null,
          adaptaciones: fresh.summary?.adaptaciones ?? [],
          weekMet: weekInfo.met,
          weekCompleted: weekInfo.count,
          weekTarget,
          alreadySealed: true
        };
        return;
      }

      const entries = sessionEntries(fresh);
      const sets = await db.setLogs.where("sessionId").equals(fresh.id).toArray();
      const done = sets.filter((s) => !s.skipped && s.reps > 0);
      const discomforts = await db.discomforts
        .where("sessionId")
        .equals(fresh.id)
        .toArray();
      const stopped = new Set(
        discomforts.filter((d) => d.action === "detener").map((d) => d.exerciseId)
      );

      // Una molestia con acción "adaptar" excusa los huecos DE ESE ejercicio
      // (nunca los del resto): la sesión puede sellarse como adaptada.
      const explicit: Adaptation[] = [
        ...(options.adaptations ?? []),
        ...discomforts
          .filter((d) => d.action === "adaptar")
          .map((d) => ({
            exerciseId: d.exerciseId,
            tipo: "carga-reducida" as const,
            detalle: `Molestia nivel ${d.level}: se adaptó carga/rango/variante`
          }))
      ];
      const { status, gaps } = options.abandon
        ? { status: "abandonada" as const, gaps: [] }
        : classify(entries, sets, explicit, stopped);

      const adaptaciones: Adaptation[] = [
        ...explicit,
        ...gaps,
        ...done
          .filter((s) => s.variantId)
          .reduce((acc, s) => {
            if (!acc.some((a) => a.exerciseId === s.exerciseId && a.tipo === "variante")) {
              acc.push({
                exerciseId: s.exerciseId,
                tipo: "variante",
                detalle: `Variante: ${variantDisplayName(s.variantId, s.exerciseId)}`
              });
            }
            return acc;
          }, [] as Adaptation[])
      ];

      const workingSets = done.length;
      const prescribedSets = entries.reduce((a, e) => a + e.sets, 0);
      const avgRir =
        done.length > 0
          ? Math.round((done.reduce((a, s) => a + s.rir, 0) / done.length) * 10) / 10
          : null;

      // Hitos y progresión por ejercicio+variante, contra el historial previo.
      const { hitos, exercisesProgressed } = await detectMilestones(fresh, done);

      const missionEvent =
        fresh.unscheduled || options.abandon ? null : missionEventOf(status);

      if (missionEvent) {
        await awardOnce({
          profileId: fresh.profileId,
          campaignId: fresh.campaignId,
          type: missionEvent.type,
          xp: missionEvent.xp,
          label: missionEvent.label,
          dedupeKey: misionKey(fresh.id),
          sessionId: fresh.id
        });
      }
      if (!fresh.unscheduled && (status === "completada" || status === "adaptada")) {
        for (const h of hitos) {
          await awardOnce({
            profileId: fresh.profileId,
            campaignId: fresh.campaignId,
            type: "hito",
            xp: XP.hito,
            label: `Hito: ${h.label}`,
            dedupeKey: hitoKey(fresh.id, h.exerciseId),
            sessionId: fresh.id,
            exerciseId: h.exerciseId
          });
        }
      }

      const sealed: Session = touch({
        ...fresh,
        status,
        completedAt: now(),
        summary: {
          workingSets,
          prescribedSets,
          exercisesProgressed,
          avgRir,
          xpGained: 0,
          hitos: hitos.map((h) => h.label),
          adaptaciones
        }
      });
      await db.sessions.put(sealed);

      // Bono de capítulo: identidad por campaña+semana; solo cuenta el plan
      // cumplido (completadas + adaptadas), y solo dentro de la campaña.
      const weekInfo = await weekProgress(sealed, weekTarget);
      let chapterAwarded = false;
      const campaign = sealed.campaignId
        ? await db.campaigns.get(sealed.campaignId)
        : undefined;
      const weeksTotal = campaign?.weeksTotal ?? 6;
      if (
        weekInfo.met &&
        sealed.week <= weeksTotal &&
        !sealed.unscheduled &&
        (status === "completada" || status === "adaptada")
      ) {
        chapterAwarded = await awardOnce({
          profileId: sealed.profileId,
          campaignId: sealed.campaignId,
          type: "capitulo-completado",
          xp: XP.capituloCompletado,
          label: `capitulo-${sealed.week}`,
          dedupeKey: capituloKey(sealed.campaignId, sealed.week),
          sessionId: sealed.id
        });
      }

      const sessionEvents = await db.gameEvents
        .where("profileId")
        .equals(sealed.profileId)
        .and(
          (e) =>
            e.sessionId === sealed.id &&
            (e.type !== "serie") // la XP de series se muestra aparte
        )
        .toArray();
      const xpGained = sessionEvents.reduce((a, e) => a + e.xp, 0);

      const finalSession: Session = touch({
        ...sealed,
        summary: { ...sealed.summary!, xpGained }
      });
      await db.sessions.put(finalSession);
      await recomputeXp(sealed.profileId);

      result = {
        session: finalSession,
        status,
        xpGained,
        hitos: hitos.map((h) => h.label),
        workingSets,
        prescribedSets,
        exercisesProgressed,
        avgRir,
        adaptaciones,
        weekMet: weekInfo.met,
        weekCompleted: weekInfo.count,
        weekTarget,
        alreadySealed: false
      };
      void chapterAwarded;
    }
  );

  const final = result!;
  await enqueueOp(session.profileId, "sessions", session.id, "put", final.session);
  return final;
};

/** Abandona la misión explícitamente (idempotente, sin recompensa de misión). */
export const abandonSession = async (
  session: Session,
  profile: Profile
): Promise<CompletionResult> => completeSession(session, profile, { abandon: true });

/** Misiones del plan cumplidas esta semana de campaña (dentro de la campaña). */
const weekProgress = async (
  s: Session,
  target: number
): Promise<{ count: number; met: boolean }> => {
  const sessions = await db.sessions
    .where("profileId")
    .equals(s.profileId)
    .and(
      (x) =>
        x.week === s.week &&
        x.campaignId === s.campaignId &&
        (x.status === "completada" || x.status === "adaptada") &&
        !x.unscheduled
    )
    .toArray();
  return { count: sessions.length, met: sessions.length >= target };
};

interface Milestone {
  exerciseId: string;
  label: string;
}

/**
 * Récords por ejercicio comparando SOLO historial comparable: la misma
 * variante (o el ejercicio principal si la serie no usó variante).
 */
const detectMilestones = async (
  session: Session,
  done: SetLog[]
): Promise<{ hitos: Milestone[]; exercisesProgressed: number }> => {
  const hitos: Milestone[] = [];
  let exercisesProgressed = 0;
  const byKey = new Map<string, SetLog[]>();
  for (const s of done) {
    const key = `${s.exerciseId}::${s.variantId ?? ""}`;
    const arr = byKey.get(key) ?? [];
    arr.push(s);
    byKey.set(key, arr);
  }
  for (const [key, exSets] of byKey) {
    const [exerciseId, variantId] = key.split("::");
    const best = topSet(exSets);
    if (!best) continue;
    const previous = await db.setLogs
      .where("[profileId+exerciseId]")
      .equals([session.profileId, exerciseId])
      .and(
        (s) =>
          s.sessionId !== session.id &&
          !s.skipped &&
          s.reps > 0 &&
          (s.variantId ?? "") === variantId
      )
      .toArray();
    const prevBest = topSet(previous);
    if (prevBest) {
      if (
        best.weightKg > prevBest.weightKg ||
        (best.weightKg === prevBest.weightKg && best.reps > prevBest.reps)
      ) {
        exercisesProgressed += 1;
        if (best.weightKg > prevBest.weightKg) {
          const nombre =
            variantById(variantId || undefined)?.nombre ??
            codexById(exerciseId)?.nombre ??
            exerciseId;
          hitos.push({
            exerciseId,
            label: `${nombre} — ${best.weightKg} kg × ${best.reps}`
          });
        }
      }
    }
  }
  return { hitos, exercisesProgressed };
};

/**
 * Recalcula el resumen y las recompensas de una sesión YA SELLADA tras
 * editar o eliminar series (desde el historial). Retira hitos que dejaron
 * de ser ciertos, añade los nuevos y deja el libro mayor exacto.
 */
export const reconcileSealedSession = async (sessionId: string): Promise<void> => {
  await db.transaction(
    "rw",
    [db.sessions, db.setLogs, db.gameEvents, db.profiles, db.discomforts],
    async () => {
      const s = await db.sessions.get(sessionId);
      if (!s || s.status === "activa") return;

      const sets = await db.setLogs.where("sessionId").equals(s.id).toArray();
      const done = sets.filter((x) => !x.skipped && x.reps > 0);
      const entries = sessionEntries(s);
      const workingSets = done.length;
      const prescribedSets = entries.reduce((a, e) => a + e.sets, 0);
      const avgRir =
        done.length > 0
          ? Math.round((done.reduce((a, x) => a + x.rir, 0) / done.length) * 10) / 10
          : null;

      const { hitos, exercisesProgressed } = await detectMilestones(s, done);

      // Sincronizar eventos de hito con la realidad recalculada.
      const currentHitoEvents = await db.gameEvents
        .where("profileId")
        .equals(s.profileId)
        .and((e) => e.type === "hito" && e.sessionId === s.id)
        .toArray();
      const desiredKeys = new Set(hitos.map((h) => hitoKey(s.id, h.exerciseId)));
      await revokeByKeys(
        s.profileId,
        currentHitoEvents
          .filter((e) => !desiredKeys.has(e.dedupeKey))
          .map((e) => e.dedupeKey)
      );
      if (s.status === "completada" || s.status === "adaptada") {
        for (const h of hitos) {
          await awardOnce({
            profileId: s.profileId,
            campaignId: s.campaignId,
            type: "hito",
            xp: XP.hito,
            label: `Hito: ${h.label}`,
            dedupeKey: hitoKey(s.id, h.exerciseId),
            sessionId: s.id,
            exerciseId: h.exerciseId
          });
        }
      }

      await reconcileSerieXp(s);

      const sessionEvents = await db.gameEvents
        .where("profileId")
        .equals(s.profileId)
        .and((e) => e.sessionId === s.id && e.type !== "serie")
        .toArray();
      const xpGained = sessionEvents.reduce((a, e) => a + e.xp, 0);

      await db.sessions.put(
        touch({
          ...s,
          summary: {
            workingSets,
            prescribedSets,
            exercisesProgressed,
            avgRir,
            xpGained,
            hitos: hitos.map((h) => h.label),
            adaptaciones: s.summary?.adaptaciones ?? []
          }
        })
      );
      await recomputeXp(s.profileId);
    }
  );
};

// ── Notas ───────────────────────────────────────────────────────────────────

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

// ── Temporizador persistido (por perfil) ────────────────────────────────────

export const saveTimer = async (
  profileId: string,
  t: TimerState | null
): Promise<void> => {
  if (t === null) await db.kv.delete(timerKey(profileId));
  else await db.kv.put({ key: timerKey(profileId), value: t });
};

export const loadTimer = async (profileId: string): Promise<TimerState | null> => {
  const row = await db.kv.get(timerKey(profileId));
  return (row?.value as TimerState) ?? null;
};
