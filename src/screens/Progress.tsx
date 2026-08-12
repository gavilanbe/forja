// Progreso: carga por ejercicio Y VARIANTE, récords, adherencia semanal,
// volumen planificado frente a realizado, RIR, molestias con estado de
// incidencia, comparación entre campañas, filtros temporales y CSV.
// Todo desde IndexedDB con consultas indexadas, todo en lenguaje pixel.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useActiveProfile, useToday } from "../ui/hooks";
import { PixelButton, PixelFrame, XPBar } from "../ui/Pixel";
import { campaignPhase } from "../logic/campaign";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { G_STAR } from "../ui/arcade/icons";
import { FLAME_OFF_C, FLAME_ON_C } from "../ui/arcade/props";
import { discTower, heatMeter, rackBar } from "../ui/arcade/dataviz";
import { CODEX, codexById } from "../data/codex";
import { CAMPAIGN_WEEKS } from "../data/routine";
import { summarizeWeeks } from "../logic/streak";
import { VARIANTS, variantById } from "../data/variants";
import { campaignStats, getCampaigns, type CampaignStats } from "../logic/campaigns";
import { exportSetsCsv, downloadCsv } from "../logic/csv";

const SELECTED_KEY = "forja:progreso-ejercicio";

/** Rangos temporales del filtro. */
const RANGES = [
  { id: "todo", label: "Todo", days: null },
  { id: "4s", label: "4 semanas", days: 28 },
  { id: "12s", label: "12 semanas", days: 84 }
] as const;

