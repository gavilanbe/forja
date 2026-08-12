// Cosméticos de fantasía industrial. Se desbloquean SOLO por progreso
// legítimo (misiones del plan, capítulos, hitos honestos, constancia).
// Jamás premian volumen extra, entrenar con dolor ni llegar al fallo.
// El desbloqueo es idempotente: cada item tiene una identidad única en el
// libro de unlocks (índice único por perfil).

import { db, stamp } from "../db/db";
import type { Appearance, Profile, Unlock } from "../db/types";

export type CosmeticSlot =
  | "skinTone"
  | "hair"
  | "outfit"
  | "armor"
  | "aura"
  | "frame"
  | "namePlate"
  | "theme";

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  nombre: string;
  /** Descripción visible del requisito (o "disponible desde el inicio"). */
  requisito: string;
  /** null = disponible desde el inicio. */
  rule: UnlockRule | null;
}

export type UnlockRule =
  | { kind: "misiones"; count: number }       // misiones completadas o adaptadas
  | { kind: "capitulos"; count: number }      // bonos de capítulo conseguidos
  | { kind: "hitos"; count: number }          // récords honestos
  | { kind: "campanas"; count: number }       // campañas archivadas
  | { kind: "nivel"; level: number };

export const DEFAULT_APPEARANCE: Appearance = {
  skinTone: "piel-1",
  hair: "pelo-1",
  outfit: "ropa-forja",
  armor: "sin-armadura",
  aura: "sin-aura",
  frame: "marco-hierro",
  namePlate: "placa-hierro",
  theme: "tema-brasa"
};

// Catálogo original FORJA: fantasía industrial, pixel art.
export const COSMETICS: CosmeticItem[] = [
  // Base siempre disponible
  { id: "piel-1", slot: "skinTone", nombre: "Tono 1", requisito: "Disponible desde el inicio", rule: null },
  { id: "piel-2", slot: "skinTone", nombre: "Tono 2", requisito: "Disponible desde el inicio", rule: null },
  { id: "piel-3", slot: "skinTone", nombre: "Tono 3", requisito: "Disponible desde el inicio", rule: null },
  { id: "piel-4", slot: "skinTone", nombre: "Tono 4", requisito: "Disponible desde el inicio", rule: null },
  { id: "pelo-1", slot: "hair", nombre: "Corte de fragua", requisito: "Disponible desde el inicio", rule: null },
  { id: "pelo-2", slot: "hair", nombre: "Melena templada", requisito: "Disponible desde el inicio", rule: null },
  { id: "pelo-3", slot: "hair", nombre: "Rapado de yunque", requisito: "Disponible desde el inicio", rule: null },
  { id: "ropa-forja", slot: "outfit", nombre: "Mandil de forja", requisito: "Disponible desde el inicio", rule: null },
  { id: "sin-armadura", slot: "armor", nombre: "Sin armadura", requisito: "Disponible desde el inicio", rule: null },
  { id: "sin-aura", slot: "aura", nombre: "Sin aura", requisito: "Disponible desde el inicio", rule: null },
  { id: "marco-hierro", slot: "frame", nombre: "Marco de hierro", requisito: "Disponible desde el inicio", rule: null },
  { id: "placa-hierro", slot: "namePlate", nombre: "Placa de hierro", requisito: "Disponible desde el inicio", rule: null },
  { id: "tema-brasa", slot: "theme", nombre: "Brasa", requisito: "Disponible desde el inicio", rule: null },

  // Constancia (misiones del plan: completadas o adaptadas con cabeza)
  { id: "ropa-vulcana", slot: "outfit", nombre: "Cuero vulcano", requisito: "5 misiones del plan", rule: { kind: "misiones", count: 5 } },
  { id: "ropa-fundicion", slot: "outfit", nombre: "Traje de fundición", requisito: "15 misiones del plan", rule: { kind: "misiones", count: 15 } },
  { id: "armadura-remaches", slot: "armor", nombre: "Hombreras remachadas", requisito: "10 misiones del plan", rule: { kind: "misiones", count: 10 } },
  { id: "armadura-caldera", slot: "armor", nombre: "Peto de caldera", requisito: "25 misiones del plan", rule: { kind: "misiones", count: 25 } },

  // Capítulos (semanas con el objetivo cumplido)
  { id: "aura-rescoldo", slot: "aura", nombre: "Aura de rescoldo", requisito: "1 capítulo forjado", rule: { kind: "capitulos", count: 1 } },
  { id: "aura-fragua", slot: "aura", nombre: "Aura de fragua", requisito: "3 capítulos forjados", rule: { kind: "capitulos", count: 3 } },
  { id: "aura-acero", slot: "aura", nombre: "Aura de acero vivo", requisito: "6 capítulos forjados", rule: { kind: "capitulos", count: 6 } },

  // Hitos honestos (récords con técnica, nunca al fallo)
  { id: "marco-bronce", slot: "frame", nombre: "Marco de bronce", requisito: "3 hitos de carga", rule: { kind: "hitos", count: 3 } },
  { id: "marco-acero", slot: "frame", nombre: "Marco de acero", requisito: "10 hitos de carga", rule: { kind: "hitos", count: 10 } },
  { id: "placa-bronce", slot: "namePlate", nombre: "Placa grabada", requisito: "5 hitos de carga", rule: { kind: "hitos", count: 5 } },

  // Nivel (XP legítima acumulada)
  { id: "pelo-brasas", slot: "hair", nombre: "Crin de brasas", requisito: "Nivel 5", rule: { kind: "nivel", level: 5 } },
  { id: "tema-forja-fria", slot: "theme", nombre: "Forja fría", requisito: "Nivel 3", rule: { kind: "nivel", level: 3 } },
  { id: "tema-noche-taller", slot: "theme", nombre: "Noche de taller", requisito: "Nivel 7", rule: { kind: "nivel", level: 7 } },

  // Campañas completas archivadas
  { id: "marco-leyenda", slot: "frame", nombre: "Marco de leyenda", requisito: "1 campaña archivada", rule: { kind: "campanas", count: 1 } },
  { id: "placa-oro", slot: "namePlate", nombre: "Placa de oro forjado", requisito: "2 campañas archivadas", rule: { kind: "campanas", count: 2 } }
];

