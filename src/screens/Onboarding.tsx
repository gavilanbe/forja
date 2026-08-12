// Primer arranque: elegir forjador, elegir CUÁNDO empieza la campaña y, si
// se quiere, un tutorial de una pantalla. Entrar a mitad de semana nunca
// marca como falladas las sesiones anteriores a la incorporación real:
// la fecha de entrada (joinedKey) prorratea el objetivo de esa semana.

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { setActiveProfile } from "../db/seed";
import { FlameSprite, PixelButton, PixelFrame } from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { ANVIL_C } from "../ui/arcade/props";
import { avatarFrames } from "../ui/arcade/extra";
import { G_HAMMER, G_STAR } from "../ui/arcade/icons";
import { levelFromXp } from "../logic/xp";
import { changeCampaignStart } from "../logic/campaigns";
import {
  addDays,
  dateKeyOf,
  formatDateShort,
  mondayOf,
  parseDateKey,
  weekdayIndex
} from "../logic/dates";
import { forjaNow } from "../logic/clock";

export const KV_ONBOARDED = "onboardingDone";

type StartChoice = "hoy" | "lunes" | "manual";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const profiles = useLiveQuery(async () => await db.profiles.toArray(), []);
  const [chosen, setChosen] = useState<string | null>(null);
  const [step, setStep] = useState<"perfil" | "fecha" | "tutorial">("perfil");
  const [startChoice, setStartChoice] = useState<StartChoice>("hoy");
  const [manualKey, setManualKey] = useState<string>("");

  const today = forjaNow();
  const todayKey = dateKeyOf(today);
  const thisMonday = mondayOf(today);
  const nextMonday = addDays(thisMonday, 7);
  const isMonday = weekdayIndex(today) === 0;

  const resolved = useMemo(() => {
    if (startChoice === "hoy") {
      // La semana 1 es la semana actual; la incorporación es hoy.
      return { startKey: dateKeyOf(thisMonday), joinedKey: todayKey };
    }
    if (startChoice === "lunes") {
      const monday = isMonday ? thisMonday : nextMonday;
      return { startKey: dateKeyOf(monday), joinedKey: dateKeyOf(monday) };
    }
    if (manualKey) {
      const d = parseDateKey(manualKey);
      const monday = mondayOf(d);
      return {
        startKey: dateKeyOf(monday),
        joinedKey: manualKey >= todayKey ? manualKey : todayKey
      };
    }
    return null;
  }, [startChoice, manualKey, thisMonday, nextMonday, isMonday, todayKey]);

  if (!profiles) return <main className="screen" />;

  const finish = async (profileId: string) => {
    await setActiveProfile(profileId);
    if (resolved) {
      // Aún no hay sesiones: el cambio de fecha siempre es válido aquí.
      // Se aplica a AMBOS perfiles: comparten campaña del manual.
      for (const p of profiles) {
        await changeCampaignStart(p.id, resolved.startKey, resolved.joinedKey);
      }
    }
    await db.kv.put({ key: KV_ONBOARDED, value: true });
    onDone();
  };

  if (step === "fecha" && chosen) {
    return (
      <main className="screen onboarding">
        <div className="stack">
          <div className="onboarding__mast">
            <PxSprite frames={[ANVIL_C]} palette={PAL_C} scale={4} label="Yunque de la Forja" />
            <h1 className="px-title">¿Cuándo se enciende?</h1>
            <p className="small dim">
              Elige el inicio de la campaña. Los días anteriores a tu entrada
              nunca contarán como misiones perdidas.
            </p>
          </div>

          <div className="stack stack--tight" role="radiogroup" aria-label="Fecha de inicio">
            <button
              type="button"
              role="radio"
              aria-checked={startChoice === "hoy"}
              className={`datechoice${startChoice === "hoy" ? " datechoice--sel" : ""}`}
              onClick={() => setStartChoice("hoy")}
            >
              <b>Empezar hoy</b>
              <span className="small dim">
                La semana actual es el capítulo 1. Tu objetivo de esta semana se
                ajusta a los días que quedan: entrar en {formatDateShort(today)}{" "}
                no marca nada como fallado.
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={startChoice === "lunes"}
              className={`datechoice${startChoice === "lunes" ? " datechoice--sel" : ""}`}
              onClick={() => setStartChoice("lunes")}
            >
              <b>Empezar el próximo lunes</b>
              <span className="small dim">
                Capítulo 1 completo desde el {formatDateShort(isMonday ? thisMonday : nextMonday)}.
                Hasta entonces, prólogo: puedes estudiar el Códice o entrenar
                sin que cuente para la campaña.
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={startChoice === "manual"}
              className={`datechoice${startChoice === "manual" ? " datechoice--sel" : ""}`}
              onClick={() => setStartChoice("manual")}
            >
              <b>Elegir una fecha</b>
              <span className="small dim">
                La campaña arrancará el lunes de la semana elegida. Útil si
                vuelves de viaje o esperas a tu compañero de fragua.
              </span>
            </button>
            {startChoice === "manual" && (
              <input
                type="date"
                className="date-input"
                aria-label="Fecha de inicio de la campaña"
                min={todayKey}
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
              />
            )}
          </div>

          <p className="small dim">
            Podrás cambiar esta fecha desde Perfil mientras no registres
            ninguna sesión.
          </p>

          <PixelButton
            tone="primary"
            big
            block
            disabled={startChoice === "manual" && !manualKey}
            onClick={() => setStep("tutorial")}
          >
            Continuar
          </PixelButton>
          <PixelButton
            tone="ghost"
            sans
            block
            disabled={startChoice === "manual" && !manualKey}
            onClick={() => chosen && finish(chosen)}
          >
            Omitir el tutorial
          </PixelButton>
        </div>
      </main>
    );
  }

  if (step === "tutorial" && chosen) {
    return (
      <main className="screen onboarding">
        <div className="stack">
          <div className="onboarding__mast">
            <PxSprite frames={[ANVIL_C]} palette={PAL_C} scale={4} label="Yunque de la Forja" />
            <h1 className="px-title">Así se forja</h1>
          </div>
          <div className="panel">
            <ul className="onboarding__list">
              <li>
                <PxSprite frames={[G_HAMMER]} palette={PAL_C} scale={2} />
                <div>
                  <b>Misión</b>
                  <p>Cada entrenamiento programado es una misión. Ábrela y sigue las etapas.</p>
                </div>
              </li>
              <li>
                <PxSprite frames={[G_STAR]} palette={PAL_C} scale={2} />
                <div>
                  <b>Serie</b>
                  <p>Apunta peso, repeticiones y guarda. El descanso arranca solo.</p>
                </div>
              </li>
              <li>
                <span className="onboarding__rir">RIR</span>
                <div>
                  <b>RIR</b>
                  <p>Repeticiones que te quedaban en reserva. Sé honesto: 1–2 es la zona útil.</p>
                </div>
              </li>
              <li>
                <FlameSprite state="roja" scale={2} />
                <div>
                  <b>Llama semanal</b>
                  <p>Se pone al rojo al cumplir tus misiones de la semana. Descansar nunca la apaga.</p>
                </div>
              </li>
            </ul>
          </div>
          <PixelButton tone="primary" big block onClick={() => finish(chosen)}>
            A la fragua
          </PixelButton>
        </div>
      </main>
    );
  }

  return (
    <main className="screen onboarding">
      <div className="stack">
        <div className="onboarding__mast">
          <PxSprite frames={[ANVIL_C]} palette={PAL_C} scale={4} />
          <h1 className="px-title">FORJA</h1>
          <p className="small dim">La campaña de hipertrofia de seis semanas</p>
        </div>
        <PixelFrame as="section">
          <div className="field-label">
            <span>¿Quién entrena?</span>
          </div>
          <div className="profile-switch">
            {profiles.map((p) => {
              const lv = levelFromXp(p.xp);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`profile-switch__card${chosen === p.id ? " profile-switch__card--active" : ""}`}
                  aria-pressed={chosen === p.id}
                  onClick={() => setChosen(p.id)}
                >
                  <PxSprite
                    frames={avatarFrames(p.avatarId, "neutral").frames}
                    palette={PAL_C}
                    fps={avatarFrames(p.avatarId, "neutral").fps}
                    scale={2}
                    label={`Avatar de ${p.name}`}
                  />
                  <span className="profile-switch__name">{p.name}</span>
                  <span className="profile-switch__meta">
                    Nv. {lv.level} · {p.weeklyTarget} misiones/semana
                  </span>
                </button>
              );
            })}
          </div>
          <p className="small dim" style={{ marginTop: 12 }}>
            Después puedes cambiar de forjador desde Perfil.
          </p>
        </PixelFrame>
        <PixelButton
          tone="primary"
          big
          block
          disabled={!chosen}
          onClick={() => setStep("fecha")}
        >
          Continuar
        </PixelButton>
      </div>
    </main>
  );
}
