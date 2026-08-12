// MI GIMNASIO: configuración del equipamiento real por ejercicio/variante y
// por perfil (Nahuel y Carlos no comparten máquinas ni ajustes). Offline
// total; se incluye en la copia de seguridad como cualquier otra tabla.

import { db, now, touch } from "../db/db";
import type { GymSetting, WeightUnit } from "../db/types";

export const KG_PER_LB = 0.45359237;

/** ID determinista: un ajuste por (perfil, ejercicio, variante). */
export const gymSettingId = (
  profileId: string,
  exerciseId: string,
  variantId?: string
): string => `gym:${profileId}:${exerciseId}:${variantId ?? "principal"}`;

export const getGymSetting = async (
  profileId: string,
  exerciseId: string,
  variantId?: string
): Promise<GymSetting | undefined> =>
  await db.gymSettings.get(gymSettingId(profileId, exerciseId, variantId));

/**
 * Ajuste efectivo para registrar: primero el de la variante concreta, si no
 * el del ejercicio principal (útil para asiento/notas compartidas).
 */
export const effectiveGymSetting = async (
  profileId: string,
  exerciseId: string,
  variantId?: string
): Promise<GymSetting | undefined> => {
  if (variantId) {
    const v = await getGymSetting(profileId, exerciseId, variantId);
    if (v) return v;
  }
  return await getGymSetting(profileId, exerciseId);
};

export const saveGymSetting = async (
  profileId: string,
  exerciseId: string,
  variantId: string | undefined,
  patch: Partial<GymSetting>
): Promise<GymSetting> => {
  const id = gymSettingId(profileId, exerciseId, variantId);
  const existing = await db.gymSettings.get(id);
  const t = now();
  const record: GymSetting = existing
    ? touch({ ...existing, ...patch })
    : {
        id,
        createdAt: t,
        updatedAt: t,
        localVersion: 1,
        syncStatus: "local",
        profileId,
        exerciseId,
        variantId,
        ...patch
      };
  await db.gymSettings.put(record);
  return record;
};

export const listGymSettings = async (profileId: string): Promise<GymSetting[]> =>
  await db.gymSettings.where("profileId").equals(profileId).toArray();

/** Incremento real de la máquina, si está configurado. */
export const effectiveIncrement = (
  setting: GymSetting | undefined,
  fallbackKg: number
): number => setting?.minIncrementKg ?? fallbackKg;

/** Unidad efectiva del ejercicio (kg por defecto). */
export const effectiveUnit = (setting: GymSetting | undefined): WeightUnit =>
  setting?.unit ?? "kg";

/** Conversión para MOSTRAR; la base siempre guarda kg. */
export const displayWeight = (weightKg: number, unit: WeightUnit): number =>
  unit === "kg" ? weightKg : Math.round((weightKg / KG_PER_LB) * 10) / 10;

export const parseWeightToKg = (value: number, unit: WeightUnit): number =>
  unit === "kg" ? value : Math.round(value * KG_PER_LB * 100) / 100;

/** Resumen corto del montaje para precargar en el entrenamiento. */
export const setupSummary = (s: GymSetting | undefined): string | null => {
  if (!s) return null;
  const parts = [
    s.machineName,
    s.seatPosition && `asiento ${s.seatPosition}`,
    s.backPosition && `respaldo ${s.backPosition}`,
    s.pulleyHeight && `polea ${s.pulleyHeight}`,
    s.gripAccessory && `agarre ${s.gripAccessory}`
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
};
