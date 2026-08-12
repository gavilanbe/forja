// Perfil: forjadores, apariencia y cosméticos, preferencias (incluida
// accesibilidad), MI GIMNASIO, editor de rutina, calendario semanal, fecha
// de campaña, instalación PWA y datos/copias de seguridad.

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, SCHEMA_VERSION, touch } from "../db/db";
import { setActiveProfile } from "../db/seed";
import { useActiveProfile, useOnline, usePendingSync, usePrefs } from "../ui/hooks";
import { PixelButton, PixelFrame, PixelModal, StatusChip } from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { avatarFrames } from "../ui/arcade/extra";
import { ROUTINE_VERSION } from "../data/routine";
import { levelFromXp } from "../logic/xp";
import { syncUiState } from "../sync/adapter";
import { changeCampaignStart, getActiveCampaign } from "../logic/campaigns";
import { requestNotificationPermission } from "../logic/rest";
import { dateKeyOf, formatDateShort, mondayOf, parseDateKey } from "../logic/dates";
import { GymSection } from "./profile/GymSection";
import { RoutineEditor } from "./profile/RoutineEditor";
import { CalendarSection } from "./profile/CalendarSection";
import { CosmeticsSection } from "./profile/CosmeticsSection";
import { DataSection } from "./profile/DataSection";

const APP_VERSION = "3.0.0";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** El evento se captura GLOBALMENTE al cargar el módulo: aunque el usuario
 *  no haya visitado Perfil todavía, la oferta de instalación no se pierde. */
let capturedInstallEvt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    capturedInstallEvt = e as BeforeInstallPromptEvent;
  });
}

