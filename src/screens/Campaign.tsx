// Campaña: mapa vertical de seis capítulos unidos por un camino continuo.
// El capítulo actual domina; los forjados quedan resumidos; el siguiente se
// intuye; el futuro duerme bajo la niebla. La semana 6 es un checkpoint de
// evaluación, nunca una prueba máxima.

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, touch } from "../db/db";
import { useActiveProfile, useToday } from "../ui/hooks";
import { FlameSprite, PixelButton, PixelFrame, PixelModal, StatusChip } from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { CHAPTER_NODES_C, SEAL_DONE_C } from "../ui/arcade/props";
import {
  G_ADAPT,
  G_CAMP,
  G_CHECK,
  G_CROSS,
  G_HAMMER,
  G_LOCK
} from "../ui/arcade/icons";
import { CAMPAIGN_WEEKS, CHAPTERS, dayById, scheduleById } from "../data/routine";
import {
  addDays,
  dateKeyOf,
  formatDateShort,
  parseDateKey,
  WEEKDAY_SHORT
} from "../logic/dates";
import { flameStreak, summarizeWeeks } from "../logic/streak";
import {
  campaignPhase,
  flameStateOf,
  nextCampaignStart,
  summarizeBlock
} from "../logic/campaign";

export function Campaign() {
  const profile = useActiveProfile();
  const today = useToday();
  const [restartOpen, setRestartOpen] = useState(false);
  const sessions = useLiveQuery(
    async () =>
      profile
        ? await db.sessions.where("profileId").equals(profile.id).toArray()
        : [],
    [profile?.id]
  );

  if (!profile || sessions === undefined) return <main className="screen" />;

  const schedule = scheduleById(profile.scheduleId);
  const scheduled = sessions.filter((s) => !s.unscheduled);
  const weeks = summarizeWeeks(
    scheduled,
    profile.campaignStart,
    profile.weeklyTarget,
    today,
    CAMPAIGN_WEEKS
  );
  const streak = flameStreak(weeks, today, profile.campaignStart);
  const phase = campaignPhase(profile.campaignStart, today);
  const flame = flameStateOf(phase, weeks, streak);
  const currentWeek = phase.kind === "activa" ? phase.week : phase.kind === "prologo" ? 0 : CAMPAIGN_WEEKS + 1;
  const todayKey = dateKeyOf(today);
  const block = summarizeBlock(weeks);

  const startNewCampaign = async () => {
    const fresh = await db.profiles.get(profile.id);
    if (!fresh) return;
    await db.profiles.put(
      touch({ ...fresh, campaignStart: nextCampaignStart(today) })
    );
    setRestartOpen(false);
  };

  return (
    <main className="screen">
      <h1 className="screen-title">Campaña</h1>
      <div className="stack">
        {/* Estado de la llama / cabecera */}
        <div className="panel">
          <div className="row">
            <FlameSprite state={flame} scale={3} label={`Llama: ${flame}`} />
            <div className="grow">
              <p className="small">
                <b className="banner__streak">
                  {phase.kind === "prologo"
                    ? "Prólogo: la llama espera el inicio"
                    : phase.kind === "forjado"
                      ? "Bloque forjado"
                      : streak > 0
                        ? `Llama al rojo: ${streak} ${streak === 1 ? "semana" : "semanas"}`
                        : "La llama espera su primera semana forjada"}
                </b>
              </p>
              <p className="small dim">
                {phase.kind === "prologo"
                  ? `El capítulo 1 se enciende el ${formatDateShort(parseDateKey(profile.campaignStart))}.`
                  : `Objetivo: ${profile.weeklyTarget} misiones por semana. Los campamentos nunca la apagan.`}
              </p>
            </div>
          </div>
        </div>

        {/* Checkpoint del bloque forjado */}
        {phase.kind === "forjado" && (
          <PixelFrame tone="gold" as="section">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <PxSprite frames={[SEAL_DONE_C]} palette={PAL_C} scale={3} label="Bloque forjado" />
              <div className="grow">
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Checkpoint del bloque</p>
                <p className="small dim">
                  {block.weeksMet} de {block.totalWeeks} semanas cumplidas ·{" "}
                  {block.completed} misiones completadas
                  {block.adapted > 0 ? ` · ${block.adapted} adaptadas con cabeza` : ""}.
                </p>
                <p className="small dim" style={{ marginTop: 4 }}>
                  La rutina sigue disponible desde Hoy. Una nueva campaña
                  reinicia capítulos y Llama; tu historial y XP se conservan.
                </p>
              </div>
            </div>
            <div style={{ marginTop: "var(--s3)" }}>
              <PixelButton tone="gold" block onClick={() => setRestartOpen(true)}>
                Empezar nueva campaña
              </PixelButton>
            </div>
          </PixelFrame>
        )}

        {/* Mapa vertical */}
        <ol className="cmap" aria-label="Mapa de la campaña">
          {CHAPTERS.map((ch) => {
            const info = weeks[ch.week - 1];
            const isCurrent = ch.week === currentWeek;
            const isPast = ch.week < currentWeek;
            const isNext = ch.week === currentWeek + 1;
            const isFuture = ch.week > currentWeek && !isNext;
            const weekStart = addDays(parseDateKey(profile.campaignStart), (ch.week - 1) * 7);
            const stateCls = isCurrent
              ? "cmap__stop--current"
              : isPast
                ? "cmap__stop--forged"
                : isNext
                  ? "cmap__stop--next"
                  : "cmap__stop--locked";
            const statusText = isPast
              ? info?.met
                ? `Capítulo forjado: ${info.completed + info.adapted} de ${info.target} misiones.`
                : `Quedó en ${(info?.completed ?? 0) + (info?.adapted ?? 0)} de ${info?.target}. La fragua no guarda rencor.`
              : isCurrent
                ? `${(info?.completed ?? 0) + (info?.adapted ?? 0)} de ${info?.target} misiones esta semana.`
                : isNext
                  ? `Se abre el ${formatDateShort(weekStart)}.`
                  : "Aún entre la niebla de la fragua.";

            return (
              <li key={ch.week} className={`cmap__stop ${stateCls}`}>
                <div className="cmap__rail" aria-hidden="true">
                  <span
                    className={`cmap__trail${isPast || isCurrent ? " cmap__trail--lit" : ""}`}
                  />
                  <span className="cmap__marker">
                    {isFuture ? (
                      <PxSprite frames={[G_LOCK]} palette={PAL_C} scale={2} />
                    ) : (
                      <PxSprite
                        frames={[CHAPTER_NODES_C[ch.week - 1]]}
                        palette={PAL_C}
                        scale={2}
                      />
                    )}
                  </span>
                  <span
                    className={`cmap__trail cmap__trail--below${isPast ? " cmap__trail--lit" : ""}`}
                  />
                </div>

                <div className="cmap__content">
                  <p className="cmap__kicker" aria-hidden="true">
                    Capítulo {ch.week}
                    {ch.week === CAMPAIGN_WEEKS ? " · checkpoint" : ""}
                  </p>
                  <span className="visually-hidden">
                    {`Capítulo ${ch.week}: ${ch.title}. ${statusText}`}
                  </span>
                  <h2 className="cmap__title" aria-hidden="true">
                    {isFuture ? "· · ·" : ch.title}
                  </h2>

                  {isCurrent && (
                    <>
                      <p className="small dim">{ch.detail}</p>
                      <div className="chapter__missions" style={{ marginTop: 8 }}>
                        {schedule.week.map((dayId, i) => {
                          const date = addDays(weekStart, i);
                          const key = dateKeyOf(date);
                          if (!dayId) {
                            return (
                              <span key={i} className="mini-node mini-node--camp" title="Campamento">
                                <PxSprite frames={[G_CAMP]} palette={PAL_C} scale={2} />
                                <span className="visually-hidden">Campamento</span>
                              </span>
                            );
                          }
                          const day = dayById(dayId);
                          const ds = scheduled.filter(
                            (s) => s.dateKey === key && s.dayId === dayId
                          );
                          const done = ds.some((s) => s.status === "completada");
                          const adapted = ds.some((s) => s.status === "adaptada");
                          const missed =
                            key < todayKey && key >= profile.campaignStart && !done && !adapted;
                          let cls = "mini-node";
                          let glyph: React.ReactNode = <PxSprite frames={[G_HAMMER]} palette={PAL_C} scale={2} />;
                          let desc = `${WEEKDAY_SHORT[i]} — ${day?.name}: pendiente`;
                          if (done) {
                            cls += " mini-node--done";
                            glyph = <PxSprite frames={[G_CHECK]} palette={PAL_C} scale={2} />;
                            desc = `${day?.name}: completada`;
                          } else if (adapted) {
                            cls += " mini-node--adapted";
                            glyph = <PxSprite frames={[G_ADAPT]} palette={PAL_C} scale={2} />;
                            desc = `${day?.name}: adaptada`;
                          } else if (missed) {
                            cls += " mini-node--missed";
                            glyph = <PxSprite frames={[G_CROSS]} palette={PAL_C} scale={2} />;
                            desc = `${day?.name}: no realizada`;
                          }
                          return (
                            <span key={i} className={cls} title={desc}>
                              {glyph}
                              <span className="visually-hidden">{desc}</span>
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {isPast && info?.met && (
                    <StatusChip tone="ember" className="cmap__chip">
                      Forjado {info.completed + info.adapted}/{info.target}
                    </StatusChip>
                  )}

                  <p className="small dim cmap__status" aria-hidden="true">
                    {statusText}
                  </p>
                  {ch.week === CAMPAIGN_WEEKS && (isCurrent || isNext) && (
                    <p className="small dim">
                      Checkpoint: se evalúa lo construido, sin máximos obligatorios.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Confirmación de nueva campaña */}
      <PixelModal
        open={restartOpen}
        title="Nueva campaña"
        onClose={() => setRestartOpen(false)}
      >
        <div className="stack stack--tight">
          <p className="small">
            La nueva campaña empezará el{" "}
            <b>{formatDateShort(parseDateKey(nextCampaignStart(today)))}</b>. Los
            capítulos y la Llama se reinician; el historial de cargas, hitos y
            XP se conserva.
          </p>
          <PixelButton tone="gold" block onClick={startNewCampaign}>
            Forjar un nuevo bloque
          </PixelButton>
          <PixelButton tone="ghost" sans block onClick={() => setRestartOpen(false)}>
            Todavía no
          </PixelButton>
        </div>
      </PixelModal>
    </main>
  );
}
