// Progreso: carga por ejercicio, adherencia semanal, volumen, RIR,
// molestias e hitos. Todo desde IndexedDB, todo en lenguaje pixel.

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

const SELECTED_KEY = "forja:progreso-ejercicio";

export function Progress() {
  const navigate = useNavigate();
  const profile = useActiveProfile();
  const today = useToday();
  // null = aún sin decidir: se autoselecciona el ejercicio con datos más
  // reciente en cuanto llegan los registros. La elección sobrevive al
  // cambio de pantalla vía sessionStorage.
  const [exerciseId, setExerciseId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SELECTED_KEY);
    } catch {
      return null;
    }
  });

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

  const exerciseIdsWithData = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.sets.filter((s) => !s.skipped).map((s) => s.exerciseId));
  }, [data]);

  // Ejercicio usado más recientemente (por fecha real de registro).
  const mostRecentExerciseId = useMemo(() => {
    if (!data) return null;
    let best: { id: string; at: number } | null = null;
    for (const s of data.sets) {
      if (s.skipped) continue;
      if (!best || s.createdAt > best.at) best = { id: s.exerciseId, at: s.createdAt };
    }
    return best?.id ?? null;
  }, [data]);

  // Nunca dejar seleccionada una opción sin datos: si la selección guardada
  // no tiene registros (u no hay selección), cae al más reciente con datos.
  const effectiveExerciseId =
    exerciseId && exerciseIdsWithData.has(exerciseId)
      ? exerciseId
      : mostRecentExerciseId;

  const chooseExercise = (id: string) => {
    setExerciseId(id);
    try {
      sessionStorage.setItem(SELECTED_KEY, id);
    } catch {
      /* sin sessionStorage no pasa nada: solo se pierde la persistencia */
    }
  };

  if (!profile || !data) return <main className="screen" />;

  const { sessions, sets, discomforts, hitos } = data;
  const finished = sessions
    .filter((s) => s.status === "completada" || s.status === "adaptada")
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const isEmpty = finished.length === 0 && sets.length === 0;

  // Progresión del ejercicio elegido: mejor serie por sesión.
  const exPoints = finished
    .map((session) => {
      const inSession = sets.filter(
        (x) =>
          x.sessionId === session.id &&
          x.exerciseId === effectiveExerciseId &&
          !x.skipped &&
          x.reps > 0
      );
      if (inSession.length === 0) return null;
      const top = inSession.sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
      const [, m, d] = session.dateKey.split("-");
      return {
        label: `${d}/${m}`,
        value: top.weightKg,
        sub: `×${top.reps}`,
        rir: top.rir
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const weeks = summarizeWeeks(
    sessions.filter((s) => !s.unscheduled),
    profile.campaignStart,
    profile.weeklyTarget,
    today,
    CAMPAIGN_WEEKS
  );

  // Volumen semanal: series de trabajo hechas por semana de campaña.
  const volumePoints = weeks.map((w) => {
    const weekSessions = finished.filter((s) => {
      const sw = sessions.find((x) => x.id === s.id);
      return sw && sw.week === w.week;
    });
    const count = sets.filter(
      (x) => weekSessions.some((s) => s.id === x.sessionId) && !x.skipped && x.reps > 0
    ).length;
    return { label: `S${w.week}`, value: count };
  });

  // RIR medio por sesión terminada.
  const rirPoints = finished
    .map((session) => {
      const inSession = sets.filter(
        (x) => x.sessionId === session.id && !x.skipped && x.reps > 0
      );
      if (inSession.length === 0) return null;
      const avg =
        Math.round(
          (inSession.reduce((a, x) => a + x.rir, 0) / inSession.length) * 10
        ) / 10;
      const [, m, d] = session.dateKey.split("-");
      return { label: `${d}/${m}`, value: avg };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Resumen de la semana en curso (o la última con datos si el bloque acabó).
  const phase = campaignPhase(profile.campaignStart, today);
  const currentWeekNum =
    phase.kind === "activa" ? phase.week : phase.kind === "forjado" ? CAMPAIGN_WEEKS : 1;
  const weekNow = weeks[currentWeekNum - 1];
  const weekSets = sets.filter((x) => {
    const sess = sessions.find((s) => s.id === x.sessionId);
    return sess && sess.week === currentWeekNum && !x.skipped && x.reps > 0;
  }).length;

  const selectedName = effectiveExerciseId
    ? codexById(effectiveExerciseId)?.nombre
    : null;

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
          {/* 1 · Resumen de la semana */}
          <section className="panel" aria-label="Resumen de la semana">
            <div className="panel__kicker">
              <span>
                {phase.kind === "forjado" ? "Último capítulo" : "Esta semana"}
              </span>
              <span className="panel__hint">objetivo {profile.weeklyTarget}/semana</span>
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
              max={weekNow?.target ?? 1}
              label={`Misiones de la semana: ${(weekNow?.completed ?? 0) + (weekNow?.adapted ?? 0)} de ${weekNow?.target}`}
            />
          </section>

          {/* 2 · Progresión de carga destacada */}
          <PixelFrame as="section">
            <div className="field-label">
              <span>Progresión de carga</span>
              <span className="field-label__hint">mejor serie por sesión</span>
            </div>
            <div className="select-frame" style={{ marginBottom: 12 }}>
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
            {exPoints.length > 0 ? (
              <>
                <div className="rack-list">
                  {exPoints.map((p) => (
                    <div key={p.label} className="rack-list__row">
                      <span className="rack-list__date">{p.label}</span>
                      <PxSprite
                        frames={[rackBar(p.value)]}
                        palette={PAL_C}
                        scale={2}
                        label={`${p.label}: ${p.value} kg por ${p.sub.slice(1)} repeticiones`}
                      />
                      <span className="rack-list__read">
                        <b>{p.value}</b> kg {p.sub}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="small dim" style={{ marginTop: 8 }}>
                  Una barra cargada por misión: los discos son los kilos reales
                  de la mejor serie de {selectedName ?? "este ejercicio"}; al
                  lado, sus repeticiones. Subir peso o repeticiones con el RIR
                  previsto es progresar.
                </p>
              </>
            ) : (
              <p className="small dim">Sin registros de este ejercicio todavía.</p>
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
                        {Array.from({ length: w.target }, (_, i) => (
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
              <span className="fold__hint">series de trabajo</span>
            </summary>
            <div className="fold__body">
              <div className="tower-row">
                {volumePoints.map((p) => (
                  <div key={p.label} className="tower-row__col">
                    <PxSprite
                      frames={[discTower(p.value)]}
                      palette={PAL_C}
                      scale={2}
                      label={`${p.label}: ${p.value} series`}
                    />
                    <span className="combo-weeks__label">
                      {p.label}
                      <i>{p.value}</i>
                    </span>
                  </div>
                ))}
              </div>
              <p className="small dim" style={{ marginTop: 8 }}>
                Un disco por cada 12 series de trabajo apiladas en la semana.
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
                    {rirPoints.slice(-7).map((p) => (
                      <div key={p.label} className="tower-row__col">
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
        </div>
      )}
    </main>
  );
}
