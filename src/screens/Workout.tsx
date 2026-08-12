// Entrenamiento activo: una etapa (ejercicio) cada vez, registro de series
// local-first y temporizador de descanso con timestamp absoluto persistido
// POR PERFIL (modo Entrenar Juntos: cada forjador lleva su propio descanso,
// series, XP y molestias, compartiendo la misma sesión canónica del día).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type {
  Prefs,
  Profile,
  Session,
  SetLog,
  TimerState
} from "../db/types";
import { dayById } from "../data/routine";
import type { ExercisePrescription } from "../data/types";
import { codexById, CODEX } from "../data/codex";
import { adviceOf, variantById, variantsOf } from "../data/variants";
import { useActiveProfile, usePrefs, useToday } from "../ui/hooks";
import { PixelButton, PixelFrame, PixelModal, StatusChip, XPBar } from "../ui/Pixel";
import { NumberField, RirSelector } from "../ui/controls";
import {
  abandonSession,
  completeSession,
  loadTimer,
  logSet,
  recordDiscomfort,
  saveSessionNote,
  saveTimer,
  sessionEntries,
  setExerciseIndex,
  startSession,
  undoLastSet,
  updateSet,
  deleteSet
} from "../logic/session";
import { defaultIncrement, suggest, type Suggestion } from "../logic/progression";
import { evaluateIncident, incidentExplanation } from "../logic/incidents";
import { effectiveGymSetting, effectiveIncrement, setupSummary } from "../logic/gym";
import { loadTypeOf, midReps, weightValid } from "../data/load";
import {
  addSeconds,
  formatClock,
  formatRestRange,
  isFinished,
  pause,
  remainingMs,
  resume
} from "../logic/timer";
import { playRestEndBeep, vibrate } from "../logic/feedback";
import { campaignWeekOf, dateKeyOf, weekdayIndex } from "../logic/dates";
import { effectiveWeekFor } from "../logic/calendar";
import { acquireWakeLock, notifyRestEnd, type WakeLockHandle } from "../logic/rest";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { BONFIRE_C } from "../ui/arcade/props";
import { avatarFrames } from "../ui/arcade/extra";

type Phase =
  | { kind: "cargando" }
  | { kind: "sin-mision" }
  | { kind: "serie" }
  | { kind: "descanso"; timer: TimerState }
  | { kind: "etapa-completa" };

const PER_SIDE_LABEL = { lado: "por lado", brazo: "por brazo", pierna: "por pierna" };

/** Borradores por participante+ejercicio+serie: cambiar de forjador no pierde nada. */
type DraftMap = Map<
  string,
  { weight?: number | null; reps?: number | null; rir?: number }
>;

