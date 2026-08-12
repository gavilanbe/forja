// Resumen de misión: primero la recompensa (golpe de martillo, chispas y
// sello), luego el camino semanal actualizado y por último los datos y la XP.
// Una misión adaptada es una decisión inteligente, nunca un premio menor.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { PixelButton, PixelFrame, StatusChip, XPBar } from "../ui/Pixel";
import { PxSprite, type Frame } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { buildChar } from "../ui/arcade/chars";
import { SEAL_ADAPT_C, SEAL_DONE_C, SPARKSTAR_C } from "../ui/arcade/props";
import { avatarFrames } from "../ui/arcade/extra";
import { G_ADAPT, G_CAMP, G_CHECK, G_HAMMER, G_STAR } from "../ui/arcade/icons";
import { dayById, scheduleById, CAMPAIGN_WEEKS } from "../data/routine";
import { addDays, dateKeyOf, mondayOf, parseDateKey, WEEKDAY_SHORT } from "../logic/dates";
import { levelFromXp } from "../logic/xp";
import { usePendingSync } from "../ui/hooks";
import { syncUiState } from "../sync/adapter";



/** Secuencia: 0-3 golpe de martillo · 4 sello · 5 todo visible */
const useRewardSequence = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.motion !== "completa";
    const forced = document.documentElement.dataset.motion === "reducida";
    if (reduced || forced) {
      setStep(5);
      return;
    }
    const timings = [260, 180, 320, 340, 420];
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setStep(i);
      if (i < 5) id = setTimeout(tick, timings[i] ?? 300);
    };
    id = setTimeout(tick, timings[0]);
    return () => clearTimeout(id);
  }, []);
  return step;
};

