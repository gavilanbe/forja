import Dexie, { type Table } from "dexie";
import type {
  DiscomfortNote,
  GameEvent,
  KvEntry,
  Prefs,
  Profile,
  Session,
  SessionNote,
  SetLog,
  SyncOp
} from "./types";

export const SCHEMA_VERSION = 2;

export class ForjaDB extends Dexie {
  profiles!: Table<Profile, string>;
  sessions!: Table<Session, string>;
  setLogs!: Table<SetLog, string>;
  discomforts!: Table<DiscomfortNote, string>;
  gameEvents!: Table<GameEvent, string>;
  prefs!: Table<Prefs, string>;
  syncQueue!: Table<SyncOp, string>;
  kv!: Table<KvEntry, string>;
  notes!: Table<SessionNote, string>;

  constructor(name = "forja") {
    super(name);
    this.version(1).stores({
      profiles: "id, name",
      sessions: "id, profileId, dateKey, status, [profileId+dateKey], [profileId+status], [profileId+dayId]",
      setLogs:
        "id, sessionId, profileId, exerciseId, [sessionId+exerciseId], [profileId+exerciseId], [profileId+dayId+exerciseId], createdAt",
      discomforts: "id, profileId, sessionId, exerciseId, [profileId+exerciseId], createdAt",
      gameEvents: "id, profileId, type, createdAt, [profileId+type]",
      prefs: "id, profileId",
      syncQueue: "id, profileId, entity, createdAt",
      kv: "key"
    });
    // v2: notas opcionales por ejercicio dentro de una sesión.
    this.version(SCHEMA_VERSION).stores({
      notes: "id, profileId, sessionId, [sessionId+exerciseId]"
    });
  }
}

export const db = new ForjaDB();

export const now = () => Date.now();

export const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Campos base de un registro nuevo. */
export const stamp = () => {
  const t = now();
  return {
    id: uuid(),
    createdAt: t,
    updatedAt: t,
    localVersion: 1,
    syncStatus: "local" as const
  };
};

/** Marca de actualización de un registro existente. */
export const touch = <T extends { updatedAt: number; localVersion: number }>(r: T): T => ({
  ...r,
  updatedAt: now(),
  localVersion: r.localVersion + 1
});
