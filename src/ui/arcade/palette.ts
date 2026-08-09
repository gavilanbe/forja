// Dirección C — ACERO ARCADE. Paleta de recreativa: ~12 colores saturados,
// contraste altísimo. Regla de luz: luz superior simple, sombreado plano de
// 2 tonos por material, sin dithering. El contorno negro puro (#000006) es
// SIEMPRE de 2px: la silueta debe leerse a un metro.

import type { Palette } from "../px";

export const PAL_C: Palette = {
  // Estructura
  k: "#000006", // contorno negro puro
  N: "#0a0a12", // fondo negro azulado (interiores de cabina)
  // Fuego / recompensa
  O: "#ff6b1a", // naranja fuego
  o: "#c24d0e", // naranja fuego sombra
  Y: "#ffd23e", // amarillo eléctrico
  y: "#d9a413", // amarillo sombra (oro viejo)
  W: "#ffffff", // blanco impacto (flash, brillos)
  // Señales
  T: "#22d3c5", // teal neón
  t: "#128f86", // teal sombra
  M: "#ff3d81", // magenta señal (solo recompensa)
  m: "#b21f56", // magenta sombra
  R: "#ff4040", // rojo peligro
  r: "#a82424", // rojo peligro sombra
  // Acero
  S: "#9fb2d0", // acero claro
  s: "#4a5a74", // acero frío
  d: "#2b3750", // acero profundo (sombra de acero frío)
  // Personajes
  "1": "#e0a077", // piel Nahuel
  "2": "#a86a48", // piel Nahuel sombra
  "4": "#1a1c22", // pelo Nahuel
  "5": "#efc496", // piel Carlos
  "6": "#b8845a", // piel Carlos sombra
  "7": "#6b4a2c", // pelo Carlos
  // x = muñequera: se resuelve por personaje en buildChar
  x: "#e0a077"
};

/** Tabla para el fotograma FLASH: toda la silueta en blanco impacto. */
export const FLASH_TABLE: Record<string, string> = Object.fromEntries(
  Object.keys(PAL_C).map((ch) => [ch, "W"])
);