export function MissionComplete() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { pending, errors } = usePendingSync();
  const step = useRewardSequence();

  const data = useLiveQuery(async () => {
    if (!sessionId) return null;
    const session = await db.sessions.get(sessionId);
    if (!session) return null;
    const profile = await db.profiles.get(session.profileId);
    if (!profile) return null;
    const monday = mondayOf(parseDateKey(session.dateKey));
    const weekKeys = Array.from({ length: 7 }, (_, i) => dateKeyOf(addDays(monday, i)));
    const weekSessions = await db.sessions
      .where("profileId")
      .equals(session.profileId)
      .and(
        (s) =>
          s.dateKey >= weekKeys[0] &&
          s.dateKey <= weekKeys[6] &&
          (s.status === "completada" || s.status === "adaptada") &&
          !s.unscheduled
      )
      .toArray();
    return { session, profile, weekSessions, weekKeys };
  }, [sessionId]);

  if (data === undefined) return <main className="screen" />;
  if (!data) {
    return (
      <main className="screen">
        <div className="inline-alert inline-alert--danger" role="alert">
          No se encontró el resumen de esta misión.
        </div>
        <div style={{ marginTop: 16 }}>
          <PixelButton tone="gold" block onClick={() => navigate("/")}>
            Volver a la Forja
          </PixelButton>
        </div>
      </main>
    );
  }

  const { session, profile, weekSessions, weekKeys } = data;
  const day = dayById(session.dayId);
  const s = session.summary;
  const level = levelFromXp(profile.xp);
  const syncState = syncUiState(pending, errors);
  const adapted = session.status === "adaptada";
  const partial = session.status === "parcial";
  const abandoned = session.status === "abandonada";
  const extra = !!session.unscheduled;
  const schedule = scheduleById(profile.scheduleId);
  const weekCount = weekSessions.length;
  const weekMet = weekCount >= profile.weeklyTarget;

  const strikeFrame = Math.min(step, 3);
  const sealVisible = step >= 4;
  const restVisible = step >= 5;

  return (
    <main className="screen">
      <div className="complete">
        {/* 1–2: golpe de martillo con chispas */}
        <div className="complete__strike" aria-hidden="true">
          <StrikeArt who={profile.avatarId} frame={strikeFrame} />
          {step === 3 && (
            <span className="complete__spark">
              <PxSprite frames={SPARKSTAR_C} palette={PAL_C} fps={12} loop={false} scale={3} />
            </span>
          )}
        </div>

        {/* 3: sello */}
        <div
          className={`complete__seal${sealVisible ? " complete__seal--in" : ""}`}
          role="status"
        >
          <PxSprite
            frames={[adapted || partial || abandoned ? SEAL_ADAPT_C : SEAL_DONE_C]}
            palette={PAL_C}
            scale={3}
            label={
              adapted
                ? "Sello de misión adaptada"
                : partial
                  ? "Sello de misión parcial"
                  : abandoned
                    ? "Misión abandonada"
                    : "Sello de misión completada"
            }
          />
          <div>
            <span className="px-label px-label--gold">
              {extra
                ? "Misión extra"
                : adapted
                  ? "Misión adaptada"
                  : partial
                    ? "Misión parcial"
                    : abandoned
                      ? "Misión abandonada"
                      : "Misión completada"}
            </span>
            <h1 className="complete__title">{day?.name}</h1>
          </div>
        </div>

        <div className={`complete__rest${restVisible ? " complete__rest--in" : ""}`}>
          {adapted && (
            <p className="complete__note">
              Adaptar con cabeza también forja: la constancia vale más que
              cumplir el papel a cualquier precio.
            </p>
          )}
          {partial && !extra && (
            <p className="complete__note">
              Sesión parcial: el trabajo hecho cuenta ({s?.workingSets ?? 0} de{" "}
              {s?.prescribedSets ?? 0} series), pero la misión completa pide
              todas las series prescritas — o sus omisiones explicadas.
            </p>
          )}
          {abandoned && (
            <p className="complete__note">
              Misión abandonada: sin recompensa de misión. Las series ya
              guardadas se conservan y no se pueden cultivar repitiendo el día.
            </p>
          )}
          {extra && (
            <p className="complete__note">
              Día extra del manual: suma trabajo honesto. No da XP ni hacía
              falta para la Llama — el plan ya estaba cumplido sin él.
            </p>
          )}

          {/* 4: camino semanal actualizado */}
          <section className="panel complete__week" aria-label="Semana de campaña">
            <div className="panel__kicker">
              <span>Semana de campaña</span>
              <span className="panel__hint">
                {Math.min(weekCount, profile.weeklyTarget)} de {profile.weeklyTarget}
              </span>
            </div>
            <div className="path path--mini" role="list">
              {schedule.week.map((dayId, i) => {
                const key = weekKeys[i];
                const isThis = key === session.dateKey && dayId === session.dayId;
                const ds = weekSessions.filter((x) => x.dateKey === key && x.dayId === dayId);
                const done = ds.some((x) => x.status === "completada");
                const ad = ds.some((x) => x.status === "adaptada");
                let cls = "path__node";
                let glyph: React.ReactNode = dayId ? (
                  <PxSprite frames={[G_HAMMER]} palette={PAL_C} scale={2} />
                ) : (
                  <PxSprite frames={[G_CAMP]} palette={PAL_C} scale={2} />
                );
                let desc = dayId ? `${dayById(dayId)?.name}: pendiente` : "Campamento";
                if (!dayId) cls += " path__node--camp";
                else if (done) {
                  cls += " path__node--done";
                  glyph = <PxSprite frames={[G_CHECK]} palette={PAL_C} scale={2} />;
                  desc = `${dayById(dayId)?.name}: completada`;
                } else if (ad) {
                  cls += " path__node--adapted";
                  glyph = <PxSprite frames={[G_ADAPT]} palette={PAL_C} scale={2} />;
                  desc = `${dayById(dayId)?.name}: adaptada`;
                }
                if (isThis) cls += " path__node--today path__node--fresh";
                return (
                  <div className="path__day" role="listitem" key={i}>
                    <span className="path__label" aria-hidden="true">
                      {WEEKDAY_SHORT[i]}
                    </span>
                    <span className={cls} title={desc}>
                      {glyph}
                      <span className="visually-hidden">{desc}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {weekMet && session.week <= CAMPAIGN_WEEKS && (
              <p className="small complete__chapterdone" role="status">
                Capítulo forjado: la Llama queda al rojo esta semana.
              </p>
            )}
          </section>

          {/* 5: evolución cosmética pequeña — la forja gana luz */}
          <div className="complete__evolution" aria-hidden="true">
            <PxSprite
              frames={avatarFrames(profile.avatarId, "celebrando").frames}
              palette={PAL_C}
              fps={avatarFrames(profile.avatarId, "celebrando").fps}
              scale={2}
            />
            <div className="complete__glow">
              {Array.from({ length: Math.min(session.week, CAMPAIGN_WEEKS) }, (_, i) => (
                <PxSprite key={i} frames={[G_STAR]} palette={PAL_C} scale={2} />
              ))}
            </div>
          </div>

          {/* 6: datos y XP, secundarios */}
          <div className="complete__grid">
            <div className="complete__cell">
              <b>{s?.workingSets ?? 0}</b>
              <span>series de trabajo</span>
            </div>
            <div className="complete__cell">
              <b>{s?.exercisesProgressed ?? 0}</b>
              <span>ejercicios progresados</span>
            </div>
            <div className="complete__cell">
              <b>{s?.avgRir ?? "—"}</b>
              <span>RIR medio honesto</span>
            </div>
            <div className="complete__cell">
              <b>+{s?.xpGained ?? 0}</b>
              <span>XP ganada</span>
            </div>
          </div>

          {s?.hitos && s.hitos.length > 0 && (
            <PixelFrame tone="gold" tight className="grow" as="section">
              <div className="stack stack--tight">
                {s.hitos.map((h) => (
                  <div key={h} className="hito-line">
                    <PxSprite frames={[G_STAR]} palette={PAL_C} scale={2} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </PixelFrame>
          )}

          <div style={{ width: "100%" }}>
            <div className="field-label">
              <span>Experiencia</span>
              <span className="field-label__hint">
                Nv. {level.level} · {level.titulo}
              </span>
            </div>
            <XPBar
              value={level.currentXp}
              max={level.nextLevelXp}
              label={`Experiencia: ${level.currentXp} de ${level.nextLevelXp}`}
            />
          </div>

          <StatusChip
            tone={syncState.kind === "pendiente" ? "warn" : "done"}
            dot
            role="status"
          >
            {syncState.kind === "local"
              ? "Guardado en este dispositivo"
              : syncState.kind === "pendiente"
                ? `${pending} cambios por sincronizar — a salvo en local`
                : "Sincronizado"}
          </StatusChip>

          {/* 7: CTA */}
          <PixelButton tone="primary" big block onClick={() => navigate("/")}>
            Volver a la Forja
          </PixelButton>
        </div>
      </div>
    </main>
  );
}

// Fotogramas clave del golpe arcade: anticipación → cénit → impacto (flash) → reposo.
function StrikeArt({ who, frame }: { who: "nahuel" | "carlos"; frame: number }) {
  const all = buildChar(who, "golpeando").frames;
  const keys: Frame[] = [
    all[0],
    all[Math.min(2, all.length - 1)],
    all[Math.min(4, all.length - 1)],
    all[all.length - 1]
  ];
  return <PxSprite frames={[keys[Math.min(frame, 3)]]} palette={PAL_C} scale={4} />;
}