export function Progress() {
  const navigate = useNavigate();
  const profile = useActiveProfile();
  const today = useToday();
  const [exerciseId, setExerciseId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SELECTED_KEY);
    } catch {
      return null;
    }
  });
  const [variantId, setVariantId] = useState<string>("");
  const [rangeId, setRangeId] = useState<(typeof RANGES)[number]["id"]>("todo");
  const [campaignSel, setCampaignSel] = useState<string>("activa");

  const campaigns = useLiveQuery(
    async () => (profile ? await getCampaigns(profile.id) : []),
    [profile?.id]
  );

  const data = useLiveQuery(async () => {
    if (!profile) return undefined;
    const [sessions, sets, discomforts, hitos] = await Promise.all([
      db.sessions.where("profileId").equals(profile.id).toArray(),
      db.setLogs.where("profileId").equals(profile.id).toArray(),
      db.discomforts.where("profileId").equals(profile.id).reverse().sortBy("createdAt"),
      db.gameEvents
        .where("[profileId+type]")
        .equals([profile.id, "hito"])
        .reverse()
        .sortBy("createdAt")
    ]);
    return { sessions, sets, discomforts, hitos };
  }, [profile?.id]);

  const comparison = useLiveQuery(async () => {
    if (!profile || !campaigns || campaigns.length < 2) return [];
    const stats: CampaignStats[] = [];
    for (const c of campaigns) stats.push(await campaignStats(c, today));
    return stats;
  }, [profile?.id, campaigns?.length]);

  const exerciseIdsWithData = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.sets.filter((s) => !s.skipped).map((s) => s.exerciseId));
  }, [data]);

  const mostRecentExerciseId = useMemo(() => {
    if (!data) return null;
    let best: { id: string; at: number } | null = null;
    for (const s of data.sets) {
      if (s.skipped) continue;
      if (!best || s.createdAt > best.at) best = { id: s.exerciseId, at: s.createdAt };
    }
    return best?.id ?? null;
  }, [data]);

  const effectiveExerciseId =
    exerciseId && exerciseIdsWithData.has(exerciseId)
      ? exerciseId
      : mostRecentExerciseId;

  const chooseExercise = (id: string) => {
    setExerciseId(id);
    setVariantId("");
    try {
      sessionStorage.setItem(SELECTED_KEY, id);
    } catch {
      /* sin sessionStorage no pasa nada */
    }
  };

  if (!profile || !data || !campaigns) return <main className="screen" />;

  const activeCampaign = campaigns.find((c) => c.status === "activa");
  const scopeCampaignId =
    campaignSel === "todas"
      ? null
      : campaignSel === "activa"
        ? activeCampaign?.id ?? null
        : campaignSel;

  const range = RANGES.find((r) => r.id === rangeId)!;
  const minKey = range.days
    ? new Date(today.getTime() - range.days * 86_400_000).toISOString().slice(0, 10)
    : null;

  // Ámbito: campaña seleccionada + rango temporal. Nunca se mezclan campañas.
  const allSessions = data.sessions.filter(
    (s) =>
      (!scopeCampaignId || s.campaignId === scopeCampaignId) &&
      (!minKey || s.dateKey >= minKey)
  );
  const sessionIds = new Set(allSessions.map((s) => s.id));
  const sets = data.sets.filter((s) => sessionIds.has(s.sessionId));
  const discomforts = data.discomforts;
  const hitos = data.hitos.filter((h) => !scopeCampaignId || h.campaignId === scopeCampaignId);

  const finished = allSessions
    .filter(
      (s) =>
        s.status === "completada" || s.status === "adaptada" || s.status === "parcial"
    )
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const isEmpty = finished.length === 0 && sets.length === 0;

  // Progresión del ejercicio+variante elegidos: mejor serie por sesión.
  // Variantes con cargas no comparables JAMÁS se mezclan en la misma serie.
  const relevantSets = sets.filter(
    (x) =>
      x.exerciseId === effectiveExerciseId &&
      (x.variantId ?? "") === variantId &&
      !x.skipped &&
      x.reps > 0
  );
  const exPoints = finished
    .map((session) => {
      const inSession = relevantSets.filter((x) => x.sessionId === session.id);
      if (inSession.length === 0) return null;
      const top = inSession.sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
      const [, m, d] = session.dateKey.split("-");
      return { label: `${d}/${m}`, value: top.weightKg, reps: top.reps, rir: top.rir };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Récords de carga y de repeticiones del ejercicio+variante.
  const recordWeight = relevantSets.reduce(
    (best, s) => (s.weightKg > (best?.weightKg ?? -1) ? s : best),
    null as (typeof relevantSets)[number] | null
  );
  const recordReps = relevantSets.reduce(
    (best, s) => (s.reps > (best?.reps ?? -1) ? s : best),
    null as (typeof relevantSets)[number] | null
  );

  const campaignStartForWeeks =
    campaignSel === "activa" || !scopeCampaignId
      ? profile.campaignStart
      : campaigns.find((c) => c.id === scopeCampaignId)?.startKey ?? profile.campaignStart;

  const weeks = summarizeWeeks(
    allSessions.filter((s) => !s.unscheduled),
    campaignStartForWeeks,
    profile.weeklyTarget,
    today,
    CAMPAIGN_WEEKS,
    { joinedKey: activeCampaign?.joinedKey }
  );

  // Volumen semanal: planificado frente a realizado.
  const volumePoints = weeks.map((w) => {
    const weekSessions = finished.filter((s) => s.week === w.week);
    const done = sets.filter(
      (x) => weekSessions.some((s) => s.id === x.sessionId) && !x.skipped && x.reps > 0
    ).length;
    const planned = weekSessions.reduce(
      (a, s) => a + (s.summary?.prescribedSets ?? 0),
      0
    );
    return { label: `S${w.week}`, value: done, planned };
  });

  const rirPoints = finished
    .map((session) => {
      const inSession = sets.filter(
        (x) => x.sessionId === session.id && !x.skipped && x.reps > 0
      );
      if (inSession.length === 0) return null;
      const avg =
        Math.round((inSession.reduce((a, x) => a + x.rir, 0) / inSession.length) * 10) / 10;
      const [, m, d] = session.dateKey.split("-");
      return { label: `${d}/${m}`, value: avg };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const phase = campaignPhase(profile.campaignStart, today);
  const currentWeekNum =
    phase.kind === "activa" ? phase.week : phase.kind === "forjado" ? CAMPAIGN_WEEKS : 1;
  const weekNow = weeks[currentWeekNum - 1];
  const weekSets = sets.filter((x) => {
    const sess = allSessions.find((s) => s.id === x.sessionId);
    return sess && sess.week === currentWeekNum && !x.skipped && x.reps > 0;
  }).length;

  const selectedName = effectiveExerciseId
    ? variantId
      ? variantById(variantId)?.nombre
      : codexById(effectiveExerciseId)?.nombre
    : null;
  const variantOptions = effectiveExerciseId
    ? VARIANTS.filter((v) => v.parentExerciseId === effectiveExerciseId).filter((v) =>
        data.sets.some((s) => s.variantId === v.id)
      )
    : [];

  const doExportCsv = async () => {
    const csv = await exportSetsCsv(profile.id, minKey ? { fromKey: minKey } : {});
    downloadCsv(`forja-series-${profile.name.toLowerCase()}.csv`, csv);
  };

  return (
    <main className="screen">
      <h1 className="screen-title">Progreso</h1>

      {isEmpty ? (
        <PixelFrame>
          <div className="camp-card">
            <div className="mission-card__kicker">Historial vacío</div>
            <p style={{ marginBottom: 8 }}>
              Aún no hay misiones selladas. La primera serie que guardes
              empezará a escribir tu crónica.
            </p>
            <p className="small dim" style={{ marginBottom: 12 }}>
              Completa la misión de hoy y aquí verás cargas, adherencia y RIR.
            </p>
            <PixelButton tone="primary" block onClick={() => navigate("/")}>
              Ir a la misión de hoy
            </PixelButton>
          </div>
        </PixelFrame>
      ) : (
        <div className="stack">
          {/* Filtros: campaña y rango temporal */}
          <div className="filter-grid" role="group" aria-label="Filtros de progreso">
            <label className="filter-item">
              <span className="filter-item__label">Campaña</span>
              <div className="select-frame">
                <select value={campaignSel} onChange={(e) => setCampaignSel(e.target.value)}>
                  <option value="activa">Actual</option>
                  <option value="todas">Todas</option>
                  {campaigns
                    .filter((c) => c.status === "archivada")
                    .map((c, i) => (
                      <option key={c.id} value={c.id}>
                        Campaña {i + 1} ({c.startKey})
                      </option>
                    ))}
                </select>
              </div>
            </label>
            <label className="filter-item">
              <span className="filter-item__label">Periodo</span>
              <div className="select-frame">
                <select
                  value={rangeId}
                  onChange={(e) => setRangeId(e.target.value as typeof rangeId)}
                >
                  {RANGES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          {/* 1 · Resumen de la semana */}
          <section className="panel" aria-label="Resumen de la semana">
            <div className="panel__kicker">
              <span>
                {phase.kind === "forjado" ? "Último capítulo" : "Esta semana"}
              </span>
              <span className="panel__hint">objetivo {weekNow?.target ?? profile.weeklyTarget}/semana</span>
            </div>
            <div className="week-summary">
              <div className="week-summary__big">
                <b>
                  {Math.min(
                    (weekNow?.completed ?? 0) + (weekNow?.adapted ?? 0),
                    weekNow?.target ?? 0
                  )}
                </b>
                <span> de {weekNow?.target} misiones</span>
              </div>
              <div className="week-summary__meta">
                <span>
                  {weekSets} {weekSets === 1 ? "serie" : "series"} de trabajo
                </span>
                {(weekNow?.adapted ?? 0) > 0 && (
                  <span>· {weekNow?.adapted} adaptadas con cabeza</span>
                )}
              </div>
            </div>
            <XPBar
              tone="ember"
              value={Math.min(
                (weekNow?.completed ?? 0) + (weekNow?.adapted ?? 0),
                weekNow?.target ?? 1
              )}
              max={weekNow?.target || 1}
              label={`Misiones de la semana: ${(weekNow?.completed ?? 0) + (weekNow?.adapted ?? 0)} de ${weekNow?.target}`}
            />
          </section>

          {/* 2 · Progresión de carga por ejercicio y variante */}
          <PixelFrame as="section">
            <div className="field-label">
              <span>Progresión de carga</span>
              <span className="field-label__hint">mejor serie por sesión</span>
            </div>
            <div className="select-frame" style={{ marginBottom: 8 }}>
              <select
                aria-label="Elegir ejercicio"
                value={effectiveExerciseId ?? ""}
                onChange={(e) => chooseExercise(e.target.value)}
              >
                <optgroup label="Con registros">
                  {CODEX.filter((c) => exerciseIdsWithData.has(c.id)).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </optgroup>
                {CODEX.some((c) => !exerciseIdsWithData.has(c.id)) && (
                  <optgroup label="Sin registros todavía">
                    {CODEX.filter((c) => !exerciseIdsWithData.has(c.id)).map((c) => (
                      <option key={c.id} value={c.id} disabled>
                        {c.nombre}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {variantOptions.length > 0 && (
              <div className="select-frame" style={{ marginBottom: 12 }}>
                <select
                  aria-label="Elegir variante"
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                >
                  <option value="">Ejercicio principal</option>
                  {variantOptions.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            {exPoints.length > 0 ? (
              <>
                <div className="rack-list">
                  {exPoints.slice(-10).map((p, i) => (
                    <div key={`${p.label}-${i}`} className="rack-list__row">
                      <span className="rack-list__date">{p.label}</span>
                      <PxSprite
                        frames={[rackBar(p.value)]}
                        palette={PAL_C}
                        scale={2}
                        label={`${p.label}: ${p.value} kg por ${p.reps} repeticiones`}
                      />
                      <span className="rack-list__read">
                        <b>{p.value}</b> kg ×{p.reps}
                      </span>
                    </div>
                  ))}
                </div>
                {(recordWeight || recordReps) && (
                  <p className="small" style={{ marginTop: 8 }}>
                    <b>Récords de {selectedName}:</b>{" "}
                    {recordWeight && `${recordWeight.weightKg} kg × ${recordWeight.reps}`}
                    {recordReps &&
                      recordReps.id !== recordWeight?.id &&
                      ` · más repeticiones: ${recordReps.reps} con ${recordReps.weightKg} kg`}
                  </p>
                )}
                <p className="small dim" style={{ marginTop: 4 }}>
                  Cada variante guarda su propia progresión: cambiar de máquina
                  nunca mezcla cargas incomparables.
                </p>
              </>
            ) : (
              <p className="small dim">
                Sin registros de {variantId ? "esta variante" : "este ejercicio"} todavía.
              </p>
            )}
          </PixelFrame>

          {/* 3 · Detalle secundario en acordeones */}
          <details className="fold" open>
            <summary className="fold__head">
              <span>Llamas de combo — adherencia</span>
              <span className="fold__hint">campaña de {CAMPAIGN_WEEKS} semanas</span>
            </summary>
            <div className="fold__body">
              <div className="combo-weeks">
                {weeks.map((w) => {
                  const lit = Math.min(w.completed + w.adapted, w.target);
                  return (
                    <div
                      key={w.week}
                      className="combo-weeks__col"
                      role="img"
                      aria-label={`Semana ${w.week}: ${w.completed} completadas, ${w.adapted} adaptadas de ${w.target}`}
                    >
                      <div className="combo-weeks__flames">
                        {Array.from({ length: Math.max(w.target, 1) }, (_, i) => (
                          <PxSprite
                            key={i}
                            frames={[i < lit ? FLAME_ON_C : FLAME_OFF_C]}
                            palette={PAL_C}
                            scale={2}
                          />
                        ))}
                      </div>
                      <span className="combo-weeks__label">
                        S{w.week}
                        <i>
                          {lit}/{w.target}
                          {w.met ? " · x" + lit : ""}
                        </i>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="small dim" style={{ marginTop: 8 }}>
                Una llama por misión cumplida (las adaptadas también encienden).
                Semana llena = combo completo: la Llama queda al rojo.
              </p>
            </div>
          </details>

          <details className="fold">
            <summary className="fold__head">
              <span>Torres de discos — volumen</span>
              <span className="fold__hint">planificado frente a realizado</span>
            </summary>
            <div className="fold__body">
              <div className="tower-row">
                {volumePoints.map((p) => (
                  <div key={p.label} className="tower-row__col">
                    <PxSprite
                      frames={[discTower(p.value)]}
                      palette={PAL_C}
                      scale={2}
                      label={`${p.label}: ${p.value} series de ${p.planned} planificadas`}
                    />
                    <span className="combo-weeks__label">
                      {p.label}
                      <i>
                        {p.value}
                        {p.planned > 0 ? `/${p.planned}` : ""}
                      </i>
                    </span>
                  </div>
                ))}
              </div>
              <p className="small dim" style={{ marginTop: 8 }}>
                Series de trabajo realizadas frente a las planificadas esa
                semana. En descarga, el plan reducido es el objetivo real.
              </p>
            </div>
          </details>

          <details className="fold">
            <summary className="fold__head">
              <span>Medidor de calor — RIR</span>
              <span className="fold__hint">media por misión</span>
            </summary>
            <div className="fold__body">
              {rirPoints.length > 0 ? (
                <>
                  <div className="heat-row">
                    {rirPoints.slice(-7).map((p, i) => (
                      <div key={`${p.label}-${i}`} className="tower-row__col">
                        <PxSprite
                          frames={[heatMeter(Math.round(p.value))]}
                          palette={PAL_C}
                          scale={2}
                          label={`${p.label}: RIR medio ${p.value}`}
                        />
                        <span className="combo-weeks__label">
                          {p.label}
                          <i>RIR {p.value}</i>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="small dim">
                    RIR = repeticiones que te quedaban en reserva. La aguja en
                    la zona roja es DANGER: fallo encubierto, no constancia. La
                    zona útil vive entre 1 y 2.
                  </p>
                </>
              ) : (
                <p className="small dim">Sin datos de RIR todavía.</p>
              )}
            </div>
          </details>

          <details className="fold" open={hitos.length > 0}>
            <summary className="fold__head fold__head--gold">
              <span>Hitos personales</span>
              <span className="fold__hint">{hitos.length}</span>
            </summary>
            <div className="fold__body">
              {hitos.length > 0 ? (
                <div className="stack stack--tight">
                  {hitos.slice(0, 8).map((h) => (
                    <div key={h.id} className="hito-line">
                      <PxSprite frames={[G_STAR]} palette={PAL_C} scale={2} />
                      <span>{h.label.replace(/^Hito: /, "")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="small dim">
                  Los récords honestos de carga aparecerán aquí como hitos.
                </p>
              )}
            </div>
          </details>

          <details className="fold">
            <summary className="fold__head">
              <span>Molestias y adaptaciones</span>
              <span className="fold__hint">{discomforts.length}</span>
            </summary>
            <div className="fold__body">
              {discomforts.length > 0 ? (
                <div className="stack stack--tight">
                  {discomforts.slice(0, 6).map((d) => (
                    <p key={d.id} className="small">
                      <b>{codexById(d.exerciseId)?.nombre ?? d.exerciseId}</b>{" "}
                      <span className="dim">
                        — {d.level}/10 ·{" "}
                        {d.action === "continuar"
                          ? "continuó con cuidado"
                          : d.action === "adaptar"
                            ? "adaptó carga o variante"
                            : "detuvo el ejercicio"}
                        {d.incidentStatus ? ` · incidencia ${d.incidentStatus}` : ""}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="small dim">
                  Sin molestias registradas. Que siga así: escucha a la rodilla.
                </p>
              )}
            </div>
          </details>

          {/* Comparación entre campañas */}
          {comparison && comparison.length >= 2 && (
            <details className="fold">
              <summary className="fold__head">
                <span>Comparación de campañas</span>
                <span className="fold__hint">{comparison.length}</span>
              </summary>
              <div className="fold__body">
                <div className="stack stack--tight">
                  {comparison.map((st, i) => (
                    <p key={st.campaign.id} className="small">
                      <b>
                        Campaña {i + 1}
                        {st.campaign.status === "activa" ? " (actual)" : ""}
                      </b>{" "}
                      <span className="dim">
                        — {st.weeksMet}/{st.campaign.weeksTotal} capítulos ·{" "}
                        {st.completed + st.adapted} misiones · {st.totalSets} series ·{" "}
                        {st.hitos} hitos · {st.xp} XP
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </details>
          )}

          <div className="stack stack--tight">
            <PixelButton tone="ghost" block onClick={() => navigate("/historial")}>
              Ver historial completo de sesiones
            </PixelButton>
            <PixelButton tone="gold" block onClick={doExportCsv}>
              Exportar series a CSV
            </PixelButton>
          </div>
        </div>
      )}
    </main>
  );
}
