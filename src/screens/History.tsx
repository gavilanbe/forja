// Historial completo y navegable de entrenamientos. Lista con filtros
// (campaña, semana, estado, día, ejercicio, variante, fechas) y detalle por
// sesión con prescripción, series, adaptaciones, molestias, notas, XP e
// hitos, comparación con la sesión anterior y edición con recálculo.
// Paginado con índices de IndexedDB: no carga años de historial en memoria.

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Session, SetLog } from "../db/types";
import { useActiveProfile, useToday } from "../ui/hooks";
import { PixelButton, PixelFrame, StatusChip } from "../ui/Pixel";
import { dayById, DAYS } from "../data/routine";
import { codexById } from "../data/codex";
import { variantById, VARIANTS } from "../data/variants";
import { getCampaigns } from "../logic/campaigns";
import { sessionEntries } from "../logic/session";
import { EditSetModal } from "./Workout";

const PAGE = 30;

const STATUS_LABEL: Record<string, string> = {
  activa: "Activa",
  completada: "Completada",
  adaptada: "Adaptada",
  parcial: "Parcial",
  abandonada: "Abandonada"
};

const STATUS_TONE: Record<string, "done" | "warn" | "default" | "danger"> = {
  completada: "done",
  adaptada: "warn",
  parcial: "default",
  abandonada: "danger",
  activa: "default"
};