export function Workout() {
  const navigate = useNavigate();
  const globalProfile = useActiveProfile();
  const today = useToday();

  // Participante activo del registro (modo Entrenar Juntos).
  const [participantId, setParticipantId] = useState<string | null>(null);
  const participant = useLiveQuery(
    async () => (participantId ? await db.profiles.get(participantId) : undefined),
    [participantId]
  );
  const prefs = usePrefs(participant?.id);

  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "cargando" });
  const [exitOpen, setExitOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [coParticipants, setCoParticipants] = useState<Profile[]>([]);
  const initRef = useRef(false);
  const draftsRef = useRef<DraftMap>(new Map());

  const session = participant ? sessions[participant.id] : undefined;

  // Arranque: recuperar sesión activa o crear la de hoy para el perfil activo.
  useEffect(() => {
    if (!globalProfile || initRef.current) return;
    initRef.current = true;
    (async () => {
      let s =
        (await db.sessions
          .where("[profileId+status]")
          .equals([globalProfile.id, "activa"])
          .first()) ?? null;
      let dayId = s?.dayId ?? null;
      if (!s) {
        const weekInfo = await effectiveWeekFor(globalProfile, today);
        const todayInfo = weekInfo.days[weekdayIndex(today)];
        dayId = todayInfo?.absent ? null : todayInfo?.dayId ?? null;
        let extra = false;
        if (!dayId) {
          // Día extra: unirse a la sesión canónica pedida (?dia=...), sin XP.
          const requested = new URLSearchParams(
            window.location.hash.split("?")[1]
          ).get("dia");
          if (requested && dayById(requested)) {
            dayId = requested;
            extra = true;
          } else {
            setPhase({ kind: "sin-mision" });
            return;
          }
        }
        // Prólogo: entrenar antes del inicio no finge misión de campaña.
        if (campaignWeekOf(globalProfile.campaignStart, today) < 1) extra = true;
        const done = await db.sessions
          .where("[profileId+dateKey]")
          .equals([globalProfile.id, dateKeyOf(today)])
          .and((x) => x.status === "completada" || x.status === "adaptada")
          .first();
        if (done) {
          navigate(`/mision/resumen/${done.id}`, { replace: true });
          return;
        }
        s = await startSession(globalProfile, dayId, today, extra);
      }
      setSessions((prev) => ({ ...prev, [globalProfile.id]: s! }));
      setParticipantId(globalProfile.id);

      // ¿Hay otro forjador con la MISMA sesión canónica hoy? (Entrenar Juntos)
      const others = (await db.profiles.toArray()).filter(
        (p) => p.id !== globalProfile.id
      );
      const co: Profile[] = [];
      for (const other of others) {
        const otherWeek = await effectiveWeekFor(other, today);
        const otherToday = otherWeek.days[weekdayIndex(today)];
        if (otherToday?.dayId === dayId && !otherToday.absent) co.push(other);
      }
      setCoParticipants(co);

      // Recuperar temporizador persistido si pertenece a esta sesión.
      const t = await loadTimer(globalProfile.id);
      if (t && t.sessionId === s.id && !isFinished(t, Date.now())) {
        setPhase({ kind: "descanso", timer: t });
      } else {
        if (t && t.sessionId !== s.id) await saveTimer(globalProfile.id, null);
        setPhase({ kind: "serie" });
      }
    })();
  }, [globalProfile, navigate, today]);

  /** Cambia el participante activo sin perder borradores ni descansos. */
  const switchParticipant = async (target: Profile) => {
    if (!session || target.id === participantId) return;
    let targetSession = sessions[target.id];
    if (!targetSession) {
      const active = await db.sessions
        .where("[profileId+status]")
        .equals([target.id, "activa"])
        .first();
      targetSession =
        active ?? (await startSession(target, session.dayId, today, false));
      setSessions((prev) => ({ ...prev, [target.id]: targetSession! }));
    }
    setParticipantId(target.id);
    const t = await loadTimer(target.id);
    if (t && t.sessionId === targetSession.id && !isFinished(t, Date.now())) {
      setPhase({ kind: "descanso", timer: t });
    } else {
      setPhase({ kind: "serie" });
    }
  };

  const entries = session ? sessionEntries(session) : [];
  const day = session ? dayById(session.dayId) : undefined;
  const dayName = session?.prescriptionSnapshot?.dayName ?? day?.name ?? "";
  const sets = useLiveQuery(
    async () =>
      session
        ? (await db.setLogs.where("sessionId").equals(session.id).toArray()).sort(
            (a, b) => a.createdAt - b.createdAt || a.setNumber - b.setNumber
          )
        : [],
    [session?.id]
  );

  if (phase.kind === "sin-mision") return <NoMission />;
  if (!participant || !session || entries.length === 0 || sets === undefined || !globalProfile) {
    return <main className="screen" />;
  }

  const exIndex = Math.min(session.currentExerciseIndex, entries.length - 1);
  const entry = entries[exIndex];
  const exSets = sets.filter((s) => s.exerciseId === entry.exerciseId);
  const nextSetNumber = exSets.length + 1;
  const stageDone = exSets.length >= entry.sets;
  const isLastStage = exIndex >= entries.length - 1;
  const totalPrescribed = entries.reduce((a, e) => a + e.sets, 0);
  const totalLogged = sets.filter((s) => !s.skipped).length;

  const goToStage = async (index: number) => {
    await setExerciseIndex(session, index);
    const fresh = await db.sessions.get(session.id);
    if (fresh) setSessions((prev) => ({ ...prev, [participant.id]: fresh }));
    setPhase({ kind: "serie" });
  };

  const handleUndoLast = async () => {
    const undone = await undoLastSet(session.id);
    await saveTimer(participant.id, null);
    if (undone) vibrate(15);
    setPhase({ kind: "serie" });
  };

  const handleFinish = async (abandon = false) => {
    await saveTimer(participant.id, null);
    if (abandon) {
      await abandonSession(session, participant);
      navigate("/", { replace: true });
      return;
    }
    const result = await completeSession(session, participant, {});
    navigate(`/mision/resumen/${result.session.id}`, { replace: true });
  };

  // Previsión honesta del sellado, para el modal de finalización.
  const doneCount = totalLogged;
  const skippedWithReason = sets.filter((s) => s.skipped && s.skipReason).length;
  const expectedStatus =
    doneCount === 0
      ? "abandonada"
      : doneCount >= totalPrescribed
        ? "completada"
        : doneCount + skippedWithReason >= totalPrescribed
          ? "adaptada"
          : "parcial";

  return (
    <>
      <header className="wk-header">
        <div>
          <div className="wk-header__title">
            {dayName}
            {session.unscheduled ? " · extra" : ""}
          </div>
          <div className="wk-header__sub">
            Etapa {exIndex + 1} de {entries.length} · Serie{" "}
            {Math.min(nextSetNumber, entry.sets)} de {entry.sets}
          </div>
          <div className="wk-progress" aria-hidden="true">
            {entries.map((_, i) => (
              <span
                key={i}
                className={`wk-progress__seg${
                  i < exIndex
                    ? " wk-progress__seg--done"
                    : i === exIndex
                      ? " wk-progress__seg--current"
                      : ""
                }`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="wk-exit"
          aria-label="Salir de la misión"
          onClick={() => setExitOpen(true)}
        >
          <span className="px-x" aria-hidden="true" />
        </button>
      </header>

      {/* ENTRENAR JUNTOS: participante activo extremadamente visible */}
      {coParticipants.length > 0 && (
        <div
          className={`party-bar party-bar--${participant.avatarId}`}
          role="group"
          aria-label="Quién registra la próxima serie"
        >
          <span className="party-bar__label">Registrando:</span>
          {[globalProfile, ...coParticipants]
            .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                className={`party-bar__who${
                  p.id === participant.id ? " party-bar__who--active" : ""
                }`}
                aria-pressed={p.id === participant.id}
                onClick={() => void switchParticipant(p)}
              >
                <PxSprite
                  frames={avatarFrames(p.avatarId, "neutral").frames}
                  palette={PAL_C}
                  scale={2}
                  label=""
                />
                <b>{p.name}</b>
              </button>
            ))}
        </div>
      )}

      <main
        className={`screen screen--workout${prefs?.modoCompacto ? " screen--compact" : ""}`}
      >
        {phase.kind === "descanso" ? (
          <RestView
            timer={phase.timer}
            participant={participant}
            entry={entry}
            nextEntry={!isLastStage ? entries[exIndex + 1] : undefined}
            nextSetNumber={Math.min(nextSetNumber, entry.sets)}
            stageDone={stageDone}
            prefs={prefs}
            onTimerChange={(t) => {
              setPhase({ kind: "descanso", timer: t });
              void saveTimer(participant.id, t);
            }}
            onUndoLast={handleUndoLast}
            onDone={async () => {
              await saveTimer(participant.id, null);
              setPhase(stageDone ? { kind: "etapa-completa" } : { kind: "serie" });
            }}
          />
        ) : phase.kind === "etapa-completa" || (phase.kind === "serie" && stageDone) ? (
          <StageComplete
            entries={entries}
            exIndex={exIndex}
            isLast={isLastStage}
            onNext={() => goToStage(exIndex + 1)}
            onExtra={() => setPhase({ kind: "serie" })}
            onFinish={() => setFinishOpen(true)}
          />
        ) : (
          <SetLogger
            key={`${participant.id}-${entry.exerciseId}-${nextSetNumber}`}
            session={session}
            participant={participant}
            entry={entry}
            exSets={exSets}
            setNumber={nextSetNumber}
            drafts={draftsRef.current}
            compact={!!prefs?.modoCompacto}
            profileIncrements={{
              compuesto: prefs?.incrementoCompuesto ?? 2.5,
              aislamiento: prefs?.incrementoAislamiento ?? 1.25
            }}
            onSaved={async () => {
              vibrate(20);
              const restSec = entry.restMaxSec;
              const timer: TimerState = {
                sessionId: session.id,
                exerciseId: entry.exerciseId,
                exerciseIndex: exIndex,
                nextSetNumber: nextSetNumber + 1,
                totalSec: restSec,
                targetEndAt: Date.now() + restSec * 1000,
                pausedRemainingMs: null
              };
              await saveTimer(participant.id, timer);
              setPhase({ kind: "descanso", timer });
            }}
            onStopExercise={async () => {
              await saveTimer(participant.id, null);
              setPhase({ kind: "etapa-completa" });
            }}
          />
        )}
      </main>

      {/* Salida */}
      <PixelModal
        open={exitOpen}
        title="¿Salir de la misión?"
        onClose={() => setExitOpen(false)}
      >
        <div className="stack stack--tight">
          <p className="small dim">
            Llevas {totalLogged} de {totalPrescribed} series guardadas en este
            dispositivo. Nada se pierde al salir.
          </p>
          <PixelButton tone="ghost" block onClick={() => setExitOpen(false)}>
            Seguir entrenando
          </PixelButton>
          <PixelButton
            tone="gold"
            block
            onClick={() => {
              setExitOpen(false);
              navigate("/");
            }}
          >
            Guardar y salir
          </PixelButton>
          {totalLogged > 0 && (
            <PixelButton
              tone="done"
              block
              onClick={() => {
                setExitOpen(false);
                setFinishOpen(true);
              }}
            >
              Terminar misión ahora
            </PixelButton>
          )}
          {/* Acción destructiva, separada y con doble confirmación */}
          <AbandonButton onAbandon={() => handleFinish(true)} />
        </div>
      </PixelModal>

      {/* Confirmación de fin, con previsión honesta del sello */}
      <PixelModal
        open={finishOpen}
        title="Terminar misión"
        onClose={() => setFinishOpen(false)}
      >
        <div className="stack stack--tight">
          <p className="small">
            {totalLogged} de {totalPrescribed} series de trabajo registradas.
            {totalLogged < totalPrescribed &&
              " Las series no realizadas no se marcan como hechas."}
          </p>
          <StatusChip
            tone={
              expectedStatus === "completada"
                ? "done"
                : expectedStatus === "adaptada"
                  ? "warn"
                  : "default"
            }
            dot
          >
            {expectedStatus === "completada" && "Se sellará como COMPLETADA"}
            {expectedStatus === "adaptada" && "Se sellará como ADAPTADA"}
            {expectedStatus === "parcial" &&
              "Se sellará como PARCIAL (recompensa reducida)"}
            {expectedStatus === "abandonada" &&
              "Sin series: se registrará como abandonada, sin recompensa"}
          </StatusChip>
          {expectedStatus === "parcial" && (
            <p className="small dim">
              Si omites las series que faltan con su motivo (botón «Omitir
              serie»), la misión contará como adaptada con cabeza.
            </p>
          )}
          <PixelButton tone="primary" big block onClick={() => handleFinish()}>
            Sellar la misión
          </PixelButton>
          <PixelButton tone="ghost" block onClick={() => setFinishOpen(false)}>
            Volver
          </PixelButton>
        </div>
      </PixelModal>
    </>
  );
}

/** Abandono con confirmación en dos pasos, lejos de las acciones normales. */
function AbandonButton({ onAbandon }: { onAbandon: () => void }) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const id = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(id);
  }, [confirm]);
  return (
    <div className="abandon-zone">
      {confirm ? (
        <PixelButton tone="danger" block onClick={onAbandon}>
          Confirmar abandono (sin recompensa de misión)
        </PixelButton>
      ) : (
        <PixelButton tone="danger" block onClick={() => setConfirm(true)}>
          Abandonar misión…
        </PixelButton>
      )}
    </div>
  );
}