function Toggle({
  on,
  label,
  onToggle
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`toggle${on ? " toggle--on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    >
      <span className="toggle__state">{on ? "ACTIVADO" : "DESACTIVADO"}</span>
    </button>
  );
}

export function ProfileScreen() {
  const profile = useActiveProfile();
  const prefs = usePrefs(profile?.id);
  const online = useOnline();
  const { pending, errors } = usePendingSync();
  const profiles = useLiveQuery(async () => await db.profiles.toArray(), []);

  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(
    capturedInstallEvt
  );
  const [installOpen, setInstallOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [dateNote, setDateNote] = useState<string | null>(null);

  const activeSession = useLiveQuery(
    async () =>
      profile
        ? await db.sessions
            .where("[profileId+status]")
            .equals([profile.id, "activa"])
            .first()
        : undefined,
    [profile?.id]
  );
  const campaign = useLiveQuery(
    async () => (profile ? await getActiveCampaign(profile.id) : undefined),
    [profile?.id]
  );
  const campaignSessionCount = useLiveQuery(
    async () =>
      profile && campaign
        ? await db.sessions
            .where("[profileId+campaignId]")
            .equals([profile.id, campaign.id])
            .count()
        : 0,
    [profile?.id, campaign?.id]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      capturedInstallEvt = e as BeforeInstallPromptEvent;
      setInstallEvt(capturedInstallEvt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!profile || !profiles || !prefs) return <main className="screen" />;

  const level = levelFromXp(profile.xp);
  const syncState = syncUiState(pending, errors);
  const standalone =
    typeof matchMedia !== "undefined" &&
    matchMedia("(display-mode: standalone)").matches;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const setPref = async (patch: Partial<typeof prefs>) => {
    await db.prefs.put(touch({ ...prefs, ...patch }));
  };
  const setAccessibility = async (
    patch: Partial<NonNullable<typeof profile.accessibility>>
  ) => {
    const fresh = await db.profiles.get(profile.id);
    if (!fresh) return;
    await db.profiles.put(
      touch({
        ...fresh,
        accessibility: {
          textSize: "normal",
          highContrast: false,
          ...fresh.accessibility,
          ...patch
        }
      })
    );
  };

  const canChangeStart = (campaignSessionCount ?? 0) === 0;

  return (
    <main className="screen">
      <h1 className="screen-title">Perfil</h1>
      <div className="stack">
        {/* Cambio de forjador */}
        <PixelFrame as="section">
          <div className="field-label">
            <span>Forjadores</span>
            <span className="field-label__hint">perfiles locales</span>
          </div>
          <div className="profile-switch">
            {profiles.map((p) => {
              const lv = levelFromXp(p.xp);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`profile-switch__card${
                    p.id === profile.id ? " profile-switch__card--active" : ""
                  }`}
                  aria-pressed={p.id === profile.id}
                  onClick={() => {
                    if (p.id === profile.id) return;
                    if (activeSession) setSwitchTarget({ id: p.id, name: p.name });
                    else void setActiveProfile(p.id);
                  }}
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
            {profile.avatarId === "carlos"
              ? "Carlos entrena Torso A, Pierna A y Tirón junto a Nahuel, sin compensaciones. Si un día extra es posible, se une a Empuje o Pierna B."
              : `Objetivo de ${profile.name}: ${profile.weeklyTarget} misiones por semana. Nv. ${level.level}, ${level.titulo}.`}
          </p>
        </PixelFrame>

        {/* Apariencia y cosméticos */}
        <CosmeticsSection profile={profile} />

        {/* Fecha de inicio de campaña (editable sin sesiones) */}
        {campaign && (
          <PixelFrame as="section">
            <div className="field-label">
              <span>Campaña actual</span>
              <span className="field-label__hint">
                desde {formatDateShort(parseDateKey(campaign.startKey))}
              </span>
            </div>
            {canChangeStart ? (
              <div className="stack stack--tight">
                <p className="small dim">
                  Aún sin sesiones registradas: puedes cambiar el inicio.
                </p>
                <input
                  type="date"
                  className="date-input"
                  aria-label="Nueva fecha de inicio de campaña"
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    const monday = dateKeyOf(mondayOf(parseDateKey(e.target.value)));
                    const res = await changeCampaignStart(
                      profile.id,
                      monday,
                      e.target.value
                    );
                    setDateNote(
                      res.ok
                        ? `Inicio movido al ${monday} (incorporación ${e.target.value}).`
                        : res.error ?? null
                    );
                  }}
                />
                {dateNote && (
                  <p className="small" role="status">{dateNote}</p>
                )}
              </div>
            ) : (
              <p className="small dim">
                Con sesiones ya registradas, la fecha de inicio queda fijada.
                Desde el mapa de Campaña puedes archivarla y forjar una nueva.
              </p>
            )}
          </PixelFrame>
        )}

        {/* Calendario semanal */}
        <CalendarSection profile={profile} />

        {/* Editor de rutina */}
        <RoutineEditor profile={profile} />

        {/* MI GIMNASIO */}
        <GymSection profile={profile} />

        {/* Preferencias */}
        <PixelFrame as="section">
          <div className="field-label">
            <span>Preferencias</span>
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Sonido del temporizador</div>
              <div className="pref-row__hint">Pitido breve al terminar el descanso</div>
            </div>
            <Toggle
              on={prefs.sonido}
              label="Sonido del temporizador"
              onToggle={() => setPref({ sonido: !prefs.sonido })}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Vibración</div>
              <div className="pref-row__hint">Aviso háptico al guardar y al acabar descansos</div>
            </div>
            <Toggle
              on={prefs.vibracion}
              label="Vibración"
              onToggle={() => setPref({ vibracion: !prefs.vibracion })}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Pantalla encendida en descansos</div>
              <div className="pref-row__hint">Wake Lock, si el dispositivo lo permite</div>
            </div>
            <Toggle
              on={prefs.wakeLock ?? false}
              label="Pantalla encendida en descansos"
              onToggle={() => setPref({ wakeLock: !prefs.wakeLock })}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Notificación de fin de descanso</div>
              <div className="pref-row__hint">Requiere permiso del navegador</div>
            </div>
            <Toggle
              on={prefs.notificacionDescanso ?? false}
              label="Notificación de fin de descanso"
              onToggle={async () => {
                if (!prefs.notificacionDescanso) {
                  const ok = await requestNotificationPermission();
                  await setPref({ notificacionDescanso: ok });
                } else {
                  await setPref({ notificacionDescanso: false });
                }
              }}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Modo compacto en el gimnasio</div>
              <div className="pref-row__hint">Menos texto, controles más directos</div>
            </div>
            <Toggle
              on={prefs.modoCompacto ?? false}
              label="Modo compacto en el gimnasio"
              onToggle={() => setPref({ modoCompacto: !prefs.modoCompacto })}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Animaciones</div>
              <div className="pref-row__hint">«Sistema» respeta la preferencia del dispositivo</div>
            </div>
            <div className="select-frame" style={{ minWidth: 130 }}>
              <select
                aria-label="Animaciones"
                value={prefs.animacionReducida}
                onChange={(e) =>
                  setPref({
                    animacionReducida: e.target
                      .value as typeof prefs.animacionReducida
                  })
                }
              >
                <option value="sistema">Sistema</option>
                <option value="reducida">Reducidas</option>
                <option value="completa">Completas</option>
              </select>
            </div>
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Tamaño de texto</div>
              <div className="pref-row__hint">Explicaciones y controles</div>
            </div>
            <div className="select-frame" style={{ minWidth: 130 }}>
              <select
                aria-label="Tamaño de texto"
                value={profile.accessibility?.textSize ?? "normal"}
                onChange={(e) =>
                  setAccessibility({
                    textSize: e.target.value as "normal" | "grande" | "enorme"
                  })
                }
              >
                <option value="normal">Normal</option>
                <option value="grande">Grande</option>
                <option value="enorme">Enorme</option>
              </select>
            </div>
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Alto contraste</div>
              <div className="pref-row__hint">Refuerza textos y bordes</div>
            </div>
            <Toggle
              on={profile.accessibility?.highContrast ?? false}
              label="Alto contraste"
              onToggle={() =>
                setAccessibility({
                  highContrast: !(profile.accessibility?.highContrast ?? false)
                })
              }
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Salto de carga: compuestos</div>
              <div className="pref-row__hint">Para sugerencias y botones +/−</div>
            </div>
            <div className="select-frame" style={{ minWidth: 110 }}>
              <select
                aria-label="Incremento en compuestos"
                value={String(prefs.incrementoCompuesto)}
                onChange={(e) => setPref({ incrementoCompuesto: Number(e.target.value) })}
              >
                {[1.25, 2, 2.5, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} kg
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Salto de carga: aislamientos</div>
              <div className="pref-row__hint">Poleas y máquinas de placas</div>
            </div>
            <div className="select-frame" style={{ minWidth: 110 }}>
              <select
                aria-label="Incremento en aislamientos"
                value={String(prefs.incrementoAislamiento)}
                onChange={(e) => setPref({ incrementoAislamiento: Number(e.target.value) })}
              >
                {[0.5, 1, 1.25, 2.5].map((v) => (
                  <option key={v} value={v}>
                    {v} kg
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="small dim" style={{ marginTop: 8 }}>
            MI GIMNASIO puede fijar un incremento distinto por máquina; ese
            manda sobre estos valores.
          </p>
        </PixelFrame>

        {/* Instalación */}
        <PixelFrame as="section">
          <div className="field-label">
            <span>Instalar FORJA</span>
          </div>
          {standalone ? (
            <StatusChip tone="done" dot>
              Instalada: abre sin conexión
            </StatusChip>
          ) : (
            <div className="stack stack--tight">
              <p className="small dim">
                Instalada en tu pantalla de inicio, FORJA abre al instante y
                funciona sin cobertura en el gimnasio.
              </p>
              {installEvt ? (
                <PixelButton tone="gold" block onClick={() => void installEvt.prompt()}>
                  Instalar en este dispositivo
                </PixelButton>
              ) : (
                <PixelButton tone="ghost" block onClick={() => setInstallOpen(true)}>
                  Cómo instalarla
                </PixelButton>
              )}
            </div>
          )}
        </PixelFrame>

        {/* Datos y copias */}
        <DataSection profile={profile} prefs={prefs} online={online} />

        <p className="data-note">
          Base de datos v{SCHEMA_VERSION} · Rutina v{ROUTINE_VERSION} · App v
          {APP_VERSION} ·{" "}
          {syncState.kind === "local" ? "solo este dispositivo" : syncState.kind}
        </p>
      </div>

      {/* Confirmación de cambio con misión activa */}
      <PixelModal
        open={switchTarget !== null}
        title="Cambiar de forjador"
        onClose={() => setSwitchTarget(null)}
      >
        <div className="stack stack--tight">
          <p className="small">
            Hay una misión de {profile.name} sin terminar. No se pierde nada:
            quedará esperando para cuando {profile.name} vuelva.
          </p>
          <PixelButton
            tone="gold"
            block
            onClick={async () => {
              if (switchTarget) await setActiveProfile(switchTarget.id);
              setSwitchTarget(null);
            }}
          >
            Cambiar a {switchTarget?.name}
          </PixelButton>
          <PixelButton tone="ghost" sans block onClick={() => setSwitchTarget(null)}>
            Cancelar
          </PixelButton>
        </div>
      </PixelModal>

      {/* Guía de instalación */}
      <PixelModal
        open={installOpen}
        title="Instalar FORJA"
        onClose={() => setInstallOpen(false)}
      >
        <div className="stack stack--tight">
          {isIos ? (
            <>
              <p className="small">En iPhone o iPad, con Safari:</p>
              <ol className="small" style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
                <li>Toca el botón Compartir (el cuadrado con la flecha).</li>
                <li>Elige «Añadir a pantalla de inicio».</li>
                <li>Confirma con «Añadir». Listo: abre desde el icono del yunque.</li>
              </ol>
            </>
          ) : (
            <>
              <p className="small">En Android, con Chrome:</p>
              <ol className="small" style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
                <li>Abre el menú ⋮ del navegador.</li>
                <li>Toca «Instalar aplicación» (o «Añadir a pantalla de inicio»).</li>
                <li>Confirma. FORJA quedará como app propia, lista para el gimnasio.</li>
              </ol>
            </>
          )}
          <p className="small dim">
            Tras la primera carga con conexión, la app entera funciona offline.
          </p>
          <PixelButton tone="gold" block onClick={() => setInstallOpen(false)}>
            Entendido
          </PixelButton>
        </div>
      </PixelModal>
    </main>
  );
}