export function History() {
  const profile = useActiveProfile();
  const navigate = useNavigate();
  const [campaignId, setCampaignId] = useState("");
  const [status, setStatus] = useState("");
  const [dayId, setDayId] = useState("");
  const [week, setWeek] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [fromKey, setFromKey] = useState("");
  const [toKey, setToKey] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const campaigns = useLiveQuery(
    async () => (profile ? await getCampaigns(profile.id) : []),
    [profile?.id]
  );

  const result = useLiveQuery(async () => {
    if (!profile) return { rows: [] as Session[], hasMore: false };
    // Índice [profileId+dateKey] en orden inverso: lo más reciente primero.
    let coll = db.sessions
      .where("[profileId+dateKey]")
      .between(
        [profile.id, fromKey || "0000-00-00"],
        [profile.id, toKey || "9999-99-99"],
        true,
        true
      )
      .reverse();
    if (campaignId) coll = coll.and((s) => s.campaignId === campaignId);
    if (status) coll = coll.and((s) => s.status === status);
    if (dayId) coll = coll.and((s) => s.dayId === dayId);
    if (week) coll = coll.and((s) => s.week === Number(week));

    // Filtro por ejercicio/variante: primero las sesiones que lo contienen
    // (consulta indexada sobre setLogs), después el resto de filtros.
    if (exerciseId || variantId) {
      const sets = exerciseId
        ? await db.setLogs
            .where("[profileId+exerciseId]")
            .equals([profile.id, exerciseId])
            .toArray()
        : await db.setLogs.where("profileId").equals(profile.id).toArray();
      const ids = new Set(
        sets
          .filter((s) => !variantId || s.variantId === variantId)
          .map((s) => s.sessionId)
      );
      coll = coll.and((s) => ids.has(s.id));
    }

    const rows = await coll.limit(limit + 1).toArray();
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }, [profile?.id, campaignId, status, dayId, week, exerciseId, variantId, fromKey, toKey, limit]);

  if (!profile || !campaigns || result === undefined) {
    return <main className="screen" />;
  }

  const exerciseOptions = DAYS.flatMap((d) => d.entries.map((e) => e.exerciseId))
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((id) => ({ id, nombre: codexById(id)?.nombre ?? id }));

  return (
    <main className="screen">
      <h1 className="screen-title">Historial</h1>
      <div className="stack">
        <PixelFrame as="section">
          <div className="field-label">
            <span>Filtros</span>
          </div>
          <div className="filter-grid">
            <label className="filter-item">
              <span className="filter-item__label">Campaña</span>
              <div className="select-frame">
                <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                  <option value="">Todas</option>
                  {campaigns.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      Campaña {i + 1} ({c.startKey}){c.status === "activa" ? " · actual" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Estado</span>
              <div className="select-frame">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Todos</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Día de rutina</span>
              <div className="select-frame">
                <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
                  <option value="">Todos</option>
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Semana</span>
              <div className="select-frame">
                <select value={week} onChange={(e) => setWeek(e.target.value)}>
                  <option value="">Todas</option>
                  {[1, 2, 3, 4, 5, 6].map((w) => (
                    <option key={w} value={w}>Semana {w}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Ejercicio</span>
              <div className="select-frame">
                <select
                  value={exerciseId}
                  onChange={(e) => {
                    setExerciseId(e.target.value);
                    setVariantId("");
                  }}
                >
                  <option value="">Todos</option>
                  {exerciseOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Variante</span>
              <div className="select-frame">
                <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                  <option value="">Todas</option>
                  {(exerciseId
                    ? VARIANTS.filter((v) => v.parentExerciseId === exerciseId)
                    : []
                  ).map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Desde</span>
              <input
                type="date"
                className="date-input"
                value={fromKey}
                onChange={(e) => setFromKey(e.target.value)}
              />
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Hasta</span>
              <input
                type="date"
                className="date-input"
                value={toKey}
                onChange={(e) => setToKey(e.target.value)}
              />
            </label>
          </div>
        </PixelFrame>

        {result.rows.length === 0 ? (
          <p className="small dim">Sin sesiones con estos filtros.</p>
        ) : (
          <div className="stack stack--tight" role="list" aria-label="Sesiones">
            {result.rows.map((s) => {
              const day = dayById(s.dayId);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="listitem"
                  className="history-row"
                  onClick={() => navigate(`/historial/${s.id}`)}
                >
                  <div className="history-row__main">
                    <b>{s.prescriptionSnapshot?.dayName ?? day?.name ?? s.dayId}</b>
                    <span className="small dim">
                      {s.dateKey} · semana {s.week}
                      {s.unscheduled ? " · extra" : ""}
                    </span>
                  </div>
                  <div className="history-row__side">
                    <StatusChip tone={STATUS_TONE[s.status]} dot>
                      {STATUS_LABEL[s.status]}
                    </StatusChip>
                    {s.summary && (
                      <span className="small dim">
                        {s.summary.workingSets}/{s.summary.prescribedSets} series
                        {s.summary.xpGained ? ` · +${s.summary.xpGained} XP` : ""}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {result.hasMore && (
              <PixelButton tone="ghost" block onClick={() => setLimit((l) => l + PAGE)}>
                Cargar más
              </PixelButton>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Detalle de sesión ───────────────────────────────────────────────────────

export function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const today = useToday();
  void today;
  const [editTarget, setEditTarget] = useState<SetLog | null>(null);

  const data = useLiveQuery(async () => {
    if (!sessionId) return null;
    const session = await db.sessions.get(sessionId);
    if (!session) return null;
    const sets = (
      await db.setLogs.where("sessionId").equals(session.id).toArray()
    ).sort((a, b) => a.createdAt - b.createdAt || a.setNumber - b.setNumber);
    const discomforts = await db.discomforts
      .where("sessionId")
      .equals(session.id)
      .toArray();
    const notes = await db.notes.where("sessionId").equals(session.id).toArray();
    const events = await db.gameEvents
      .where("profileId")
      .equals(session.profileId)
      .and((e) => e.sessionId === session.id)
      .toArray();
    // Sesión anterior comparable: mismo día de rutina, fecha anterior.
    const prev = await db.sessions
      .where("[profileId+dayId]")
      .equals([session.profileId, session.dayId])
      .and(
        (s) =>
          s.dateKey < session.dateKey &&
          (s.status === "completada" || s.status === "adaptada" || s.status === "parcial")
      )
      .toArray();
    const previous = prev.sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    const prevSets = previous
      ? await db.setLogs.where("sessionId").equals(previous.id).toArray()
      : [];
    return { session, sets, discomforts, notes, events, previous, prevSets };
  }, [sessionId]);

  const entries = useMemo(
    () => (data?.session ? sessionEntries(data.session) : []),
    [data?.session]
  );

  if (data === undefined) return <main className="screen" />;
  if (!data) {
    return (
      <main className="screen">
        <div className="inline-alert inline-alert--danger" role="alert">
          No se encontró esta sesión.
        </div>
        <div style={{ marginTop: 16 }}>
          <PixelButton tone="gold" block onClick={() => navigate("/historial")}>
            Volver al historial
          </PixelButton>
        </div>
      </main>
    );
  }

  const { session, sets, discomforts, notes, events, previous, prevSets } = data;
  const day = dayById(session.dayId);
  const xpTotal = events.reduce((a, e) => a + e.xp, 0);
  const hitos = events.filter((e) => e.type === "hito");

  const bestOf = (list: SetLog[], exerciseId: string, variantId?: string) =>
    list
      .filter(
        (s) =>
          s.exerciseId === exerciseId &&
          !s.skipped &&
          s.reps > 0 &&
          (s.variantId ?? "") === (variantId ?? "")
      )
      .sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];

  return (
    <main className="screen">
      <h1 className="screen-title">
        {session.prescriptionSnapshot?.dayName ?? day?.name} · {session.dateKey}
      </h1>
      <div className="stack">
        <div className="row">
          <StatusChip tone={STATUS_TONE[session.status]} dot>
            {STATUS_LABEL[session.status]}
          </StatusChip>
          {session.unscheduled && <StatusChip tone="default">Extra · sin XP</StatusChip>}
          <span className="small dim">
            Semana {session.week}
            {session.prescriptionSnapshot
              ? ` · rutina v${session.prescriptionSnapshot.routineVersion}`
              : ""}
          </span>
        </div>

        {session.summary && (
          <div className="complete__grid">
            <div className="complete__cell">
              <b>{session.summary.workingSets}/{session.summary.prescribedSets}</b>
              <span>series de trabajo</span>
            </div>
            <div className="complete__cell">
              <b>{session.summary.exercisesProgressed}</b>
              <span>ejercicios progresados</span>
            </div>
            <div className="complete__cell">
              <b>{session.summary.avgRir ?? "—"}</b>
              <span>RIR medio</span>
            </div>
            <div className="complete__cell">
              <b>+{xpTotal}</b>
              <span>XP de la sesión</span>
            </div>
          </div>
        )}

        {/* Prescripción y series por ejercicio */}
        {entries.map((entry) => {
          const exSets = sets.filter((s) => s.exerciseId === entry.exerciseId);
          const prevBest = previous ? bestOf(prevSets, entry.exerciseId) : undefined;
          const nowBest = bestOf(sets, entry.exerciseId);
          return (
            <PixelFrame key={entry.exerciseId} as="section" tight>
              <div className="field-label">
                <span>{codexById(entry.exerciseId)?.nombre ?? entry.exerciseId}</span>
                <span className="field-label__hint">
                  prescrito {entry.sets} × {entry.repMin}–{entry.repMax}
                </span>
              </div>
              {exSets.length === 0 ? (
                <p className="small dim">Sin series registradas.</p>
              ) : (
                <div className="wk-setlist">
                  {exSets.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="wk-setlist__row wk-setlist__row--btn"
                      onClick={() => setEditTarget(s)}
                      aria-label={`Editar serie ${s.setNumber}`}
                    >
                      <span>S{s.setNumber}</span>
                      {s.skipped ? (
                        <span>Omitida — {s.skipReason}</span>
                      ) : (
                        <b>
                          {s.weightKg} kg × {s.reps} @ RIR {s.rir}
                          {s.variantId
                            ? ` · ${variantById(s.variantId)?.nombre ?? "variante"}`
                            : ""}
                        </b>
                      )}
                      <span className="wk-setlist__edit" aria-hidden="true">editar</span>
                    </button>
                  ))}
                </div>
              )}
              {prevBest && nowBest && (
                <p className="small dim" style={{ marginTop: 6 }}>
                  Comparación: {nowBest.weightKg} kg × {nowBest.reps} hoy frente a{" "}
                  {prevBest.weightKg} kg × {prevBest.reps} el {previous!.dateKey}
                  {nowBest.weightKg > prevBest.weightKg
                    ? " — subiste carga."
                    : nowBest.weightKg === prevBest.weightKg && nowBest.reps > prevBest.reps
                      ? " — sumaste repeticiones."
                      : "."}
                </p>
              )}
            </PixelFrame>
          );
        })}

        {/* Adaptaciones */}
        {session.summary?.adaptaciones && session.summary.adaptaciones.length > 0 && (
          <section className="panel" aria-label="Adaptaciones">
            <div className="panel__kicker"><span>Adaptaciones</span></div>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              {session.summary.adaptaciones.map((a, i) => (
                <li key={i}>
                  · <b>{codexById(a.exerciseId)?.nombre ?? "Sesión"}</b>: {a.detalle}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Molestias */}
        {discomforts.length > 0 && (
          <section className="panel" aria-label="Molestias">
            <div className="panel__kicker"><span>Molestias registradas</span></div>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              {discomforts.map((d) => (
                <li key={d.id}>
                  · {codexById(d.exerciseId)?.nombre ?? d.exerciseId} — nivel {d.level},{" "}
                  {d.action}
                  {d.incidentStatus ? ` (incidencia: ${d.incidentStatus})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notas */}
        {notes.length > 0 && (
          <section className="panel" aria-label="Notas">
            <div className="panel__kicker"><span>Notas</span></div>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              {notes.map((n) => (
                <li key={n.id}>
                  · {n.exerciseId ? `${codexById(n.exerciseId)?.nombre}: ` : ""}
                  {n.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Hitos y XP */}
        {hitos.length > 0 && (
          <section className="panel" aria-label="Hitos">
            <div className="panel__kicker"><span>Hitos</span></div>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              {hitos.map((h) => (
                <li key={h.id}>· {h.label} (+{h.xp} XP)</li>
              ))}
            </ul>
          </section>
        )}

        <p className="small dim">
          Al editar o eliminar una serie se recalculan resumen, hitos y XP de
          esta sesión. Nada se duplica; los cambios quedan guardados en este
          dispositivo.
        </p>
        <PixelButton tone="ghost" block onClick={() => navigate("/historial")}>
          Volver al historial
        </PixelButton>
      </div>

      <EditSetModal target={editTarget} onClose={() => setEditTarget(null)} />
    </main>
  );
}
