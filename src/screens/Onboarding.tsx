// Primer arranque: elegir forjador y, si se quiere, un tutorial de una sola
// pantalla (misión, serie, RIR y Llama). Siempre se puede omitir; después,
// el cambio de perfil vive en Perfil.

import { useState } from "react";
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

export const KV_ONBOARDED = "onboardingDone";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const profiles = useLiveQuery(async () => await db.profiles.toArray(), []);
  const [chosen, setChosen] = useState<string | null>(null);
  const [step, setStep] = useState<"perfil" | "tutorial">("perfil");

  if (!profiles) return <main className="screen" />;

  const finish = async (profileId: string) => {
    await setActiveProfile(profileId);
    await db.kv.put({ key: KV_ONBOARDED, value: true });
    onDone();
  };

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
          onClick={() => setStep("tutorial")}
        >
          Continuar
        </PixelButton>
        <PixelButton
          tone="ghost"
          sans
          block
          disabled={!chosen}
          onClick={() => chosen && finish(chosen)}
        >
          Omitir el tutorial
        </PixelButton>
      </div>
    </main>
  );
}
