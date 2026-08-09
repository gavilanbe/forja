// Frontera de sincronización remota. La v1 funciona 100 % en local:
// LocalOnlyAdapter no habla con ninguna red y no encola operaciones.
// Un adaptador remoto (p. ej. Supabase) implementaría esta misma interfaz
// sin cambiar ni una línea del flujo de entrenamiento, que es local-first.

import { db, stamp } from "../db/db";
import type { SyncOp } from "../db/types";

export interface SyncAdapter {
  /** Nombre visible en Perfil → Datos */
  name: string;
  /** true si existe un remoto real; false = modo solo local */
  remote: boolean;
  /** Envía operaciones pendientes. Debe ser reintentable e idempotente. */
  push(ops: SyncOp[]): Promise<void>;
}

export const localOnlyAdapter: SyncAdapter = {
  name: "Solo en este dispositivo",
  remote: false,
  async push() {
    // Sin remoto: nada que enviar. Los datos ya están seguros en IndexedDB.
  }
};

/** Adaptador activo de la build. Cambiar aquí cuando exista un remoto autorizado. */
export const syncAdapter: SyncAdapter = localOnlyAdapter;

/** Encola una operación solo si hay remoto configurado (cola no bloqueante). */
export const enqueueOp = async (
  profileId: string,
  entity: string,
  entityId: string,
  op: "put" | "delete",
  payload: unknown
): Promise<void> => {
  if (!syncAdapter.remote) return;
  const record: SyncOp = {
    ...stamp(),
    profileId,
    entity,
    entityId,
    op,
    payload,
    attempts: 0,
    syncStatus: "pendiente"
  };
  await db.syncQueue.add(record);
};

export type SyncUiState =
  | { kind: "local" }
  | { kind: "sincronizado" }
  | { kind: "pendiente"; count: number }
  | { kind: "error"; count: number };

export const syncUiState = (pendingCount: number, errorCount: number): SyncUiState => {
  if (!syncAdapter.remote) return { kind: "local" };
  if (errorCount > 0) return { kind: "error", count: errorCount };
  if (pendingCount > 0) return { kind: "pendiente", count: pendingCount };
  return { kind: "sincronizado" };
};
