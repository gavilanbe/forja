// Entrenamiento activo: una etapa (ejercicio) cada vez, registro de series
// local-first y temporizador de descanso con timestamp absoluto persistido.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, touch } from "../db/db";
import type { Session, SetLog, TimerState } from "../db/types";
import { dayById, scheduleById } from "../data/routine";
import type { ExercisePrescription } from "../data/types";
import { codexById } from "../data/codex";
import { useActiveProfile, usePrefs, useToday } from "../ui/hooks";
import { PixelButton, PixelFrame, PixelModal, StatusChip, XPBar } from "../ui/Pixel";
import { NumberField, RirSelector } from "../ui/controls";
import {
  completeSession,
  loadTimer,
  logSet,
  recordDiscomfort,
  saveSessionNote,
  saveTimer,
  setExerciseIndex,
  startSession
} from "../logic/session";
import { defaultIncrement, suggest, type Suggestion } from "../logic/progression";
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

type Phase =
  | { kind: "cargando" }
  | { kind: "sin-mision" }
  | { kind: "serie" }
  | { kind: "descanso"; timer: TimerState }
  | { kind: "etapa-completa" };

const PER_SIDE_LABEL = { lado: "por lado", brazo: "por brazo", pierna: "por pierna" };

export function Workout() {
  const navigate = useNavigate();
  const profile = useActiveProfile();
  const prefs = usePrefs(profile?.id);
  const today = useToday();
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "cargando" });
  const [exitOpen, setExitOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const initRef = useRef(false);

  // Arranque: recuperar sesión activa o crear la de hoy.
  useEffect(() => {
    if (!profile || initRef.current) return;
    initRef.current = true;
    (async () => {
      let s =
        (await db.sessions
          .where("[profileId+status]")
          .equals([profile.id, "activa"])
          .first()) ?? null;
      if (!s) {
        const schedule = scheduleById(profile.scheduleId);
        let dayId = schedule.week[weekdayIndex(today)];
        let extra = false;
        if (!dayId) {
          // Día extra: unirse a la sesión de Nahuel (?dia=...), sin XP.
          const requested = new URLSearchParams(window.location.hash.split("?")[1]).get("dia");
          if (requested && dayById(requested)) {
            dayId = requested;
            extra = true;
          } else {
            setPhase({ kind: "sin-mision" });
            return;
          }
        }
        // Prólogo: entrenar antes del inicio no finge misión de campaña.
        if (campaignWeekOf(profile.campaignStart, today) < 1) extra = true;
        const done = await db.sessions
          .where("[profileId+dateKey]")
          .equals([profile.id, dateKeyOf(today)])
          .and((x) => x.status === "completada" || x.status === "adaptada")
          .first();
        if (done) {
          navigate(`/mision/resumen/${done.id}`, { replace: true });
          return;
        }
        s = await startSession(profile, dayId, today, extra);
      }
      setSession(s);
      // Recuperar temporizador persistido si pertenece a esta sesión.
      const t = await loadTimer();
      if (t && t.sessionId === s.id && !isFinished(t, Date.now())) {
        setPhase({ kind: "descanso", timer: t });
      } else {
        if (t && t.sessionId !== s.id) await saveTimer(null);
        setPhase({ kind: "serie" });
      }
    })();
  }, [profile, navigate, today]);

  const day = session ? dayById(session.dayId) : undefined;
  const sets = useLiveQuery(
    async () =>
      session
        ? await db.setLogs.where("sessionId").equals(session.id).sortBy("createdAt")
        : [],
    [session?.id]
  );

  if (!profile || !session || !day || sets === undefined) {
    if (phase.kind === "sin-mision") return <NoMission />;
    return <main className="screen" />;
  }

  const exIndex = Math.min(session.currentExerciseIndex, day.entries.length - 1);
  const entry = day.entries[exIndex];
  const exSets = sets.filter((s) => s.exerciseId === entry.exerciseId);
  const nextSetNumber = exSets.length + 1;
  const stageDone = exSets.length >= entry.sets;
  const isLastStage = exIndex >= day.entries.length - 1;
  const totalPrescribed = day.entries.reduce((a, e) => a + e.sets, 0);
  const totalLogged = sets.filter((s) => !s.skipped).length;

  const goToStage = async (index: number) => {
    await setExerciseIndex(session, index);
    const fresh = await db.sessions.get(session.id);
    if (fresh) setSession(fresh);
    setPhase({ kind: "serie" });
  };

  const handleFinish = async (abandon = false) => {
    await saveTimer(null);
    if (abandon) {
      const fresh = await db.sessions.get(session.id);
      if (fresh) await db.sessions.put(touch({ ...fresh, status: "abandonada" }));
      navigate("/", { replace: true });
      return;
    }
    const discomforts = await db.discomforts
      .where("sessionId")
      .equals(session.id)
      .toArray();
    const adapted =
      discomforts.some((d) => d.action !== "continuar") ||
      sets.some((s) => s.skipped);
    const result = await completeSession(session, profile, adapted);
    navigate(`/mision/resumen/${result.session.id}`, { replace: true });
  };

  return (
    <>
      <header className="wk-header">
        <div>
          <div className="wk-header__title">
            {day.name}
            {session.unscheduled ? " · extra" : ""}
          </div>
          <div className="wk-header__sub">
            Etapa {exIndex + 1} de {day.entries.length} · Serie{" "}
            {Math.min(nextSetNumber, entry.sets)} de {entry.sets}
          </div>
          <div className="wk-progress" aria-hidden="true">
            {day.entries.map((_, i) => (
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

      <main className="screen screen--workout">
        {phase.kind === "descanso" ? (
          <RestView
            timer={phase.timer}
            entry={entry}
            nextSetNumber={Math.min(nextSetNumber, entry.sets)}
            stageDone={stageDone}
            sound={prefs?.sonido ?? false}
            vibration={prefs?.vibracion ?? false}
            onTimerChange={(t) => {
              setPhase({ kind: "descanso", timer: t });
              void saveTimer(t);
            }}
            onDone={async () => {
              await saveTimer(null);
              setPhase(stageDone ? { kind: "etapa-completa" } : { kind: "serie" });
            }}
          />
        ) : phase.kind === "etapa-completa" || (phase.kind === "serie" && stageDone) ? (
          <StageComplete
            day={day}
            exIndex={exIndex}
            isLast={isLastStage}
            onNext={() => goToStage(exIndex + 1)}
            onExtra={() => setPhase({ kind: "serie" })}
            onFinish={() => setFinishOpen(true)}
          />
        ) : (
          <SetLogger
            key={`${entry.exerciseId}-${nextSetNumber}`}
            session={session}
            entry={entry}
            exSets={exSets}
            setNumber={nextSetNumber}
            profileIncrements={{
              compuesto: prefs?.incrementoCompuesto ?? 2.5,
              aislamiento: prefs?.incrementoAislamiento ?? 1.25
            }}
            onSaved={async (isLastSet) => {
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
              await saveTimer(timer);
              setPhase({ kind: "descanso", timer });
              void isLastSet;
            }}
            onStopExercise={async () => {
              await saveTimer(null);
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
          <PixelButton tone="danger" block onClick={() => handleFinish(true)}>
            Abandonar (descartar misión)
          </PixelButton>
        </div>
      </PixelModal>

      {/* Confirmación de fin */}
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
  entry,
  exSets,
  setNumber,
  profileIncrements,
  onSaved,
  onStopExercise
}: {
  session: Session;
  entry: ExercisePrescription;
  exSets: SetLog[];
  setNumber: number;
  profileIncrements: { compuesto: number; aislamiento: number };
  onSaved: (isLastSet: boolean) => void;
  onStopExercise: () => void;
}) {
  const codex = codexById(entry.exerciseId);
  const prevSets = useLiveQuery(
    async () =>
      await db.setLogs
        .where("[profileId+dayId+exerciseId]")
        .equals([session.profileId, session.dayId, entry.exerciseId])
        .and((s) => s.sessionId !== session.id)
        .sortBy("createdAt"),
    [session.profileId, session.dayId, entry.exerciseId, session.id]
  );
  const prevDiscomfort = useLiveQuery(
    async () =>
      await db.discomforts
        .where("[profileId+exerciseId]")
        .equals([session.profileId, entry.exerciseId])
        .and((d) => d.sessionId !== session.id && d.level >= 3)
        .count(),
    [session.profileId, entry.exerciseId, session.id]
  );

  const lastSessionSets = useMemo(() => {
    if (!prevSets || prevSets.length === 0) return [];
    const lastId = prevSets[prevSets.length - 1].sessionId;
    return prevSets.filter((s) => s.sessionId === lastId);
  }, [prevSets]);

  const increment = defaultIncrement(
    entry,
    profileIncrements.compuesto,
    profileIncrements.aislamiento
  );

  const suggestion: Suggestion | null = useMemo(() => {
    if (prevSets === undefined || prevDiscomfort === undefined) return null;
    if (lastSessionSets.length === 0 && !prevDiscomfort) return null;
    return suggest({
      prescription: entry,
      lastSets: lastSessionSets,
      hadDiscomfort: (prevDiscomfort ?? 0) > 0,
      incrementKg: increment
    });
  }, [entry, lastSessionSets, prevDiscomfort, prevSets, increment]);

  const target = entry.rirPerSet[Math.min(setNumber - 1, entry.rirPerSet.length - 1)].rir;

  // `undefined` = sin tocar (hereda), `null` = borrado a mano (campo vacío).
  const [weight, setWeight] = useState<number | null | undefined>(undefined);
  const [reps, setReps] = useState<number | null | undefined>(undefined);
  const [rir, setRir] = useState<number>(target.max);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [modal, setModal] = useState<
    null | "tecnica" | "alternativa" | "molestia" | "omitir" | "nota"
  >(null);
  const [altChoice, setAltChoice] = useState<string | null>(null);

  const note = useLiveQuery(
    async () =>
      (await db.notes
        .where("[sessionId+exerciseId]")
        .equals([session.id, entry.exerciseId])
        .first()) ?? null,
    [session.id, entry.exerciseId]
  );

  const loadType = loadTypeOf(entry.exerciseId);

  // Valores heredados: última serie de esta sesión → sugerencia → sesión
  // anterior. Sin historial, el peso queda VACÍO (nunca un falso "0 kg") y
  // las repeticiones apuntan al punto medio del rango prescrito.
  const inheritedWeight: number | null =
    exSets.length > 0
      ? exSets[exSets.length - 1].weightKg
      : suggestion?.weightKg ??
        (lastSessionSets.length > 0
          ? lastSessionSets[lastSessionSets.length - 1].weightKg
          : loadType === "externa"
            ? null
            : 0);
  const inheritedReps: number =
    exSets.length > 0
      ? exSets[exSets.length - 1].reps
      : lastSessionSets.length > 0
        ? Math.min(lastSessionSets[lastSessionSets.length - 1].reps, entry.repMax)
        : midReps(entry.repMin, entry.repMax);

  const effWeight = weight === undefined ? inheritedWeight : weight;
  const effReps = reps === undefined ? inheritedReps : reps;

  const weightOk = weightValid(entry.exerciseId, effWeight);
  const weightError =
    effWeight === 0 && loadType === "externa"
      ? "0 kg no es una carga válida aquí: introduce el peso de trabajo."
      : null;
  const canSave = !saving && weightOk && effReps !== null && effReps > 0;

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
        source: altChoice ? "alternativa" : "normal",
        altExerciseId: altChoice ?? undefined
      });
      setSavedFlash(true);
      setTimeout(() => onSaved(setNumber >= entry.sets), 350);
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
      skipped: true,
      skipReason: reason
    });
    setModal(null);
    onSaved(setNumber >= entry.sets);
  };

  if (prevSets === undefined) return null;

  return (
    <div className="stack">
      <div>
        <h2 className="wk-exname">{codex?.nombre ?? entry.exerciseId}</h2>
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
        {entry.note && <p className="small dim" style={{ marginTop: 4 }}>{entry.note}</p>}
        {altChoice && (
          <div style={{ marginTop: "var(--s2)" }}>
            <StatusChip tone="blue" dot>
              Alternativa: {altChoice}
            </StatusChip>
          </div>
        )}
      </div>

      {/* Rendimiento anterior */}
      <div className="wk-prev">
        {lastSessionSets.length > 0 ? (
          <>
            La vez anterior:
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
            Primera vez en la campaña: busca la parte media del rango con RIR 2
            real y técnica estable.
          </span>
        )}
      </div>

      {suggestion && lastSessionSets.length > 0 && (
        <div
          className={`wk-suggest${suggestion.kind === "molestia" ? " wk-suggest--warn" : ""}`}
        >
          {suggestion.kind === "subir" && (
            <>
              Sugerencia: <b>sube a {suggestion.weightKg} kg</b>. {suggestion.motivo}
            </>
          )}
          {suggestion.kind === "mantener" && (
            <>
              Sugerencia: <b>mantén {suggestion.weightKg} kg</b>. {suggestion.motivo}
            </>
          )}
          {suggestion.kind === "bajar" && (
            <>
              Sugerencia: <b>baja a {suggestion.weightKg} kg</b> o mantén.{" "}
              {suggestion.motivo}
            </>
          )}
          {suggestion.kind === "molestia" && <>{suggestion.motivo}</>}
          {suggestion.kind === "sin-datos" && <>{suggestion.motivo}</>}
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

      <div>
        <PixelButton tone="primary" big block disabled={!canSave} onClick={save}>
          Guardar serie
        </PixelButton>
        <p
          className={`save-note${savedFlash ? "" : " save-note--hint"}`}
          role="status"
          aria-live="polite"
        >
          {savedFlash
            ? "Serie guardada en este dispositivo"
            : effWeight === null
              ? "Introduce el peso para poder guardar."
              : exSets.length > 0
                ? `${exSets.filter((s) => !s.skipped).length} de ${entry.sets} series guardadas`
                : ""}
        </p>
      </div>

      {/* Series ya registradas de esta etapa */}
      {exSets.length > 0 && (
        <div className="wk-setlist">
          {exSets.map((s) => (
            <div key={s.id} className="wk-setlist__row">
              <span>S{s.setNumber}</span>
              {s.skipped ? (
                <span>Omitida — {s.skipReason}</span>
              ) : (
                <b>
                  {s.weightKg} kg × {s.reps} @ RIR {s.rir}
                </b>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Acciones secundarias, lejos del botón principal */}
      <div className="wk-tools">
        <PixelButton tone="ghost" onClick={() => setModal("tecnica")}>
          Técnica
        </PixelButton>
        <PixelButton tone="ghost" onClick={() => setModal("alternativa")}>
          Máquina ocupada: alternativas
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

      {/* Técnica */}
      <PixelModal
        open={modal === "tecnica"}
        title={codex?.nombre ?? "Técnica"}
        onClose={() => setModal(null)}
      >
        {codex && (
          <div className="stack stack--tight">
            <div className="codex-section">
              <h3>Colocación</h3>
              <ul>
                {codex.colocacion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="codex-section">
              <h3>Ejecución</h3>
              <ul>
                {codex.ejecucion.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="codex-section codex-section--errores">
              <h3>Errores frecuentes</h3>
              <ul>
                {codex.errores.map((c, i) => (
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

      {/* Alternativa / máquina ocupada */}
      <PixelModal
        open={modal === "alternativa"}
        title="Usar una alternativa"
        onClose={() => setModal(null)}
      >
        <div className="stack stack--tight">
          <p className="small dim">
            Alternativas documentadas en el manual. Las series cuentan igual.
          </p>
          {(codex?.alternativas ?? []).map((alt) => (
            <PixelButton
              key={alt}
              tone={altChoice === alt ? "gold" : "ghost"}
              sans
              block
              onClick={() => {
                setAltChoice(alt);
                setModal(null);
              }}
            >
              {alt}
            </PixelButton>
          ))}
          {altChoice && (
            <PixelButton
              tone="ghost"
              block
              onClick={() => {
                setAltChoice(null);
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
        alternatives={codex?.alternativas ?? []}
        onAdapt={(alt) => {
          if (alt) setAltChoice(alt);
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
            La serie quedará registrada como no realizada, con su motivo.
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
    </div>
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
  alternatives,
  onAdapt,
  onStop
}: {
  open: boolean;
  onClose: () => void;
  session: Session;
  exerciseId: string;
  alternatives: string[];
  onAdapt: (alt: string | null) => void;
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
            texto: "Modifica: baja carga 10–20 %, acorta el rango irritante o usa la alternativa."
          }
        : {
            tone: "danger" as const,
            texto: "Detén el ejercicio. No lo atravieses para cumplir la rutina."
          };

  const saveAnd = async (action: "continuar" | "adaptar" | "detener", alt?: string) => {
    await recordDiscomfort(session, exerciseId, level, action);
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
            {alternatives.map((alt) => (
              <PixelButton
                key={alt}
                tone="ghost"
                sans
                block
                onClick={() => saveAnd("adaptar", alt)}
              >
                Cambiar a: {alt}
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
  day,
  exIndex,
  isLast,
  onNext,
  onExtra,
  onFinish
}: {
  day: NonNullable<ReturnType<typeof dayById>>;
  exIndex: number;
  isLast: boolean;
  onNext: () => void;
  onExtra: () => void;
  onFinish: () => void;
}) {
  const entry = day.entries[exIndex];
  const codex = codexById(entry.exerciseId);
  const next = !isLast ? day.entries[exIndex + 1] : undefined;
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

// ── Descanso ────────────────────────────────────────────────────────────────

function RestView({
  timer,
  entry,
  nextSetNumber,
  stageDone,
  sound,
  vibration,
  onTimerChange,
  onDone
}: {
  timer: TimerState;
  entry: ExercisePrescription;
  nextSetNumber: number;
  stageDone: boolean;
  sound: boolean;
  vibration: boolean;
  onTimerChange: (t: TimerState) => void;
  onDone: () => void;
}) {
  const codex = codexById(entry.exerciseId);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 250);
    const onVis = () => setNowMs(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const ms = remainingMs(timer, nowMs);
  const finished = ms <= 0;

  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      if (sound) playRestEndBeep();
      if (vibration) vibrate([120, 60, 120]);
    }
  }, [finished, sound, vibration]);

  // Indicación técnica: una línea de ejecución, estable por serie.
  const cue = useMemo(() => {
    const lines = [...(codex?.ejecucion ?? []), ...(codex?.colocacion ?? [])];
    if (lines.length === 0) return null;
    return lines[(nextSetNumber - 1) % lines.length];
  }, [codex, nextSetNumber]);

  const paused = timer.pausedRemainingMs !== null;

  const skip = useCallback(() => void onDone(), [onDone]);

  return (
    <div className="rest">
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
      {cue && <p className="rest__cue">{cue}</p>}
    </div>
  );
}
