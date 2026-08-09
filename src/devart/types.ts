// Contrato de cada dirección artística del laboratorio (solo desarrollo).

import type { ComponentType } from "react";

export interface ArtDirection {
  id: "a" | "b" | "c";
  nombre: string;
  claim: string;
  /** Clase raíz de la dirección: aísla su CSS (p. ej. "dir-a"). */
  rootClass: string;
  /** Art bible completa y visible. */
  Bible: ComponentType;
  /** Todos los sprites y fotogramas, inspeccionables. */
  Sprites: ComponentType;
  /** Motion lab interactivo con las 7 secuencias. */
  MotionLab: ComponentType;
  /** Data-viz lab con metáforas de forja y datos reales legibles. */
  DataLab: ComponentType;
  /** Vertical slice animada: hoy/registro/descanso/campaña/progreso/final.
   *  Recibe la subpantalla activa para poder capturarla por URL. */
  Slice: ComponentType<{ screen: SliceScreen }>;
}

export type SliceScreen =
  | "hoy"
  | "registro"
  | "descanso"
  | "campana"
  | "progreso"
  | "final";

export const SLICE_SCREENS: { id: SliceScreen; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "registro", label: "Registro" },
  { id: "descanso", label: "Descanso" },
  { id: "campana", label: "Campaña" },
  { id: "progreso", label: "Progreso" },
  { id: "final", label: "Final" }
];
