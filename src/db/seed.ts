// Siembra inicial: los dos perfiles del manual y sus preferencias.
// Idempotente: solo escribe si la base está vacía.

import { db, stamp } from "./db";
import type { Prefs, Profile } from "./types";
import { addDays, dateKeyOf, mondayOf, weekdayIndex } from "../logic/dates";
import { forjaNow } from "../logic/clock";
import { KV_ACTIVE_PROFILE } from "../logic/session";
import { ROUTINE_VERSION } from "../data/routine";
import { SCHEMA_VERSION } from "./db";

export const PROFILE_NAHUEL = "perfil-nahuel";
export const PROFILE_CARLOS = "perfil-carlos";

export const ensureSeed = async (today = forjaNow()): Promise<void> => {
  // La campaña arranca esta semana solo si aún queda semana por delante
  // (instalación lunes–miércoles); si no, el capítulo 1 empieza el próximo
  // lunes y los días previos nunca se marcan como misiones perdidas.
  const monday = mondayOf(today);
  const campaignStart = dateKeyOf(
    weekdayIndex(today) <= 2 ? monday : addDays(monday, 7)
  );

  const nahuel: Profile = {
    ...stamp(),
    id: PROFILE_NAHUEL,
    name: "Nahuel",
    avatarId: "nahuel",
    scheduleId: "nahuel-5",
    weeklyTarget: 5,
    xp: 0,
    campaignStart
  };
  const carlos: Profile = {
    ...stamp(),
    id: PROFILE_CARLOS,
    name: "Carlos",
    avatarId: "carlos",
    scheduleId: "carlos-3",
    weeklyTarget: 3,
    xp: 0,
    campaignStart
  };

  const prefsFor = (profileId: string): Prefs => ({
    ...stamp(),
    id: `prefs-${profileId}`,
    profileId,
    sonido: false,
    vibracion: false,
    animacionReducida: "sistema",
    incrementoCompuesto: 2.5,
    incrementoAislamiento: 1.25
  });

  // La comprobación vive DENTRO de la transacción: dos llamadas concurrentes
  // (p. ej. StrictMode) no pueden sembrar dos veces.
  await db.transaction("rw", [db.profiles, db.prefs, db.kv], async () => {
    const count = await db.profiles.count();
    if (count > 0) return;
    await db.profiles.bulkAdd([nahuel, carlos]);
    await db.prefs.bulkAdd([prefsFor(PROFILE_NAHUEL), prefsFor(PROFILE_CARLOS)]);
    await db.kv.bulkPut([
      { key: KV_ACTIVE_PROFILE, value: PROFILE_NAHUEL },
      { key: "schemaVersion", value: SCHEMA_VERSION },
      { key: "routineVersion", value: ROUTINE_VERSION }
    ]);
  });
};

export const getActiveProfile = async (): Promise<Profile | undefined> => {
  const row = await db.kv.get(KV_ACTIVE_PROFILE);
  const id = (row?.value as string) ?? PROFILE_NAHUEL;
  return (await db.profiles.get(id)) ?? (await db.profiles.toCollection().first());
};

export const setActiveProfile = async (id: string): Promise<void> => {
  await db.kv.put({ key: KV_ACTIVE_PROFILE, value: id });
};
