// Hoy: una sola pregunta manda — ¿qué misión toca? El hero de misión domina
// el primer viewport; el camino semanal va segundo; capítulo y XP son
// contexto. El estado local solo aparece cuando aporta algo (offline, cola).

import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useActiveProfile, useOnline, usePendingSync, useToday } from "../ui/hooks";
import {
  FlameSprite,
  ForgeBackdrop,
  PixelButton,
  PixelFrame,
  StatusChip,
  XPBar
} from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { BONFIRE_C, SEAL_DONE_C } from "../ui/arcade/props";
import { avatarFrames, type AvatarMood } from "../ui/arcade/extra";
import {
  G_ADAPT,
  G_CAMP,
  G_CHECK,
  G_CROSS,
  G_HAMMER
} from "../ui/arcade/icons";
import { CAMPAIGN_WEEKS, CHAPTERS, dayById, scheduleById } from "../data/routine";
import {
  addDays,
  dateKeyOf,
  formatDateShort,
  mondayOf,
  parseDateKey,
  weekdayIndex,
  WEEKDAY_SHORT
} from "../logic/dates";
import { flameStreak, summarizeWeeks } from "../logic/streak";
import { campaignPhase, flameStateOf, summarizeBlock } from "../logic/campaign";
import { levelFromXp } from "../logic/xp";
import { syncUiState } from "../sync/adapter";
import type { Session } from "../db/types";

const FLAME_TEXT = {
  apagada: "La llama espera el inicio",
  rescoldo: "Rescoldo: enciéndela esta semana",
  encendida: "Llama viva",
  roja: "Llama al rojo"
} as const;