export const cosmeticById = (id: string): CosmeticItem | undefined =>
  COSMETICS.find((c) => c.id === id);

export interface CosmeticProgress {
  misiones: number;
  capitulos: number;
  hitos: number;
  campanas: number;
  level: number;
}

/** Progreso legítimo del perfil, derivado del libro mayor y las campañas. */
export const cosmeticProgress = async (profile: Profile): Promise<CosmeticProgress> => {
  const events = await db.gameEvents.where("profileId").equals(profile.id).toArray();
  const campaigns = await db.campaigns.where("profileId").equals(profile.id).toArray();
  const { levelFromXp } = await import("./xp");
  return {
    misiones: events.filter(
      (e) => e.type === "mision-completada" || e.type === "mision-adaptada"
    ).length,
    capitulos: events.filter((e) => e.type === "capitulo-completado").length,
    hitos: events.filter((e) => e.type === "hito").length,
    campanas: campaigns.filter((c) => c.status === "archivada").length,
    level: levelFromXp(profile.xp).level
  };
};

export const meetsRule = (rule: UnlockRule | null, p: CosmeticProgress): boolean => {
  if (!rule) return true;
  switch (rule.kind) {
    case "misiones":
      return p.misiones >= rule.count;
    case "capitulos":
      return p.capitulos >= rule.count;
    case "hitos":
      return p.hitos >= rule.count;
    case "campanas":
      return p.campanas >= rule.count;
    case "nivel":
      return p.level >= rule.level;
  }
};

export type CosmeticState = "bloqueado" | "disponible" | "equipado";

/**
 * Sincroniza desbloqueos con el progreso actual. Idempotente por diseño:
 * cada unlock lleva dedupeKey único; repetir la sincronización jamás duplica.
 */
export const syncUnlocks = async (profile: Profile): Promise<Unlock[]> => {
  const progress = await cosmeticProgress(profile);
  const unlocked: Unlock[] = [];
  await db.transaction("rw", [db.unlocks], async () => {
    for (const item of COSMETICS) {
      if (!meetsRule(item.rule, progress)) continue;
      const dedupeKey = `unlock:${item.id}`;
      const existing = await db.unlocks
        .where("[profileId+dedupeKey]")
        .equals([profile.id, dedupeKey])
        .first();
      if (existing) continue;
      try {
        const record: Unlock = {
          ...stamp(),
          profileId: profile.id,
          itemId: item.id,
          dedupeKey
        };
        await db.unlocks.add(record);
        unlocked.push(record);
      } catch {
        // Carrera con otra sincronización: el índice único manda.
      }
    }
  });
  return unlocked;
};

export const cosmeticStateOf = (
  item: CosmeticItem,
  unlockedIds: Set<string>,
  appearance: Appearance
): CosmeticState => {
  const equipped = Object.values(appearance).includes(item.id);
  if (equipped) return "equipado";
  return unlockedIds.has(item.id) || item.rule === null ? "disponible" : "bloqueado";
};
