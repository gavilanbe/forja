// Exportación e importación de la base local a JSON.
// La importación valida estructura y versión antes de tocar la base,
// y siempre requiere confirmación explícita en la UI.

import { db, SCHEMA_VERSION } from "../db/db";
import { ROUTINE_VERSION } from "../data/routine";

export interface BackupFile {
  app: "forja";
  schemaVersion: number;
  routineVersion: string;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

const TABLES = [
  "profiles",
  "sessions",
  "setLogs",
  "discomforts",
  "gameEvents",
  "prefs",
  "syncQueue",
  "kv",
  "notes"
] as const;

export const exportBackup = async (): Promise<BackupFile> => {
  const tables: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    tables[t] = await db.table(t).toArray();
  }
  return {
    app: "forja",
    schemaVersion: SCHEMA_VERSION,
    routineVersion: ROUTINE_VERSION,
    exportedAt: new Date().toISOString(),
    tables
  };
};

export interface ValidationResult {
  ok: boolean;
  error?: string;
  counts?: Record<string, number>;
}

export const validateBackup = (raw: unknown): ValidationResult => {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "El archivo no es un JSON válido de FORJA." };
  }
  const b = raw as Partial<BackupFile>;
  if (b.app !== "forja") {
    return { ok: false, error: "El archivo no es una copia de seguridad de FORJA." };
  }
  if (typeof b.schemaVersion !== "number" || b.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `La copia usa un esquema (${b.schemaVersion}) más nuevo que esta app (${SCHEMA_VERSION}). Actualiza FORJA antes de importar.`
    };
  }
  if (typeof b.tables !== "object" || b.tables === null) {
    return { ok: false, error: "La copia no contiene tablas de datos." };
  }
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const rows = (b.tables as Record<string, unknown>)[t];
    if (rows !== undefined && !Array.isArray(rows)) {
      return { ok: false, error: `La tabla «${t}» de la copia está corrupta.` };
    }
    counts[t] = Array.isArray(rows) ? rows.length : 0;
  }
  if (!counts.profiles) {
    return { ok: false, error: "La copia no contiene ningún perfil." };
  }
  return { ok: true, counts };
};

/** Reemplaza el contenido local por la copia. Solo llamar tras confirmación. */
export const importBackup = async (b: BackupFile): Promise<void> => {
  await db.transaction("rw", db.tables, async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = b.tables[t];
      if (Array.isArray(rows) && rows.length) {
        await db.table(t).bulkPut(rows as never[]);
      }
    }
  });
};