export function Today() {
  const navigate = useNavigate();
  const today = useToday();
  const profile = useActiveProfile();
  const online = useOnline();
  const { pending, errors } = usePendingSync();

  const sessions = useLiveQuery(
    async () =>
      profile
        ? await db.sessions.where("profileId").equals(profile.id).toArray()
        : [],
    [profile?.id]
  );

  if (!profile || sessions === undefined) return <main className="screen" />;

  const schedule = scheduleById(profile.scheduleId);
  const level = levelFromXp(profile.xp);
  const phase = campaignPhase(profile.campaignStart, today);
  const scheduled = sessions.filter((s) => !s.unscheduled);
  const weeks = summarizeWeeks(
    scheduled,
    profile.campaignStart,
    profile.weeklyTarget,
    today,
    CAMPAIGN_WEEKS
  );
  const streak = flameStreak(weeks, today, profile.campaignStart);
  const flame = flameStateOf(phase, weeks, streak);
  const week = phase.kind === "activa" ? phase.week : phase.kind === "prologo" ? 0 : CAMPAIGN_WEEKS;
  const chapter = phase.kind === "activa" ? CHAPTERS[phase.week - 1] : null;
  const weekInfo = phase.kind === "activa" ? weeks[phase.week - 1] : undefined;

  const todayKey = dateKeyOf(today);
  const todayIdx = weekdayIndex(today);
  const todayDayId = schedule.week[todayIdx];
  const todayDay = todayDayId ? dayById(todayDayId) : undefined;

  const activeSession = sessions.find((s) => s.status === "activa");
  const todaySessions = sessions.filter((s) => s.dateKey === todayKey);
  const todayDone = todaySessions.find(
    (s) => s.status === "completada" || s.status === "adaptada"
  );

  // Regla del manual: cuando Carlos puede un cuarto día, se une a la sesión
  // exacta de Nahuel (Empuje o Pierna B), sin crear otro entrenamiento.
  const nahuelDayId =
    profile.scheduleId === "carlos-3" && !todayDayId
      ? scheduleById("nahuel-5").week[todayIdx]
      : null;
  const joinableDay = nahuelDayId ? dayById(nahuelDayId) : undefined;

  const monday = mondayOf(today);
  const workingSets = todayDay ? todayDay.entries.reduce((a, e) => a + e.sets, 0) : 0;

  const syncState = syncUiState(pending, errors);
  const showStatusChip =
    !online || syncState.kind === "pendiente" || syncState.kind === "error";

  const mood: AvatarMood =
    phase.kind === "prologo"
      ? "neutral"
      : todayDone
        ? "celebrando"
        : todayDay
          ? "preparado"
          : "recuperando";

  return (
    <main className="screen screen--today">
      <ForgeBackdrop />
      <div className="stack">
        {/* Identidad compacta */}
        <header className="today-id">
          <h1 className="today-id__name">{profile.name}</h1>
          <span className="today-id__level">
            Nv. <b>{level.level}</b>
          </span>
          <span className="grow" />
          {showStatusChip && (
            <StatusChip
              tone={!online ? "default" : syncState.kind === "error" ? "danger" : "warn"}
              dot
              role="status"
            >
              {!online
                ? "Sin conexión"
                : syncState.kind === "pendiente"
                  ? `${pending} pend.`
                  : "Reintento"}
            </StatusChip>
          )}
        </header>

        {/* HERO según fase y día */}
        {phase.kind === "prologo" ? (
          <PrologueHero startKey={phase.startKey} daysUntil={phase.daysUntil} />
        ) : phase.kind === "forjado" ? (
          <ForgedHero
            weeksMet={summarizeBlock(weeks).weeksMet}
            todayDay={todayDay}
            activeSession={!!activeSession}
            todayDone={todayDone}
            onTrain={() => navigate("/mision")}
            onSummary={(id) => navigate(`/mision/resumen/${id}`)}
            onCampaign={() => navigate("/campana")}
          />
        ) : todayDay ? (
          <PixelFrame tone="ember" as="section" className="hero-mission">
            <div className="marquee">
              <span className="marquee__bulbs" aria-hidden="true" />
              <span className="px-label px-label--gold">
                Capítulo {week} · {chapter?.title}
              </span>
              <h2 className="hero-mission__title">{todayDay.name}</h2>
              <span className="marquee__bulbs" aria-hidden="true" />
            </div>
            <div className="hero-mission__stage">
              <PxSprite
                frames={avatarFrames(profile.avatarId, mood).frames}
                palette={PAL_C}
                fps={avatarFrames(profile.avatarId, mood).fps}
                scale={3}
                label={`Avatar de ${profile.name}`}
              />
            </div>
            <p className="hero-mission__focus">{todayDay.focus}</p>
            <div className="mission-card__stats">
              <span className="stat-pip">
                <b>
                  {todayDay.durationMin}–{todayDay.durationMax}
                </b>
                <span>min</span>
              </span>
              <span className="stat-pip">
                <b>{todayDay.entries.length}</b>
                <span>etapas</span>
              </span>
              <span className="stat-pip">
                <b>{workingSets}</b>
                <span>series</span>
              </span>
            </div>
            {todayDone ? (
              <div className="stack stack--tight">
                <StatusChip tone={todayDone.status === "adaptada" ? "warn" : "done"} dot>
                  {todayDone.status === "adaptada" ? "Misión adaptada" : "Misión completada"}
                </StatusChip>
                <PixelButton
                  tone="ghost"
                  sans
                  block
                  onClick={() => navigate(`/mision/resumen/${todayDone.id}`)}
                >
                  Ver resumen
                </PixelButton>
              </div>
            ) : (
              <PixelButton tone="primary" big block onClick={() => navigate("/mision")}>
                {activeSession ? "Continuar misión" : "Empezar misión"}
              </PixelButton>
            )}
            <p className="hero-mission__week" role="status">
              {weekInfo
                ? `${Math.min(weekInfo.completed + weekInfo.adapted, weekInfo.target)} de ${weekInfo.target} misiones esta semana · ${FLAME_TEXT[flame]}`
                : ""}
            </p>
          </PixelFrame>
        ) : (
          <CampHero
            flameText={FLAME_TEXT[flame]}
            weekInfo={
              weekInfo
                ? `${Math.min(weekInfo.completed + weekInfo.adapted, weekInfo.target)} de ${weekInfo.target} misiones esta semana`
                : ""
            }
            activeSession={!!activeSession}
            joinable={!activeSession && !todayDone ? joinableDay : undefined}
            onContinue={() => navigate("/mision")}
            onJoin={(id) => navigate(`/mision?dia=${id}`)}
          />
        )}

        {/* Recuperación de una misión de otro día */}
        {activeSession && activeSession.dateKey !== todayKey && todayDay && (
          <RecoveredNote session={activeSession} />
        )}

        {/* Camino de la semana */}
        <section className="panel" aria-label="Semana de campaña">
          <div className="panel__kicker">
            <span>Semana de campaña</span>
            <span className="panel__hint">
              {streak > 0
                ? `${streak} ${streak === 1 ? "semana" : "semanas"} al rojo`
                : `objetivo ${profile.weeklyTarget}/semana`}
            </span>
          </div>
          <div className="path" role="list">
            {schedule.week.map((dayId, i) => {
              const date = addDays(monday, i);
              const key = dateKeyOf(date);
              const isToday = key === todayKey;
              const daySessions = scheduled.filter(
                (s) => s.dateKey === key && dayId && s.dayId === dayId
              );
              const done = daySessions.find((s) => s.status === "completada");
              const adapted = daySessions.find((s) => s.status === "adaptada");
              const isPast = key < todayKey;
              const missed =
                dayId &&
                isPast &&
                key >= profile.campaignStart &&
                phase.kind !== "prologo" &&
                !done &&
                !adapted;

              let nodeCls = "path__node";
              let glyph: React.ReactNode;
              let desc = "";
              if (!dayId) {
                nodeCls += " path__node--camp";
                glyph = <PxSprite frames={[G_CAMP]} palette={PAL_C} scale={2} />;
                desc = "Campamento";
              } else if (done) {
                nodeCls += " path__node--done";
                glyph = <PxSprite frames={[G_CHECK]} palette={PAL_C} scale={2} />;
                desc = `${dayById(dayId)?.name}: completada`;
              } else if (adapted) {
                nodeCls += " path__node--adapted";
                glyph = <PxSprite frames={[G_ADAPT]} palette={PAL_C} scale={2} />;
                desc = `${dayById(dayId)?.name}: adaptada`;
              } else if (missed) {
                nodeCls += " path__node--missed";
                glyph = <PxSprite frames={[G_CROSS]} palette={PAL_C} scale={2} />;
                desc = `${dayById(dayId)?.name}: no realizada`;
              } else {
                glyph = <PxSprite frames={[G_HAMMER]} palette={PAL_C} scale={2} />;
                desc = `${dayById(dayId)?.name}: pendiente`;
              }
              if (isToday) nodeCls += " path__node--today";

              return (
                <div className="path__day" role="listitem" key={i}>
                  <span
                    className={`path__label${isToday ? " path__label--today" : ""}`}
                    aria-hidden="true"
                  >
                    {WEEKDAY_SHORT[i]}
                  </span>
                  <span className={nodeCls} title={desc}>
                    {glyph}
                    <span className="visually-hidden">{desc}</span>
                  </span>
                  <span className="path__daytype" aria-hidden="true">
                    {dayId ? dayById(dayId)?.name : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contexto de capítulo + XP (secundario) */}
        <section className="panel" aria-label="Campaña y experiencia">
          <div className="panel__kicker">
            <span>
              {phase.kind === "prologo"
                ? "Prólogo"
                : phase.kind === "forjado"
                  ? "Bloque forjado"
                  : `Capítulo ${week} de ${CAMPAIGN_WEEKS}`}
            </span>
            <span className="panel__hint">
              Nv. {level.level} · {level.titulo}
            </span>
          </div>
          <div className="chapter-row">
            <div className="chapter-row__flame">
              <FlameSprite state={flame} scale={2} label={`Llama: ${flame}`} />
            </div>
            <div className="banner__weeks grow" aria-hidden="true">
              {weeks.map((w) => (
                <span
                  key={w.week}
                  className={`banner__week${w.met ? " banner__week--met" : ""}${
                    phase.kind === "activa" && w.week === week ? " banner__week--current" : ""
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              className="chapter-row__link"
              onClick={() => navigate("/campana")}
            >
              Ver mapa
            </button>
          </div>
          <XPBar
            value={level.currentXp}
            max={level.nextLevelXp}
            label={`Experiencia: ${level.currentXp} de ${level.nextLevelXp}`}
          />
        </section>

        {!online && (
          <p className="small dim" role="status">
            Sin conexión: todo sigue funcionando y se guarda en este dispositivo.
          </p>
        )}
      </div>
    </main>
  );
}

// ── Hero de prólogo ─────────────────────────────────────────────────────────

function PrologueHero({ startKey, daysUntil }: { startKey: string; daysUntil: number }) {
  const navigate = useNavigate();
  const start = parseDateKey(startKey);
  return (
    <PixelFrame as="section" className="hero-mission hero-mission--prologue">
      <div className="hero-mission__kicker">
        <span className="px-label">Prólogo</span>
      </div>
      <div className="camp-card__sprite">
        <FlameSprite state="apagada" scale={4} label="Llama apagada" />
      </div>
      <h2 className="hero-mission__title">La forja aún está fría</h2>
      <p className="hero-mission__focus">
        El capítulo 1 se enciende el {formatDateShort(start)}
        {daysUntil === 1 ? " — mañana" : daysUntil > 1 ? ` — quedan ${daysUntil} días` : ""}.
        Los días previos no cuentan como misiones perdidas.
      </p>
      <div className="stack stack--tight">
        <PixelButton tone="gold" block onClick={() => navigate("/codice")}>
          Estudiar el Códice
        </PixelButton>
        <PixelButton tone="ghost" sans block onClick={() => navigate("/campana")}>
          Ver el mapa de campaña
        </PixelButton>
      </div>
    </PixelFrame>
  );
}

// ── Hero tras la semana 6 ───────────────────────────────────────────────────

function ForgedHero({
  weeksMet,
  todayDay,
  activeSession,
  todayDone,
  onTrain,
  onSummary,
  onCampaign
}: {
  weeksMet: number;
  todayDay: ReturnType<typeof dayById>;
  activeSession: boolean;
  todayDone: Session | undefined;
  onTrain: () => void;
  onSummary: (id: string) => void;
  onCampaign: () => void;
}) {
  return (
    <PixelFrame tone="gold" as="section" className="hero-mission">
      <div className="hero-mission__kicker">
        <span className="px-label px-label--gold">Bloque forjado</span>
      </div>
      <div className="camp-card__sprite">
        <PxSprite frames={[SEAL_DONE_C]} palette={PAL_C} scale={3} label="Sello del bloque forjado" />
      </div>
      <h2 className="hero-mission__title">Seis capítulos al yunque</h2>
      <p className="hero-mission__focus">
        {weeksMet} de {CAMPAIGN_WEEKS} semanas cumplieron su objetivo. La rutina
        sigue disponible; el siguiente bloque empieza cuando tú lo decidas desde
        el mapa de campaña.
      </p>
      {todayDay &&
        (todayDone ? (
          <div className="stack stack--tight">
            <StatusChip tone={todayDone.status === "adaptada" ? "warn" : "done"} dot>
              {todayDone.status === "adaptada" ? "Misión adaptada" : "Misión completada"}
            </StatusChip>
            <PixelButton tone="ghost" sans block onClick={() => onSummary(todayDone.id)}>
              Ver resumen
            </PixelButton>
          </div>
        ) : (
          <PixelButton tone="primary" big block onClick={onTrain}>
            {activeSession ? "Continuar misión" : `Entrenar ${todayDay.name}`}
          </PixelButton>
        ))}
      <div style={{ marginTop: "var(--s2)" }}>
        <PixelButton tone="ghost" sans block onClick={onCampaign}>
          Ver checkpoint y nueva campaña
        </PixelButton>
      </div>
    </PixelFrame>
  );
}

// ── Hero de campamento (día de descanso) ────────────────────────────────────

function CampHero({
  flameText,
  weekInfo,
  activeSession,
  joinable,
  onContinue,
  onJoin
}: {
  flameText: string;
  weekInfo: string;
  activeSession: boolean;
  joinable: ReturnType<typeof dayById> | undefined;
  onContinue: () => void;
  onJoin: (dayId: string) => void;
}) {
  return (
    <section className="camp-scene" aria-label="Campamento">
      <div className="camp-scene__sky" aria-hidden="true" />
      <div className="camp-scene__fire">
        <PxSprite
          frames={BONFIRE_C}
          palette={PAL_C}
          fps={6}
          scale={4}
          label="Hoguera de campamento"
        />
      </div>
      <div className="camp-scene__body">
        <span className="px-label">Campamento</span>
        <h2 className="hero-mission__title">Día de recuperación</h2>
        <p className="hero-mission__focus">
          Caminar y moverse suave suma; el fuego se aviva descansando. Mañana la
          fragua espera.
        </p>
        <p className="small dim">
          {weekInfo ? `${weekInfo} · ` : ""}
          {flameText}. El descanso nunca la apaga.
        </p>
        {activeSession && (
          <div style={{ marginTop: "var(--s3)" }}>
            <PixelButton tone="primary" block onClick={onContinue}>
              Continuar misión pendiente
            </PixelButton>
          </div>
        )}
        {joinable && (
          <div style={{ marginTop: "var(--s3)" }} className="stack stack--tight">
            <PixelButton tone="ghost" sans block onClick={() => onJoin(joinable.id)}>
              Unirse a {joinable.name} con Nahuel
            </PixelButton>
            <p className="small dim">
              Día extra del manual: cuenta como entrenamiento, no da XP ni hace
              falta para la Llama.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RecoveredNote({ session }: { session: Session }) {
  const day = dayById(session.dayId);
  return (
    <div className="inline-alert" role="status">
      Tienes una misión de <b>{day?.name}</b> sin terminar del {session.dateKey}.
      «Continuar misión» la retoma donde la dejaste.
    </div>
  );
}
