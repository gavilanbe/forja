// Exportación e importación de la base local a JSON.
// La importación valida ESTRUCTURA, RELACIONES y RANGOS antes de tocar la
// base, siempre requiere confirmación explícita en la UI y es transaccional:
// si algo falla a mitad, IndexedDB revierte y los datos previos quedan
// intactos. Una copia inválida jamás borra nada.

import { db, SCHEMA_VERSION } from "../db/db";
import { ROUTINE_VERSION, CAMPAIGN_WEEKS } from "../data/routine";
import { variantIdFromLegacyText } from "../data/variants";
import type { Campaign, GameEvent, Profile, Session, SetLog } from "../db/types";

export interface BackupFile {
  app: "forja";
  schemaVersion: number;
  routineVersion: string;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

const TABLES = [
  "profiles",
  "campaigns",
  "sessions",
  "setLogs",
  "discomforts",
  "gameEvents",
  "prefs",
  "syncQueue",
  "kv",
  "notes",
  "gymSettings",
  "customRoutines",
  "calendarOverrides",
  "codexPrefs",
  "unlocks"
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

export interface ValidationIssue {
  table: string;
  index: number;
  detail: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  counts?: Record<string, number>;
  /** Problemas concretos (máx. 20) para el mensaje de error. */
  issues?: ValidationIssue[];
  /** true si la copia es de un esquema anterior y será migrada al importar. */
  legacy?: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const hasBase = (r: Record<string, unknown>): string | null => {
  if (typeof r.id !== "string" || r.id === "") return "sin id";
  if (typeof r.createdAt !== "number") return "sin createdAt";
  if (typeof r.updatedAt !== "number") return "sin updatedAt";
  return null;
};

/** Validación profunda por tabla: esquema, rangos y coherencia básica. */
const validateRow = (
  table: string,
  r: unknown
): string | null => {
  if (table === "kv") {
    return isRecord(r) && typeof r.key === "string" ? null : "entrada kv inválida";
  }
  if (!isRecord(r)) return "no es un objeto";
  const baseIssue = hasBase(r);
  if (baseIssue) return baseIssue;

  switch (table) {
    case "profiles": {
      if (typeof r.name !== "string" || !r.name) return "perfil sin nombre";
      if (typeof r.xp !== "number" || r.xp < 0) return "xp inválida";
      if (typeof r.campaignStart !== "string" || !DATE_KEY_RE.test(r.campaignStart))
        return "campaignStart inválido";
      return null;
    }
    case "campaigns": {
      if (typeof r.profileId !== "string") return "campaña sin perfil";
      if (typeof r.startKey !== "string" || !DATE_KEY_RE.test(r.startKey as string))
        return "startKey inválido";
      if (r.status !== "activa" && r.status !== "archivada") return "estado inválido";
      return null;
    }
    case "sessions": {
      if (typeof r.profileId !== "string") return "sesión sin perfil";
      if (typeof r.dateKey !== "string" || !DATE_KEY_RE.test(r.dateKey as string))
        return "dateKey inválido";
      const validStatus = ["activa", "completada", "adaptada", "parcial", "abandonada"];
      if (!validStatus.includes(r.status as string)) return "estado de sesión inválido";
      return null;
    }
    case "setLogs": {
      if (typeof r.profileId !== "string") return "serie sin perfil";
      if (typeof r.sessionId !== "string") return "serie sin sesión";
      const w = r.weightKg;
      const reps = r.reps;
      const rir = r.rir;
      if (typeof w !== "number" || w < 0 || w > 1000) return "peso fuera de rango";
      if (typeof reps !== "number" || reps < 0 || reps > 200)
        return "repeticiones fuera de rango";
      if (typeof rir !== "number" || rir < 0 || rir > 4) return "RIR fuera de rango";
      if (!r.skipped && reps === 0) return "serie no omitida con 0 repeticiones";
      return null;
    }
    case "gameEvents": {
      if (typeof r.profileId !== "string") return "evento sin perfil";
      if (typeof r.xp !== "number" || r.xp < 0 || r.xp > 1000)
        return "xp de evento fuera de rango";
      return null;
    }
    case "discomforts": {
      const level = r.level;
      if (typeof level !== "number" || level < 0 || level > 10)
        return "nivel de molestia fuera de rango";
      return null;
    }
    default:
      return null;
  }
};

export const validateBackup = (raw: unknown): ValidationResult => {
  if (!isRecord(raw)) {
    return { ok: false, error: "El archivo no es un JSON válido de FORJA." };
  }
  const b = raw as Partial<BackupFile>;
  if (b.app !== "forja") {
    return { ok: false, error: "El archivo no es una copia de seguridad de FORJA." };
  }
  if (typeof b.schemaVersion !== "number" || b.schemaVersion < 1) {
    return { ok: false, error: "La copia no declara una versión de esquema válida." };
  }
  if (b.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `La copia usa un esquema (${b.schemaVersion}) más nuevo que esta app (${SCHEMA_VERSION}). Actualiza FORJA antes de importar.`
    };
  }
  if (!isRecord(b.tables)) {
    return { ok: false, error: "La copia no contiene tablas de datos." };
  }

  const counts: Record<string, number> = {};
  const issues: ValidationIssue[] = [];
  for (const t of TABLES) {
    const rows = (b.tables as Record<string, unknown>)[t];
    if (rows !== undefined && !Array.isArray(rows)) {
      return { ok: false, error: `La tabla «${t}» de la copia está corrupta.` };
    }
    counts[t] = Array.isArray(rows) ? rows.length : 0;
    if (Array.isArray(rows)) {
      rows.forEach((r, i) => {
        if (issues.length >= 20) return;
        const issue = validateRow(t, r);
        if (issue) issues.push({ table: t, index: i, detail: issue });
      });
    }
  }
  if (!counts.profiles) {
    return { ok: false, error: "La copia no contiene ningún perfil." };
  }

  // Relaciones: sesiones→perfil, series→sesión, campañas→perfil.
  const tables = b.tables as Record<string, unknown[]>;
  const profileIds = new Set(
    (tables.profiles ?? []).filter(isRecord).map((p) => p.id as string)
  );
  const sessionIds = new Set(
    (tables.sessions ?? []).filter(isRecord).map((s) => s.id as string)
  );
  (tables.sessions ?? []).filter(isRecord).forEach((s, i) => {
    if (issues.length < 20 && !profileIds.has(s.profileId as string)) {
      issues.push({ table: "sessions", index: i, detail: "sesión de un perfil inexistente" });
    }
  });
  (tables.setLogs ?? []).filter(isRecord).forEach((s, i) => {
    if (issues.length < 20 && !sessionIds.has(s.sessionId as string)) {
      issues.push({ table: "setLogs", index: i, detail: "serie de una sesión inexistente" });
    }
  });
  (tables.campaigns ?? []).filter(isRecord).forEach((c, i) => {
    if (issues.length < 20 && !profileIds.has(c.profileId as string)) {
      issues.push({ table: "campaigns", index: i, detail: "campaña de un perfil inexistente" });
    }
  });

  if (issues.length > 0) {
    const sample = issues
      .slice(0, 3)
      .map((i) => `${i.table}[${i.index}]: ${i.detail}`)
      .join(" · ");
    return {
      ok: false,
      error: `La copia contiene ${issues.length}${issues.length >= 20 ? "+" : ""} registros inválidos (${sample}). No se importó nada: tus datos siguen intactos.`,
      counts,
      issues
    };
  }

  return { ok: true, counts, legacy: b.schemaVersion < SCHEMA_VERSION };
};

/**
 * Normaliza una copia de esquema anterior al formato v3 (misma lógica que la
 * migración de la base): campañas sintéticas, dedupeKeys, variantes.
 */
const normalizeLegacy = (b: BackupFile): BackupFile => {
  if (b.schemaVersion >= SCHEMA_VERSION) return b;
  const t = Date.now();
  const base = () => ({
    createdAt: t,
    updatedAt: t,
    localVersion: 1,
    syncStatus: "local" as const
  });
  const tables = { ...b.tables };
  const profiles = (tables.profiles ?? []) as Profile[];
  const campaignByProfile = new Map<string, string>();
  const campaigns: Campaign[] = (tables.campaigns as Campaign[] | undefined) ?? [];
  for (const p of profiles) {
    if (campaigns.some((c) => c.profileId === p.id)) continue;
    const id = `campana-${p.id}-1`;
    campaignByProfile.set(p.id, id);
    campaigns.push({
      id,
      ...base(),
      profileId: p.id,
      startKey: p.campaignStart,
      joinedKey: p.campaignStart,
      routineVersion: ROUTINE_VERSION,
      scheduleId: p.scheduleId,
      weeklyTarget: p.weeklyTarget,
      weeksTotal: CAMPAIGN_WEEKS,
      status: "activa"
    });
  }
  tables.campaigns = campaigns;
  tables.sessions = ((tables.sessions ?? []) as Session[]).map((s) => ({
    ...s,
    campaignId: s.campaignId ?? campaignByProfile.get(s.profileId)
  }));
  tables.setLogs = ((tables.setLogs ?? []) as SetLog[]).map((s) => ({
    ...s,
    campaignId: s.campaignId ?? campaignByProfile.get(s.profileId),
    variantId: s.variantId ?? variantIdFromLegacyText(s.exerciseId, s.altExerciseId)
  }));
  tables.gameEvents = ((tables.gameEvents ?? []) as GameEvent[]).map((e) => {
    if (e.dedupeKey) return e;
    let dedupeKey = `legado:${e.id}`;
    if ((e.type === "mision-completada" || e.type === "mision-adaptada") && e.sessionId) {
      dedupeKey = `mision:${e.sessionId}`;
    } else if (e.type === "capitulo-completado" && e.label?.startsWith("capitulo-")) {
      dedupeKey = `capitulo:${campaignByProfile.get(e.profileId)}:${e.label.slice("capitulo-".length)}`;
    }
    return { ...e, campaignId: e.campaignId ?? campaignByProfile.get(e.profileId), dedupeKey };
  });
  return { ...b, schemaVersion: SCHEMA_VERSION, tables };
};

/**
 * Reemplaza el contenido local por la copia. Solo llamar tras confirmación
 * y validación. Transaccional: cualquier fallo revierte TODO y la base
 * queda como estaba.
 */
export const importBackup = async (raw: BackupFile): Promise<void> => {
  const validation = validateBackup(raw);
  if (!validation.ok) {
    throw new Error(validation.error ?? "Copia inválida.");
  }
  const b = normalizeLegacy(raw);
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
