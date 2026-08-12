// Campañas como entidades independientes. Cada perfil tiene como mucho UNA
// campaña activa; iniciar una nueva archiva la anterior conservando todo su
// historial (sesiones, series, eventos) ligado a su campaignId. Las
// estadísticas nunca se mezclan entre campañas.

import { db, now, stamp, touch } from "../db/db";
import type { Campaign, GameEvent, Profile, Session } from "../db/types";
import { CAMPAIGN_WEEKS, ROUTINE_VERSION } from "../data/routine";
import { summarizeWeeks, type WeekSummary } from "./streak";

export const getActiveCampaign = async (
  profileId: string
): Promise<Campaign | undefined> =>
  await db.campaigns
    .where("[profileId+status]")
    .equals([profileId, "activa"])
    .first();

export const getCampaigns = async (profileId: string): Promise<Campaign[]> =>
  (await db.campaigns.where("profileId").equals(profileId).toArray()).sort(
    (a, b) => a.startKey.localeCompare(b.startKey)
  );

/**
 * Garantiza que el perfil tiene campaña activa (instalaciones nuevas).
 * Idempotente y a prueba de llamadas concurrentes.
 */
export const ensureActiveCampaign = async (profile: Profile): Promise<Campaign> => {
  return await db.transaction("rw", [db.campaigns], async () => {
    const existing = await db.campaigns
      .where("[profileId+status]")
      .equals([profile.id, "activa"])
      .first();
    if (existing) return existing;
    const campaign: Campaign = {
      ...stamp(),
      profileId: profile.id,
      startKey: profile.campaignStart,
      joinedKey: profile.campaignStart,
      routineVersion: ROUTINE_VERSION,
      scheduleId: profile.scheduleId,
      weeklyTarget: profile.weeklyTarget,
      weeksTotal: CAMPAIGN_WEEKS,
      status: "activa"
    };
    await db.campaigns.add(campaign);
    return campaign;
  });
};

/**
 * Inicia una campaña nueva: archiva la activa (si existe) y crea la nueva.
 * Nunca puede haber dos activas: todo ocurre en una transacción.
 * Capítulos y bono de capítulo se reinician solos porque su identidad
 * (dedupeKey) incluye el campaignId nuevo.
 */
export const startNewCampaign = async (
  profile: Profile,
  startKey: string,
  joinedKey = startKey
): Promise<Campaign> => {
  return await db.transaction("rw", [db.campaigns, db.profiles], async () => {
    const active = await db.campaigns
      .where("[profileId+status]")
      .equals([profile.id, "activa"])
      .first();
    if (active) {
      await db.campaigns.put(
        touch({ ...active, status: "archivada" as const, endedAt: now() })
      );
    }
    const campaign: Campaign = {
      ...stamp(),
      profileId: profile.id,
      startKey,
      joinedKey,
      routineVersion: ROUTINE_VERSION,
      scheduleId: profile.scheduleId,
      weeklyTarget: profile.weeklyTarget,
      weeksTotal: CAMPAIGN_WEEKS,
      status: "activa"
    };
    await db.campaigns.add(campaign);
    // Espejo para compatibilidad con la lógica existente de fase/llama.
    const fresh = await db.profiles.get(profile.id);
    if (fresh) await db.profiles.put(touch({ ...fresh, campaignStart: startKey }));
    return campaign;
  });
};

/**
 * Cambia la fecha de inicio de la campaña activa. Solo permitido mientras
 * no exista ninguna sesión registrada en ella.
 */
export const changeCampaignStart = async (
  profileId: string,
  startKey: string,
  joinedKey = startKey
): Promise<{ ok: boolean; error?: string }> => {
  return await db.transaction("rw", [db.campaigns, db.profiles, db.sessions], async () => {
    const active = await db.campaigns
      .where("[profileId+status]")
      .equals([profileId, "activa"])
      .first();
    if (!active) return { ok: false, error: "No hay campaña activa." };
    const sessions = await db.sessions
      .where("[profileId+campaignId]")
      .equals([profileId, active.id])
      .count();
    if (sessions > 0) {
      return {
        ok: false,
        error:
          "Ya hay sesiones registradas en esta campaña: la fecha de inicio queda fijada."
      };
    }
    await db.campaigns.put(touch({ ...active, startKey, joinedKey }));
    const p = await db.profiles.get(profileId);
    if (p) await db.profiles.put(touch({ ...p, campaignStart: startKey }));
    return { ok: true };
  });
};

// ── Estadísticas por campaña (sin mezclar) ──────────────────────────────────

export interface CampaignStats {
  campaign: Campaign;
  sessions: Session[];
  completed: number;
  adapted: number;
  partial: number;
  abandoned: number;
  weeks: WeekSummary[];
  weeksMet: number;
  xp: number;
  hitos: number;
  totalSets: number;
}

export const campaignStats = async (
  campaign: Campaign,
  today: Date
): Promise<CampaignStats> => {
  const sessions = await db.sessions
    .where("[profileId+campaignId]")
    .equals([campaign.profileId, campaign.id])
    .toArray();
  const scheduled = sessions.filter((s) => !s.unscheduled);
  const weeks = summarizeWeeks(
    scheduled,
    campaign.startKey,
    campaign.weeklyTarget,
    today,
    campaign.weeksTotal
  );
  const events = (await db.gameEvents
    .where("[profileId+campaignId]")
    .equals([campaign.profileId, campaign.id])
    .toArray()) as GameEvent[];
  const totalSets = await db.setLogs
    .where("[profileId+campaignId]")
    .equals([campaign.profileId, campaign.id])
    .filter((s) => !s.skipped)
    .count();
  return {
    campaign,
    sessions,
    completed: scheduled.filter((s) => s.status === "completada").length,
    adapted: scheduled.filter((s) => s.status === "adaptada").length,
    partial: scheduled.filter((s) => s.status === "parcial").length,
    abandoned: scheduled.filter((s) => s.status === "abandonada").length,
    weeks,
    weeksMet: weeks.filter((w) => w.met).length,
    xp: events.reduce((a, e) => a + e.xp, 0),
    hitos: events.filter((e) => e.type === "hito").length,
    totalSets
  };
};
