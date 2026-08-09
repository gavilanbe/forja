import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Prefs, Profile } from "../db/types";
import { KV_ACTIVE_PROFILE } from "../logic/session";
import { PROFILE_NAHUEL } from "../db/seed";
import { forjaNow } from "../logic/clock";

export const useActiveProfile = (): Profile | undefined =>
  useLiveQuery(async () => {
    const row = await db.kv.get(KV_ACTIVE_PROFILE);
    const id = (row?.value as string) ?? PROFILE_NAHUEL;
    return (await db.profiles.get(id)) ?? (await db.profiles.toCollection().first());
  }, []);

export const usePrefs = (profileId: string | undefined): Prefs | undefined =>
  useLiveQuery(
    async () =>
      profileId
        ? await db.prefs.where("profileId").equals(profileId).first()
        : undefined,
    [profileId]
  );

/** Fecha actual; se refresca al volver a primer plano (cambio de día incluido). */
export const useToday = (): Date => {
  const [today, setToday] = useState(() => forjaNow());
  useEffect(() => {
    const refresh = () => setToday(forjaNow());
    document.addEventListener("visibilitychange", refresh);
    const id = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(id);
    };
  }, []);
  return today;
};

/** ¿Hay conexión? Solo informativo: nada del flujo de entrenamiento la usa. */
export const useOnline = (): boolean => {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
};

export const usePendingSync = (): { pending: number; errors: number } => {
  const counts = useLiveQuery(async () => {
    const all = await db.syncQueue.toArray();
    return {
      pending: all.filter((o) => o.syncStatus === "pendiente" || o.syncStatus === "sincronizando").length,
      errors: all.filter((o) => o.syncStatus === "error").length
    };
  }, []);
  return counts ?? { pending: 0, errors: 0 };
};
