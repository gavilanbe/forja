// Datos locales y copias de seguridad: almacenamiento persistente con
// explicación honesta, recordatorios de exportación, vista previa de
// importación, borrado de perfil y borrado total con confirmación reforzada.
// Ninguna importación inválida toca los datos existentes (transaccional).

import { useEffect, useRef, useState } from "react";
import { db, touch } from "../../db/db";
import type { Prefs, Profile } from "../../db/types";
import { PixelButton, PixelFrame, PixelModal, StatusChip } from "../../ui/Pixel";
import {
  exportBackup,
  importBackup,
  validateBackup,
  type BackupFile,
  type ValidationResult
} from "../../logic/backup";
import { syncAdapter } from "../../sync/adapter";

const BACKUP_REMINDER_DAYS = 14;

type StorageState =
  | { kind: "sin-soporte" }
  | { kind: "persistente" }
  | { kind: "no-persistente" };

export function DataSection({
  profile,
  prefs,
  online
}: {
  profile: Profile;
  prefs: Prefs;
  online: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [storage, setStorage] = useState<StorageState | null>(null);
  const [exportNote, setExportNote] = useState(false);
  const [importState, setImportState] = useState<
    | null
    | { kind: "confirm"; backup: BackupFile; validation: ValidationResult }
    | { kind: "error"; message: string }
    | { kind: "done" }
  >(null);
  const [deleteState, setDeleteState] = useState<
    null | { kind: "perfil" } | { kind: "todo"; step: 1 | 2; text: string }
  >(null);

  useEffect(() => {
    (async () => {
      if (!navigator.storage?.persisted) {
        setStorage({ kind: "sin-soporte" });
        return;
      }
      const persisted = await navigator.storage.persisted();
      setStorage({ kind: persisted ? "persistente" : "no-persistente" });
    })();
  }, []);

  const requestPersist = async () => {
    if (!navigator.storage?.persist) return;
    const granted = await navigator.storage.persist();
    setStorage({ kind: granted ? "persistente" : "no-persistente" });
  };

  const daysSinceBackup = prefs.backupReminderAt
    ? Math.floor((Date.now() - prefs.backupReminderAt) / 86_400_000)
    : null;
  const backupDue = daysSinceBackup === null || daysSinceBackup >= BACKUP_REMINDER_DAYS;

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
    await db.prefs.put(touch({ ...prefs, backupReminderAt: Date.now() }));
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

  const deleteProfile = async () => {
    // Borra los datos de UN perfil; el otro forjador queda intacto.
    const pid = profile.id;
    await db.transaction("rw", db.tables, async () => {
      for (const table of [
        db.sessions, db.setLogs, db.discomforts, db.gameEvents, db.notes,
        db.campaigns, db.gymSettings, db.customRoutines, db.calendarOverrides,
        db.codexPrefs, db.unlocks, db.prefs, db.syncQueue
      ]) {
        await table.where("profileId").equals(pid).delete();
      }
      await db.profiles.delete(pid);
    });
    setDeleteState(null);
  };

  const deleteAll = async () => {
    await db.delete();
    window.location.reload();
  };

  return (
    <PixelFrame as="section">
      <div className="field-label">
        <span>Datos</span>
      </div>
      <div className="stack stack--tight">
        {/* Almacenamiento persistente, contado con honestidad */}
        {storage && (
          <div className="stack stack--tight">
            <StatusChip
              tone={storage.kind === "persistente" ? "done" : "warn"}
              dot
              role="status"
            >
              {storage.kind === "persistente" && "Almacenamiento protegido por el navegador"}
              {storage.kind === "no-persistente" && "Almacenamiento no garantizado"}
              {storage.kind === "sin-soporte" && "El navegador no informa del almacenamiento"}
            </StatusChip>
            <p className="data-note">
              {storage.kind === "persistente"
                ? "El navegador se compromete a no borrar los datos de FORJA por falta de espacio. Aun así, una copia externa sigue siendo tu red de seguridad."
                : storage.kind === "no-persistente"
                  ? "El navegador PODRÍA borrar datos locales si escasea el espacio. Puedes pedirle protección; si la deniega (pasa en navegadores sin instalación), la copia JSON es tu seguro."
                  : "Sin API de persistencia: exporta copias con regularidad."}
            </p>
            {storage.kind === "no-persistente" && (
              <PixelButton tone="ghost" block onClick={requestPersist}>
                Pedir almacenamiento persistente
              </PixelButton>
            )}
          </div>
        )}

        {backupDue && (
          <div className="inline-alert" role="status">
            {daysSinceBackup === null
              ? "Todavía no has exportado ninguna copia de seguridad."
              : `Última copia hace ${daysSinceBackup} días.`}{" "}
            Exportar una copia solo cuesta un toque.
          </div>
        )}

        <p className="data-note">
          Todos los registros viven en la base local (IndexedDB). Adaptador de
          sincronización: {syncAdapter.name}.
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

        {/* Zona de peligro, separada y con recomendación de copia */}
        <details className="fold">
          <summary className="fold__head">
            <span>Zona de borrado</span>
            <span className="fold__hint">irreversible</span>
          </summary>
          <div className="fold__body stack stack--tight">
            <p className="small dim">
              Antes de borrar nada: exporta una copia. El borrado no se puede
              deshacer.
            </p>
            <PixelButton
              tone="danger"
              block
              onClick={() => setDeleteState({ kind: "perfil" })}
            >
              Eliminar el perfil de {profile.name}…
            </PixelButton>
            <PixelButton
              tone="danger"
              block
              onClick={() => setDeleteState({ kind: "todo", step: 1, text: "" })}
            >
              Eliminar TODOS los datos…
            </PixelButton>
          </div>
        </details>
      </div>

      {/* Vista previa e importación */}
      <PixelModal
        open={importState?.kind === "confirm"}
        title="Vista previa de la copia"
        onClose={() => setImportState(null)}
      >
        {importState?.kind === "confirm" && (
          <div className="stack stack--tight">
            <p className="small">
              Copia del {importState.backup.exportedAt?.slice(0, 10) ?? "?"} · esquema v
              {importState.backup.schemaVersion}
              {importState.validation.legacy &&
                " (versión anterior: se migrará automáticamente)"}
            </p>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              <li>· {importState.validation.counts?.profiles ?? 0} perfiles</li>
              <li>· {importState.validation.counts?.campaigns ?? 0} campañas</li>
              <li>· {importState.validation.counts?.sessions ?? 0} sesiones</li>
              <li>· {importState.validation.counts?.setLogs ?? 0} series</li>
              <li>· {importState.validation.counts?.gameEvents ?? 0} eventos de juego</li>
              <li>· {importState.validation.counts?.gymSettings ?? 0} ajustes de gimnasio</li>
            </ul>
            <div className="inline-alert" role="alert">
              Importar reemplaza TODOS los datos actuales de este dispositivo.
              La operación es transaccional: o entra todo, o no cambia nada.
            </div>
            <PixelButton
              tone="danger"
              block
              onClick={async () => {
                try {
                  await importBackup(importState.backup);
                  setImportState({ kind: "done" });
                } catch (e) {
                  setImportState({
                    kind: "error",
                    message: String(e instanceof Error ? e.message : e)
                  });
                }
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

      {/* Borrar perfil */}
      <PixelModal
        open={deleteState?.kind === "perfil"}
        title={`Eliminar a ${profile.name}`}
        onClose={() => setDeleteState(null)}
      >
        <div className="stack stack--tight">
          <div className="inline-alert inline-alert--danger" role="alert">
            Se borrarán TODAS las sesiones, series, XP, campañas y ajustes de{" "}
            {profile.name} en este dispositivo. El otro forjador no se toca.
          </div>
          <PixelButton tone="gold" block onClick={doExport}>
            Exportar copia antes de borrar (recomendado)
          </PixelButton>
          <PixelButton tone="danger" block onClick={deleteProfile}>
            Eliminar el perfil definitivamente
          </PixelButton>
          <PixelButton tone="ghost" block onClick={() => setDeleteState(null)}>
            Cancelar
          </PixelButton>
        </div>
      </PixelModal>

      {/* Borrado total con confirmación reforzada */}
      <PixelModal
        open={deleteState?.kind === "todo"}
        title="Eliminar todos los datos"
        onClose={() => setDeleteState(null)}
      >
        {deleteState?.kind === "todo" && (
          <div className="stack stack--tight">
            <div className="inline-alert inline-alert--danger" role="alert">
              Esto deja FORJA como recién instalada: perfiles, campañas,
              series, XP y ajustes desaparecen de este dispositivo.
            </div>
            <PixelButton tone="gold" block onClick={doExport}>
              Exportar copia antes de borrar (recomendado)
            </PixelButton>
            {deleteState.step === 1 ? (
              <PixelButton
                tone="danger"
                block
                onClick={() => setDeleteState({ kind: "todo", step: 2, text: "" })}
              >
                Continuar con el borrado…
              </PixelButton>
            ) : (
              <>
                <label className="filter-item">
                  <span className="filter-item__label">
                    Escribe BORRAR para confirmar
                  </span>
                  <input
                    type="text"
                    className="text-input"
                    value={deleteState.text}
                    onChange={(e) =>
                      setDeleteState({ kind: "todo", step: 2, text: e.target.value })
                    }
                  />
                </label>
                <PixelButton
                  tone="danger"
                  block
                  disabled={deleteState.text.trim().toUpperCase() !== "BORRAR"}
                  onClick={deleteAll}
                >
                  Eliminar absolutamente todo
                </PixelButton>
              </>
            )}
            <PixelButton tone="ghost" block onClick={() => setDeleteState(null)}>
              Cancelar
            </PixelButton>
          </div>
        )}
      </PixelModal>
    </PixelFrame>
  );
}