// ── Sin misión hoy ──────────────────────────────────────────────────────────

function NoMission() {
  const navigate = useNavigate();
  return (
    <main className="screen">
      <PixelFrame>
        <div className="camp-card">
          <div className="mission-card__kicker">Campamento</div>
          <p style={{ marginBottom: "var(--s3)" }}>
            Hoy no hay misión programada. El descanso también forja.
          </p>
          <PixelButton tone="gold" block onClick={() => navigate("/")}>
            Volver a la Forja
          </PixelButton>
        </div>
      </PixelFrame>
    </main>
  );
}

// ── Registro de una serie ───────────────────────────────────────────────────

function SetLogger({
  session,
  participant,
  entry,
  exSets,
  setNumber,
  drafts,
  compact,
  profileIncrements,
  onSaved,
  onStopExercise
}: {
  session: Session;
  participant: Profile;
  entry: ExercisePrescription;
  exSets: SetLog[];
  setNumber: number;
  drafts: DraftMap;
  compact: boolean;
  profileIncrements: { compuesto: number; aislamiento: number };
  onSaved: () => void;
  onStopExercise: () => void;
}) {
  const codex = codexById(entry.exerciseId);
  const [altChoice, setAltChoice] = useState<string | null>(() => {
    // Variante pegajosa dentro de la etapa: la última serie manda.
    const last = exSets[exSets.length - 1];
    return last?.variantId ?? null;
  });
  const variant = variantById(altChoice ?? undefined);
  const variantCodex = variant?.codexId ? codexById(variant.codexId) : undefined;
  const techniqueCodex = variantCodex ?? codex;

  const gymSetting = useLiveQuery(
    async () =>
      (await effectiveGymSetting(participant.id, entry.exerciseId, altChoice ?? undefined)) ??
      null,
    [participant.id, entry.exerciseId, altChoice]
  );

  // Historial SOLO de la variante actual: máquinas distintas no se mezclan.
  const prevSets = useLiveQuery(
    async () =>
      (
        await db.setLogs
          .where("[profileId+dayId+exerciseId]")
          .equals([participant.id, session.dayId, entry.exerciseId])
          .and((s) => s.sessionId !== session.id)
          .sortBy("createdAt")
      ).filter((s) => (s.variantId ?? null) === (altChoice ?? null)),
    [participant.id, session.dayId, entry.exerciseId, session.id, altChoice]
  );

  const incident = useLiveQuery(
    async () => await evaluateIncident(participant.id, entry.exerciseId),
    [participant.id, entry.exerciseId]
  );

  const lastSessionSets = useMemo(() => {
    if (!prevSets || prevSets.length === 0) return [];
    const lastId = prevSets[prevSets.length - 1].sessionId;
    return prevSets.filter((s) => s.sessionId === lastId);
  }, [prevSets]);

  const increment = effectiveIncrement(
    gymSetting ?? undefined,
    defaultIncrement(entry, profileIncrements.compuesto, profileIncrements.aislamiento)
  );

  const suggestion: Suggestion | null = useMemo(() => {
    if (prevSets === undefined || incident === undefined) return null;
    return suggest({
      prescription: entry,
      lastSets: lastSessionSets,
      incidentStatus: incident?.status ?? null,
      incidentMotivo: incident ? incidentExplanation(incident) : null,
      incrementKg: increment
    });
  }, [entry, lastSessionSets, incident, prevSets, increment]);

  const target = entry.rirPerSet[Math.min(setNumber - 1, entry.rirPerSet.length - 1)].rir;

  const draftKey = `${participant.id}:${entry.exerciseId}:${setNumber}`;
  const draft = drafts.get(draftKey);

  // `undefined` = sin tocar (hereda), `null` = borrado a mano (campo vacío).
  const [weight, setWeightRaw] = useState<number | null | undefined>(draft?.weight);
  const [reps, setRepsRaw] = useState<number | null | undefined>(draft?.reps);
  const [rir, setRirRaw] = useState<number>(draft?.rir ?? target.max);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    null | "tecnica" | "alternativa" | "molestia" | "omitir" | "nota"
  >(null);
  const [editTarget, setEditTarget] = useState<SetLog | null>(null);

  const setWeight = (v: number | null | undefined) => {
    setWeightRaw(v);
    drafts.set(draftKey, { ...drafts.get(draftKey), weight: v ?? null });
  };
  const setReps = (v: number | null | undefined) => {
    setRepsRaw(v);
    drafts.set(draftKey, { ...drafts.get(draftKey), reps: v ?? null });
  };
  const setRir = (v: number) => {
    setRirRaw(v);
    drafts.set(draftKey, { ...drafts.get(draftKey), rir: v });
  };

  const note = useLiveQuery(
    async () =>
      (await db.notes
        .where("[sessionId+exerciseId]")
        .equals([session.id, entry.exerciseId])
        .first()) ?? null,
    [session.id, entry.exerciseId]
  );

  const loadType = variant?.loadType ?? loadTypeOf(entry.exerciseId);

  // Valores heredados: última serie de esta sesión (misma variante) → sesión
  // anterior (misma variante). La SUGERENCIA nunca se aplica sola: el usuario
  // la confirma con un toque. Sin historial, el peso queda VACÍO.
  const exSetsSameVariant = exSets.filter(
    (s) => (s.variantId ?? null) === (altChoice ?? null) && !s.skipped
  );
  const inheritedWeight: number | null =
    exSetsSameVariant.length > 0
      ? exSetsSameVariant[exSetsSameVariant.length - 1].weightKg
      : lastSessionSets.length > 0
        ? lastSessionSets[lastSessionSets.length - 1].weightKg
        : loadType === "externa"
          ? null
          : 0;
  const inheritedReps: number =
    exSetsSameVariant.length > 0
      ? exSetsSameVariant[exSetsSameVariant.length - 1].reps
      : lastSessionSets.length > 0
        ? Math.min(lastSessionSets[lastSessionSets.length - 1].reps, entry.repMax)
        : midReps(entry.repMin, entry.repMax);

  const effWeight = weight === undefined ? inheritedWeight : weight;
  const effReps = reps === undefined ? inheritedReps : reps;

  const weightOk =
    effWeight !== null && !Number.isNaN(effWeight) && effWeight >= 0 &&
    !(effWeight === 0 && loadType === "externa");
  const weightError =
    effWeight === 0 && loadType === "externa"
      ? "0 kg no es una carga válida aquí: introduce el peso de trabajo."
      : null;
  const canSave = !saving && weightOk && effReps !== null && effReps > 0;
  void weightValid;

  const save = async () => {
    if (saving || !weightOk || !effReps || effReps <= 0) return;
    setSaving(true);
    try {
      await logSet(session, entry, {
        weightKg: effWeight!,
        reps: effReps,
        rir,
        setNumber,
        exerciseId: entry.exerciseId,
        variantId: altChoice ?? undefined,
        source: altChoice ? "alternativa" : "normal",
        altExerciseId: variant?.nombre ?? undefined
      });
      drafts.delete(draftKey);
      // El cambio de fase es INMEDIATO y síncrono con el guardado: nada de
      // temporizadores diferidos que puedan disparar descansos fantasma o
      // perderse si el componente se remonta (la propia pantalla de descanso
      // es la confirmación visible de que la serie quedó guardada).
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const skipSet = async (reason: string) => {
    await logSet(session, entry, {
      weightKg: 0,
      reps: 0,
      rir: 0,
      setNumber,
      exerciseId: entry.exerciseId,
      variantId: altChoice ?? undefined,
      skipped: true,
      skipReason: reason
    });
    setModal(null);
    onSaved();
  };

  if (prevSets === undefined) return null;

  const setup = setupSummary(gymSetting ?? undefined);

  return (
    <div className="stack">
      <div>
        <h2 className="wk-exname">
          {variant ? variant.nombre : codex?.nombre ?? entry.exerciseId}
        </h2>
        {variant && (
          <p className="small dim">
            Variante de {codex?.nombre}. Historial y cargas propios.
          </p>
        )}
        <div className="wk-prescription">
          <span>
            <b>
              {entry.sets}
              {entry.perSide ? ` ${PER_SIDE_LABEL[entry.perSide]}` : ""} ×{" "}
              {entry.repMin}–{entry.repMax}
            </b>{" "}
            reps
          </span>
          <span>
            RIR objetivo{" "}
            <b>{target.min === target.max ? target.min : `${target.min}–${target.max}`}</b>
          </span>
          <span>
            descanso <b>{formatRestRange(entry.restMinSec, entry.restMaxSec)}</b>
            {entry.restNote ? ` ${entry.restNote}` : ""}
          </span>
        </div>
        {entry.note && !compact && (
          <p className="small dim" style={{ marginTop: 4 }}>{entry.note}</p>
        )}
        {/* MI GIMNASIO: montaje precargado */}
        {setup && (
          <p className="wk-setup" role="note">
            <span aria-hidden="true">⚙ </span>
            {setup}
            {gymSetting?.setupNotes ? ` — ${gymSetting.setupNotes}` : ""}
          </p>
        )}
      </div>

      {/* Rendimiento anterior (de esta variante) */}
      {!compact && (
        <div className="wk-prev">
          {lastSessionSets.length > 0 ? (
            <>
              La vez anterior{variant ? " (misma variante)" : ""}:
              <div className="wk-prev__sets">
                {lastSessionSets.map((s) => (
                  <span key={s.id} className="wk-prev__set">
                    {s.skipped ? "omitida" : `${s.weightKg} kg × ${s.reps} @ RIR ${s.rir}`}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <span>
              {variant
                ? "Primera vez con esta variante: calibra la carga desde cero, sin heredar la de otra máquina."
                : "Primera vez en la campaña: busca la parte media del rango con RIR 2 real y técnica estable."}
            </span>
          )}
        </div>
      )}

      {/* Sugerencia: SIEMPRE explicada y nunca auto-aplicada */}
      {suggestion && (lastSessionSets.length > 0 || suggestion.kind === "molestia") && (
        <div
          className={`wk-suggest${
            suggestion.kind === "molestia" || suggestion.kind === "seguimiento"
              ? " wk-suggest--warn"
              : ""
          }`}
        >
          <p style={{ margin: 0 }}>
            {suggestion.kind === "subir" && (
              <>Sugerencia: <b>subir a {suggestion.weightKg} kg</b>. </>
            )}
            {suggestion.kind === "mantener" && (
              <>Sugerencia: <b>mantener {suggestion.weightKg} kg</b>. </>
            )}
            {suggestion.kind === "bajar" && (
              <>Sugerencia: <b>bajar a {suggestion.weightKg} kg</b> o mantener. </>
            )}
            {suggestion.kind === "seguimiento" && (
              <>Sugerencia: <b>mantener {suggestion.weightKg} kg</b>. </>
            )}
            {suggestion.motivo}
          </p>
          {suggestion.weightKg !== undefined &&
            suggestion.weightKg !== effWeight && (
              <PixelButton
                tone="gold"
                sans
                onClick={() => setWeight(suggestion.weightKg!)}
              >
                Aplicar {suggestion.weightKg} kg
              </PixelButton>
            )}
        </div>
      )}

      <NumberField
        label="Peso"
        hint={
          loadType === "corporal"
            ? "peso corporal · lastre en kg si añades"
            : loadType === "asistencia"
              ? "kg de asistencia de la máquina"
              : `kg · pasos de ${increment}`
        }
        placeholder={loadType === "externa" ? "kg" : undefined}
        error={weightError}
        value={effWeight}
        step={increment}
        decimals
        onChange={setWeight}
      />
      <NumberField
        label="Repeticiones"
        hint={`rango ${entry.repMin}–${entry.repMax}`}
        value={effReps}
        step={1}
        max={99}
        onChange={setReps}
      />
      <RirSelector value={rir} targetMin={target.min} targetMax={target.max} onChange={setRir} />

      <div className="wk-savezone">
        <PixelButton tone="primary" big block disabled={!canSave} onClick={save}>
          Guardar serie
        </PixelButton>
        <p className="save-note save-note--hint" role="status" aria-live="polite">
          {effWeight === null
            ? "Introduce el peso para poder guardar."
            : exSets.length > 0
              ? `${exSets.filter((s) => !s.skipped).length} de ${entry.sets} series guardadas`
              : ""}
        </p>
      </div>

      {/* Series ya registradas de esta etapa: toca una para corregirla */}
      {exSets.length > 0 && (
        <div className="wk-setlist">
          {exSets.map((s) => (
            <button
              key={s.id}
              type="button"
              className="wk-setlist__row wk-setlist__row--btn"
              onClick={() => setEditTarget(s)}
              aria-label={`Corregir serie ${s.setNumber}`}
            >
              <span>S{s.setNumber}</span>
              {s.skipped ? (
                <span>Omitida — {s.skipReason}</span>
              ) : (
                <b>
                  {s.weightKg} kg × {s.reps} @ RIR {s.rir}
                  {s.variantId ? " · variante" : ""}
                </b>
              )}
              <span className="wk-setlist__edit" aria-hidden="true">
                editar
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Acciones secundarias, lejos del botón principal */}
      <div className="wk-tools">
        <PixelButton tone="ghost" onClick={() => setModal("tecnica")}>
          Técnica
        </PixelButton>
        <PixelButton tone="ghost" onClick={() => setModal("alternativa")}>
          {variant ? "Cambiar de variante" : "Máquina ocupada: alternativas"}
        </PixelButton>
        <PixelButton tone="ghost" onClick={() => setModal("molestia")}>
          Molestia / dolor
        </PixelButton>
        <PixelButton tone="ghost" onClick={() => setModal("omitir")}>
          Omitir serie
        </PixelButton>
        <PixelButton
          tone="ghost"
          className="wk-tools__note"
          onClick={() => setModal("nota")}
        >
          {note ? "Nota guardada · editar" : "Añadir nota"}
        </PixelButton>
      </div>

      {/* Técnica (de la variante si tiene entrada propia en el Códice) */}
      <PixelModal
        open={modal === "tecnica"}
        title={variant ? variant.nombre : codex?.nombre ?? "Técnica"}
        onClose={() => setModal(null)}
      >
        {techniqueCodex && (
          <div className="stack stack--tight">
            {variant && !variantCodex && (
              <p className="small dim">
                Técnica del ejercicio principal ({codex?.nombre}): los puntos
                clave aplican igual a esta variante.
              </p>
            )}
            <div className="codex-section">
              <h3>Colocación</h3>
              <ul>
                {techniqueCodex.colocacion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="codex-section">
              <h3>Ejecución</h3>
              <ul>
                {techniqueCodex.ejecucion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="codex-section codex-section--errores">
              <h3>Errores frecuentes</h3>
              <ul>
                {techniqueCodex.errores.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <PixelButton tone="gold" block onClick={() => setModal(null)}>
              Entendido
            </PixelButton>
          </div>
        )}
      </PixelModal>

      {/* Variantes estructuradas */}
      <PixelModal
        open={modal === "alternativa"}
        title="Usar una variante"
        onClose={() => setModal(null)}
      >
        <div className="stack stack--tight">
          <p className="small dim">
            Variantes documentadas en el manual. Cada una guarda su propio
            historial de cargas: la serie cuenta igual para la misión.
          </p>
          {variantsOf(entry.exerciseId).map((v) => (
            <PixelButton
              key={v.id}
              tone={altChoice === v.id ? "gold" : "ghost"}
              sans
              block
              onClick={() => {
                setAltChoice(v.id);
                setWeightRaw(undefined);
                setRepsRaw(undefined);
                setModal(null);
              }}
            >
              {v.nombre}
            </PixelButton>
          ))}
          {adviceOf(entry.exerciseId).map((a) => (
            <p key={a} className="small dim">
              Consejo del manual: {a}
            </p>
          ))}
          {altChoice && (
            <PixelButton
              tone="ghost"
              block
              onClick={() => {
                setAltChoice(null);
                setWeightRaw(undefined);
                setRepsRaw(undefined);
                setModal(null);
              }}
            >
              Volver al ejercicio original
            </PixelButton>
          )}
        </div>
      </PixelModal>

      {/* Molestia */}
      <DiscomfortModal
        open={modal === "molestia"}
        onClose={() => setModal(null)}
        session={session}
        exerciseId={entry.exerciseId}
        variantId={altChoice ?? undefined}
        variants={variantsOf(entry.exerciseId).map((v) => v.id)}
        onAdapt={(variantId) => {
          if (variantId) {
            setAltChoice(variantId);
            setWeightRaw(undefined);
            setRepsRaw(undefined);
          }
          setModal(null);
        }}
        onStop={() => {
          setModal(null);
          onStopExercise();
        }}
      />

      {/* Omitir serie */}
      <PixelModal
        open={modal === "omitir"}
        title="Omitir esta serie"
        onClose={() => setModal(null)}
      >
        <div className="stack stack--tight">
          <p className="small dim">
            La serie quedará registrada como no realizada, con su motivo. Así
            la misión puede sellarse como adaptada, nunca como completada a
            medias.
          </p>
          {["Fatiga", "Sin tiempo", "Máquina no disponible", "Molestia"].map((r) => (
            <PixelButton key={r} tone="ghost" sans block onClick={() => skipSet(r)}>
              {r}
            </PixelButton>
          ))}
          <PixelButton tone="ghost" sans block onClick={() => setModal(null)}>
            Volver
          </PixelButton>
        </div>
      </PixelModal>

      {/* Nota opcional */}
      <NoteModal
        open={modal === "nota"}
        initial={note?.text ?? ""}
        exerciseName={codex?.nombre ?? entry.exerciseId}
        onClose={() => setModal(null)}
        onSave={async (text) => {
          await saveSessionNote(session, entry.exerciseId, text);
          setModal(null);
        }}
      />

      {/* Corregir una serie guardada */}
      <EditSetModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}

// ── Corregir una serie (editar / eliminar con confirmación) ─────────────────

export function EditSetModal({
  target,
  onClose
}: {
  target: SetLog | null;
  onClose: () => void;
}) {
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [rir, setRir] = useState(2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setWeight(target.weightKg);
      setReps(target.reps);
      setRir(target.rir);
      setConfirmDelete(false);
      setError(null);
    }
  }, [target]);

  if (!target) return null;

  const saveEdit = async () => {
    if (weight === null || reps === null || reps <= 0) {
      setError("Revisa peso y repeticiones antes de guardar.");
      return;
    }
    try {
      await updateSet(target.id, { weightKg: weight, reps, rir });
      onClose();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  const doDelete = async () => {
    await deleteSet(target.id);
    onClose();
  };

  return (
    <PixelModal open title={`Serie ${target.setNumber}`} onClose={onClose}>
      <div className="stack stack--tight">
        {target.skipped ? (
          <>
            <p className="small dim">
              Serie omitida ({target.skipReason}). Puedes eliminarla si fue un
              error; el progreso y la XP se recalculan.
            </p>
          </>
        ) : (
          <>
            <NumberField
              label="Peso"
              hint="kg"
              value={weight}
              step={0.25}
              decimals
              onChange={setWeight}
            />
            <NumberField
              label="Repeticiones"
              value={reps}
              step={1}
              max={99}
              onChange={setReps}
            />
            <RirSelector value={rir} targetMin={0} targetMax={4} onChange={setRir} />
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <PixelButton tone="primary" block onClick={saveEdit}>
              Guardar corrección
            </PixelButton>
          </>
        )}
        <p className="small dim">
          Progreso, volumen, hitos y XP se recalculan al corregir. Nada se
          duplica ni se borra en silencio.
        </p>
        {confirmDelete ? (
          <PixelButton tone="danger" block onClick={doDelete}>
            Confirmar: eliminar esta serie
          </PixelButton>
        ) : (
          <PixelButton tone="danger" block onClick={() => setConfirmDelete(true)}>
            Eliminar serie…
          </PixelButton>
        )}
        <PixelButton tone="ghost" sans block onClick={onClose}>
          Cancelar
        </PixelButton>
      </div>
    </PixelModal>
  );
}

// ── Nota breve por ejercicio ────────────────────────────────────────────────

function NoteModal({
  open,
  initial,
  exerciseName,
  onClose,
  onSave
}: {
  open: boolean;
  initial: string;
  exerciseName: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (open) setText(initial);
  }, [open, initial]);
  return (
    <PixelModal open={open} title="Nota del ejercicio" onClose={onClose}>
      <div className="stack stack--tight">
        <p className="small dim">
          {exerciseName} — agarre, asiento, sensaciones… (máx. 200)
        </p>
        <textarea
          className="note-input"
          maxLength={200}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="P. ej. «asiento en 4, agarre ancho»"
        />
        <PixelButton tone="gold" block onClick={() => onSave(text)}>
          Guardar nota
        </PixelButton>
        <PixelButton tone="ghost" sans block onClick={onClose}>
          Cancelar
        </PixelButton>
      </div>
    </PixelModal>
  );
}

// ── Molestia / dolor ────────────────────────────────────────────────────────

function DiscomfortModal({
  open,
  onClose,
  session,
  exerciseId,
  variantId,
  variants,
  onAdapt,
  onStop
}: {
  open: boolean;
  onClose: () => void;
  session: Session;
  exerciseId: string;
  variantId?: string;
  variants: string[];
  onAdapt: (variantId: string | null) => void;
  onStop: () => void;
}) {
  const [level, setLevel] = useState(3);

  const category =
    level <= 2
      ? {
          tone: "done" as const,
          texto: "Tolerable: puedes continuar con atención a la técnica."
        }
      : level <= 4
        ? {
            tone: "warn" as const,
            texto: "Modifica: baja carga 10–20 %, acorta el rango irritante o usa una variante."
          }
        : {
            tone: "danger" as const,
            texto: "Detén el ejercicio. No lo atravieses para cumplir la rutina."
          };

  const saveAnd = async (action: "continuar" | "adaptar" | "detener", alt?: string) => {
    await recordDiscomfort(session, exerciseId, level, action, undefined, variantId);
    if (action === "continuar") onClose();
    else if (action === "adaptar") onAdapt(alt ?? null);
    else onStop();
  };

  return (
    <PixelModal open={open} title="Molestia o dolor" onClose={onClose}>
      <div className="stack stack--tight">
        <NumberField
          label="Intensidad"
          hint="0 nada · 10 máximo"
          value={level}
          step={1}
          min={0}
          max={10}
          onChange={(v) => setLevel(v ?? 0)}
        />
        <div
          className={`inline-alert${
            category.tone === "danger"
              ? " inline-alert--danger"
              : category.tone === "done"
                ? " inline-alert--done"
                : ""
          }`}
          role="status"
        >
          {category.texto}
        </div>
        {level <= 2 && (
          <PixelButton tone="done" block onClick={() => saveAnd("continuar")}>
            Continuar con cuidado
          </PixelButton>
        )}
        {level >= 3 && level <= 4 && (
          <>
            {variants.map((vid) => (
              <PixelButton
                key={vid}
                tone="ghost"
                sans
                block
                onClick={() => saveAnd("adaptar", vid)}
              >
                Cambiar a: {variantById(vid)?.nombre ?? vid}
              </PixelButton>
            ))}
            <PixelButton tone="gold" block onClick={() => saveAnd("adaptar")}>
              Seguir con menos carga o rango
            </PixelButton>
          </>
        )}
        {level > 4 && (
          <PixelButton tone="danger" block onClick={() => saveAnd("detener")}>
            Detener este ejercicio
          </PixelButton>
        )}
        <p className="small dim">
          FORJA organiza el entrenamiento; no diagnostica. Si la molestia
          persiste o empeora, consulta a un fisioterapeuta o médico.
        </p>
      </div>
    </PixelModal>
  );
}

// ── Etapa completada ────────────────────────────────────────────────────────

function StageComplete({
  entries,
  exIndex,
  isLast,
  onNext,
  onExtra,
  onFinish
}: {
  entries: ExercisePrescription[];
  exIndex: number;
  isLast: boolean;
  onNext: () => void;
  onExtra: () => void;
  onFinish: () => void;
}) {
  const entry = entries[exIndex];
  const codex = codexById(entry.exerciseId);
  const next = !isLast ? entries[exIndex + 1] : undefined;
  const nextCodex = next ? codexById(next.exerciseId) : undefined;
  return (
    <div className="stack">
      <PixelFrame tone="gold">
        <div className="stack stack--tight">
          <span className="px-label px-label--gold">Etapa superada</span>
          <p>
            <b>{codex?.nombre}</b> — series prescritas completadas.
          </p>
          {next ? (
            <>
              <p className="small dim">
                Siguiente etapa: <b>{nextCodex?.nombre}</b> · {next.sets}
                {next.perSide ? ` ${PER_SIDE_LABEL[next.perSide]}` : ""} ×{" "}
                {next.repMin}–{next.repMax}
              </p>
              <PixelButton tone="primary" big block onClick={onNext}>
                Siguiente etapa
              </PixelButton>
            </>
          ) : (
            <PixelButton tone="primary" big block onClick={onFinish}>
              Terminar misión
            </PixelButton>
          )}
          <PixelButton tone="ghost" block onClick={onExtra}>
            Añadir serie extra (sin XP)
          </PixelButton>
        </div>
      </PixelFrame>
      <p className="small dim">
        El volumen extra no da XP: la Forja premia el plan cumplido, no el
        desgaste.
      </p>
    </div>
  );
}

// ── Descanso: campamento JRPG ───────────────────────────────────────────────

function RestView({
  timer,
  participant,
  entry,
  nextEntry,
  nextSetNumber,
  stageDone,
  prefs,
  onTimerChange,
  onUndoLast,
  onDone
}: {
  timer: TimerState;
  participant: Profile;
  entry: ExercisePrescription;
  nextEntry?: ExercisePrescription;
  nextSetNumber: number;
  stageDone: boolean;
  prefs: Prefs | undefined;
  onTimerChange: (t: TimerState) => void;
  onUndoLast: () => void;
  onDone: () => void;
}) {
  const codex = codexById(entry.exerciseId);
  const nextCodex = nextEntry ? codexById(nextEntry.exerciseId) : undefined;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const firedRef = useRef(false);
  const wakeLockRef = useRef<WakeLockHandle | null>(null);

  const sound = prefs?.sonido ?? false;
  const vibration = prefs?.vibracion ?? false;

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 250);
    const onVis = () => {
      setNowMs(Date.now());
      // Reintentar el wake lock al volver (el sistema lo libera en segundo plano).
      if (document.visibilityState === "visible" && prefs?.wakeLock) {
        void acquireWakeLock().then((h) => {
          wakeLockRef.current?.release();
          wakeLockRef.current = h;
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [prefs?.wakeLock]);

  // Wake Lock como mejora progresiva mientras dura el descanso.
  useEffect(() => {
    if (!prefs?.wakeLock) return;
    let cancelled = false;
    void acquireWakeLock().then((h) => {
      if (cancelled) h?.release();
      else wakeLockRef.current = h;
    });
    return () => {
      cancelled = true;
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [prefs?.wakeLock]);

  const ms = remainingMs(timer, nowMs);
  const finished = ms <= 0;

  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      if (sound) playRestEndBeep();
      if (vibration) vibrate([120, 60, 120]);
      if (prefs?.notificacionDescanso) {
        notifyRestEnd(codex?.nombre ?? "siguiente serie");
      }
    }
  }, [finished, sound, vibration, prefs?.notificacionDescanso, codex?.nombre]);

  // Indicación técnica: una línea de ejecución, estable por serie.
  const cue = useMemo(() => {
    const lines = [...(codex?.ejecucion ?? []), ...(codex?.colocacion ?? [])];
    if (lines.length === 0) return null;
    return lines[(nextSetNumber - 1) % lines.length];
  }, [codex, nextSetNumber]);

  const paused = timer.pausedRemainingMs !== null;
  const skip = useCallback(() => void onDone(), [onDone]);

  return (
    <div className="rest rest--camp">
      {/* Escena de campamento: el forjador descansa junto al fuego */}
      <div className="rest__scene" aria-hidden="true">
        <PxSprite
          frames={avatarFrames(participant.avatarId, "recuperando").frames}
          palette={PAL_C}
          fps={avatarFrames(participant.avatarId, "recuperando").fps}
          scale={3}
        />
        <PxSprite frames={BONFIRE_C} palette={PAL_C} fps={6} scale={3} />
      </div>

      <span className="px-label">
        {stageDone ? "Etapa superada · respira" : "Campamento breve"}
      </span>
      <div
        className={`rest__clock${finished ? " rest__clock--over" : ""}`}
        role="timer"
        aria-live="off"
        aria-label={`Descanso: ${formatClock(ms)}`}
      >
        {formatClock(ms)}
      </div>
      <div className="rest__bar">
        <XPBar
          tone="ember"
          value={Math.max(0, timer.totalSec * 1000 - ms)}
          max={timer.totalSec * 1000}
          label="Progreso del descanso"
        />
      </div>
      {finished && (
        <p className="small" style={{ color: "var(--done)" }} role="status">
          Descanso cumplido. Al yunque.
        </p>
      )}

      <div className="rest__controls">
        <PixelButton
          tone="ghost"
          onClick={() => onTimerChange(addSeconds(timer, 15, Date.now()))}
        >
          +15 s
        </PixelButton>
        <PixelButton
          tone="ghost"
          onClick={() =>
            onTimerChange(
              paused ? resume(timer, Date.now()) : pause(timer, Date.now())
            )
          }
        >
          {paused ? "Reanudar" : "Pausa"}
        </PixelButton>
        <PixelButton tone="primary" onClick={skip}>
          {stageDone ? "Continuar" : finished ? "Empezar serie" : "Saltar"}
        </PixelButton>
      </div>

      {!stageDone && (
        <p className="rest__next">
          Siguiente: <b>serie {nextSetNumber}</b> de {entry.sets} ·{" "}
          {entry.repMin}–{entry.repMax} reps
        </p>
      )}
      {stageDone && nextCodex && (
        <p className="rest__next">
          Próximo ejercicio: <b>{nextCodex.nombre}</b>
        </p>
      )}
      {cue && <p className="rest__cue">{cue}</p>}

      {/* Acción rápida de corrección, separada de los controles principales */}
      <div className="rest__undo">
        <PixelButton tone="ghost" sans block onClick={onUndoLast}>
          DESHACER ÚLTIMA SERIE
        </PixelButton>
      </div>
    </div>
  );
}

void CODEX;
