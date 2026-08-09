// Perfil y datos: cambio de forjador, preferencias, instalación PWA,
// exportación e importación de la base local y versiones.

import { useEffect, useRef, useState } from "react";
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
import {
  exportBackup,
  importBackup,
  validateBackup,
  type BackupFile,
  type ValidationResult
} from "../logic/backup";
import { syncAdapter, syncUiState } from "../sync/adapter";

const APP_VERSION = "2.0.0";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function ProfileScreen() {
  const profile = useActiveProfile();
  const prefs = usePrefs(profile?.id);
  const online = useOnline();
  const { pending, errors } = usePendingSync();
  const profiles = useLiveQuery(async () => await db.profiles.toArray(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<{ id: string; name: string } | null>(
    null
  );
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
  const [importState, setImportState] = useState<
    | null
    | { kind: "confirm"; backup: BackupFile; validation: ValidationResult }
    | { kind: "error"; message: string }
    | { kind: "done" }
  >(null);
  const [exportNote, setExportNote] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
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

  const doExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forja-copia-${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNote(true);
    setTimeout(() => setExportNote(false), 4000);
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const validation = validateBackup(raw);
      if (!validation.ok) {
        setImportState({ kind: "error", message: validation.error! });
        return;
      }
      setImportState({ kind: "confirm", backup: raw as BackupFile, validation });
    } catch {
      setImportState({
        kind: "error",
        message: "No se pudo leer el archivo: no es un JSON válido."
      });
    }
  };

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
                    // Con misión activa, el cambio pide confirmación: evita
                    // saltar de forjador por un toque accidental.
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
            {profile.name === "Carlos"
              ? "Carlos entrena Torso A, Pierna A y Tirón junto a Nahuel, sin compensaciones. Si un día extra es posible, se une a Empuje o Pierna B."
              : `Objetivo de ${profile.name}: ${profile.weeklyTarget} misiones por semana. Nv. ${level.level}, ${level.titulo}.`}
          </p>
        </PixelFrame>

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
            <button
              type="button"
              className={`toggle${prefs.sonido ? " toggle--on" : ""}`}
              role="switch"
              aria-checked={prefs.sonido}
              aria-label="Sonido del temporizador"
              onClick={() => setPref({ sonido: !prefs.sonido })}
            />
          </div>
          <div className="pref-row">
            <div>
              <div className="pref-row__label">Vibración</div>
              <div className="pref-row__hint">Aviso háptico al guardar y al acabar descansos</div>
            </div>
            <button
              type="button"
              className={`toggle${prefs.vibracion ? " toggle--on" : ""}`}
              role="switch"
              aria-checked={prefs.vibracion}
              aria-label="Vibración"
              onClick={() => setPref({ vibracion: !prefs.vibracion })}
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

        {/* Datos */}
        <PixelFrame as="section">
          <div className="field-label">
            <span>Datos</span>
          </div>
          <div className="stack stack--tight">
            <div className="row">
              <StatusChip
                tone={
                  syncState.kind === "local" || syncState.kind === "sincronizado"
                    ? "done"
                    : syncState.kind === "pendiente"
                      ? "warn"
                      : "danger"
                }
                dot
                role="status"
              >
                {syncState.kind === "local" && "Modo: solo este dispositivo"}
                {syncState.kind === "sincronizado" && "Sincronizado"}
                {syncState.kind === "pendiente" &&
                  `${syncState.count} operaciones en cola — datos a salvo`}
                {syncState.kind === "error" &&
                  `${syncState.count} operaciones reintentándose — datos a salvo`}
              </StatusChip>
            </div>
            <p className="data-note">
              Todos los registros viven en la base local (IndexedDB). Adaptador
              de sincronización: {syncAdapter.name}.
              {!online && " Ahora mismo no hay conexión y no hace ninguna falta."}
            </p>
            <PixelButton tone="gold" block onClick={doExport}>
              Exportar datos a JSON
            </PixelButton>
            {exportNote && (
              <p className="small" style={{ color: "var(--done)" }} role="status">
                Copia exportada. Guárdala donde no se pierda.
              </p>
            )}
            <PixelButton tone="ghost" block onClick={() => fileRef.current?.click()}>
              Importar una copia
            </PixelButton>
            <input
              ref={fileRef}
              className="file-input"
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = "";
              }}
            />
            <p className="data-note">
              Base de datos v{SCHEMA_VERSION} · Rutina v{ROUTINE_VERSION} · App v
              {APP_VERSION}
            </p>
          </div>
        </PixelFrame>
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

      {/* Confirmación de importación */}
      <PixelModal
        open={importState?.kind === "confirm"}
        title="Importar copia de seguridad"
        onClose={() => setImportState(null)}
      >
        {importState?.kind === "confirm" && (
          <div className="stack stack--tight">
            <p className="small">
              La copia del {importState.backup.exportedAt.slice(0, 10)} contiene:
            </p>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              <li>· {importState.validation.counts?.profiles ?? 0} perfiles</li>
              <li>· {importState.validation.counts?.sessions ?? 0} sesiones</li>
              <li>· {importState.validation.counts?.setLogs ?? 0} series</li>
              <li>· {importState.validation.counts?.gameEvents ?? 0} eventos de juego</li>
            </ul>
            <div className="inline-alert" role="alert">
              Importar reemplaza TODOS los datos actuales de este dispositivo.
              Esta acción no se puede deshacer.
            </div>
            <PixelButton
              tone="danger"
              block
              onClick={async () => {
                await importBackup(importState.backup);
                setImportState({ kind: "done" });
              }}
            >
              Reemplazar mis datos
            </PixelButton>
            <PixelButton tone="ghost" block onClick={() => setImportState(null)}>
              Cancelar
            </PixelButton>
          </div>
        )}
      </PixelModal>

      {/* Resultado de importación */}
      <PixelModal
        open={importState?.kind === "error" || importState?.kind === "done"}
        title={importState?.kind === "done" ? "Copia importada" : "No se pudo importar"}
        onClose={() => setImportState(null)}
        center
      >
        <div className="stack stack--tight">
          {importState?.kind === "error" ? (
            <div className="inline-alert inline-alert--danger" role="alert">
              {importState.message} Tus datos actuales siguen intactos.
            </div>
          ) : (
            <div className="inline-alert inline-alert--done" role="status">
              Copia restaurada correctamente.
            </div>
          )}
          <PixelButton tone="gold" block onClick={() => setImportState(null)}>
            Entendido
          </PixelButton>
        </div>
      </PixelModal>
    </main>
  );
}
