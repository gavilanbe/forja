import Dexie, { type Table } from "dexie";
import type {
  CalendarOverride,
  Campaign,
  CodexPref,
  CustomRoutine,
  DiscomfortNote,
  GameEvent,
  GymSetting,
  KvEntry,
  Prefs,
  Profile,
  Session,
  SessionNote,
  SetLog,
  SyncOp,
  Unlock
} from "./types";
import { variantIdFromLegacyText } from "../data/variants";
import { ROUTINE_VERSION, CAMPAIGN_WEEKS } from "../data/routine";

export const SCHEMA_VERSION = 3;

export class ForjaDB extends Dexie {
  profiles!: Table<Profile, string>;
  campaigns!: Table<Campaign, string>;
  sessions!: Table<Session, string>;
  setLogs!: Table<SetLog, string>;
  discomforts!: Table<DiscomfortNote, string>;
  gameEvents!: Table<GameEvent, string>;
  prefs!: Table<Prefs, string>;
  syncQueue!: Table<SyncOp, string>;
  kv!: Table<KvEntry, string>;
  notes!: Table<SessionNote, string>;
  gymSettings!: Table<GymSetting, string>;
  customRoutines!: Table<CustomRoutine, string>;
  calendarOverrides!: Table<CalendarOverride, string>;
  codexPrefs!: Table<CodexPref, string>;
  unlocks!: Table<Unlock, string>;

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
    this.version(2).stores({
      notes: "id, profileId, sessionId, [sessionId+exerciseId]"
    });
    // v3: campañas como entidades, variantes estructuradas, libro mayor de XP
    // con dedupeKey único, incidencias de molestia, equipamiento (MI GIMNASIO),
    // rutinas personalizadas, calendario y cosméticos.
    this.version(SCHEMA_VERSION)
      .stores({
        campaigns: "id, profileId, status, startKey, [profileId+status]",
        sessions:
          "id, profileId, dateKey, status, campaignId, [profileId+dateKey], [profileId+status], [profileId+dayId], [profileId+campaignId], [campaignId+status]",
        setLogs:
          "id, sessionId, profileId, exerciseId, campaignId, [sessionId+exerciseId], [profileId+exerciseId], [profileId+dayId+exerciseId], [profileId+campaignId], createdAt",
        gameEvents:
          "id, profileId, type, createdAt, sessionId, campaignId, [profileId+type], &[profileId+dedupeKey], [profileId+campaignId]",
        discomforts:
          "id, profileId, sessionId, exerciseId, [profileId+exerciseId], [profileId+incidentStatus], createdAt",
        gymSettings: "id, profileId, [profileId+exerciseId]",
        customRoutines: "id, profileId",
        calendarOverrides:
          "id, profileId, campaignId, weekStartKey, [profileId+weekStartKey], [campaignId+weekStartKey]",
        codexPrefs: "id, profileId, [profileId+exerciseId]",
        unlocks: "id, profileId, &[profileId+dedupeKey]"
      })
      .upgrade(async (tx) => {
        const t = Date.now();
        const base = () => ({
          createdAt: t,
          updatedAt: t,
          localVersion: 1,
          syncStatus: "local" as const
        });

        // 1) Una campaña activa por perfil, heredada de profile.campaignStart.
        const profiles = await tx.table("profiles").toArray();
        const campaignByProfile = new Map<string, string>();
        for (const p of profiles as Profile[]) {
          const id = `campana-${p.id}-1`;
          campaignByProfile.set(p.id, id);
          await tx.table("campaigns").add({
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
          } satisfies Campaign);
        }

        // 2) Sesiones y series apuntan a su campaña; las series con texto de
        //    alternativa legado reciben su variantId estable (el texto se
        //    conserva en altExerciseId, nada se pierde).
        await tx
          .table("sessions")
          .toCollection()
          .modify((s: Session) => {
            s.campaignId = campaignByProfile.get(s.profileId);
          });
        await tx
          .table("setLogs")
          .toCollection()
          .modify((sl: SetLog) => {
            sl.campaignId = campaignByProfile.get(sl.profileId);
            if (!sl.variantId && sl.altExerciseId) {
              sl.variantId = variantIdFromLegacyText(sl.exerciseId, sl.altExerciseId);
            }
          });

        // 3) Libro mayor: dedupeKey retroactivo. Donde la identidad lógica es
        //    reconstruible (misión, capítulo) se usa; el resto conserva su
        //    unicidad con su propio id (historial intacto, sin colisiones).
        await tx
          .table("gameEvents")
          .toCollection()
          .modify((e: GameEvent) => {
            e.campaignId = campaignByProfile.get(e.profileId);
            if (e.dedupeKey) return;
            if (
              (e.type === "mision-completada" || e.type === "mision-adaptada") &&
              e.sessionId
            ) {
              e.dedupeKey = `mision:${e.sessionId}`;
            } else if (e.type === "capitulo-completado" && e.label.startsWith("capitulo-")) {
              e.dedupeKey = `capitulo:${e.campaignId}:${e.label.slice("capitulo-".length)}`;
            } else {
              e.dedupeKey = `legado:${e.id}`;
            }
          });

        // 4) Molestias: estado de incidencia inicial según severidad.
        await tx
          .table("discomforts")
          .toCollection()
          .modify((d: DiscomfortNote) => {
            if (!d.incidentStatus) {
              d.incidentStatus = d.level >= 3 ? "seguimiento" : "resuelta";
            }
          });

        // 5) La XP del perfil se deriva del libro mayor (consistencia total).
        const events = (await tx.table("gameEvents").toArray()) as GameEvent[];
        const xpByProfile = new Map<string, number>();
        for (const e of events) {
          xpByProfile.set(e.profileId, (xpByProfile.get(e.profileId) ?? 0) + e.xp);
        }
        await tx
          .table("profiles")
          .toCollection()
          .modify((p: Profile) => {
            p.xp = xpByProfile.get(p.id) ?? 0;
          });

        // 6) Temporizador por perfil: la clave global pasa a ser del perfil
        //    activo (modo ENTRENAR JUNTOS necesita un descanso por persona).
        const legacyTimer = await tx.table("kv").get("activeTimer");
        if (legacyTimer?.value) {
          const active = await tx.table("kv").get("activeProfileId");
          const pid = (active?.value as string) ?? profiles[0]?.id;
          if (pid) {
            await tx.table("kv").put({ key: `activeTimer:${pid}`, value: legacyTimer.value });
          }
          await tx.table("kv").delete("activeTimer");
        }
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
