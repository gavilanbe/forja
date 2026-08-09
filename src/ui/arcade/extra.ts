// Piezas arcade adicionales para producción: los cuatro estados de la
// Llama de la Forja (apagada · rescoldo · encendida · al rojo) y el
// puente entre los "moods" de la app y los estados del rig de personajes.

import { overlay, remap, shiftY, type Frame } from "../px";
import { FLAME_OFF_C, FLAME_ON_C } from "./props";
import { buildChar, type CharId, type StateId } from "./chars";

/** Encendida, segundo fotograma (parpadeo). */
export const FLAME_ON2_C: Frame = shiftY(
  remap(FLAME_ON_C, { W: "Y", Y: "O" }),
  1
);

/** Rescoldo: la llama apagada con una brasa viva dentro. */
export const FLAME_EMBER_C: Frame = overlay(
  FLAME_OFF_C,
  ["kOk", "kYk", "kOk"],
  4,
  6
);

/** Al rojo: núcleo blanco expandido; la recompensa trae magenta. */
export const FLAME_RED1_C: Frame = remap(FLAME_ON_C, { Y: "W" });
export const FLAME_RED2_C: Frame = overlay(
  shiftY(FLAME_RED1_C, -1),
  ["M", ".", "M"],
  1,
  2
);

/** Mood de la app → estado del rig arcade. */
export type AvatarMood = "neutral" | "preparado" | "celebrando" | "recuperando";

const MOOD_STATE: Record<AvatarMood, StateId> = {
  neutral: "neutral",
  preparado: "preparado",
  celebrando: "celebrando",
  recuperando: "descansando"
};

export const avatarFrames = (
  who: CharId,
  mood: AvatarMood
): { frames: Frame[]; fps: number } => buildChar(who, MOOD_STATE[mood]);
