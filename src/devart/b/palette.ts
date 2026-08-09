// Dirección B — CÓDICE TÁCTICO. Paleta de mesa de delineante (14 colores).
// Iluminación plana y documental: el volumen se dibuja con rayado de líneas
// de 1px (hatching), nunca con degradados ni glow. La tinta de hierro (k)
// hace todos los contornos; el cian es SOLO línea de delineante.
//
// Los caracteres estructurales `s`/`S` (camisa) y `h`/`H` (pelo) apuntan a
// colores ya existentes de la paleta: permiten derivar a Carlos por remap
// sin añadir colores nuevos.

import type { Palette } from "../engine";

export const PAL_B: Palette = {
  k: "#1d242e", // tinta de hierro — contorno y grabado
  b: "#0d151c", // pizarra blueprint (fondo)
  c: "#59c2c9", // línea de delineante (cian)
  C: "#274b52", // cian tenue (rejilla, cota secundaria)
  p: "#e8d8b0", // pergamino / piel grabada
  P: "#c9b689", // pergamino sombra / rayado de piel
  a: "#55677f", // acero grabado
  A: "#93a5c4", // acero claro
  l: "#c9944a", // latón
  L: "#8a6430", // latón profundo / cuero / castaño
  v: "#4f9c8c", // verdín (adaptación, zona buena)
  r: "#a33b34", // lacre
  R: "#d8635a", // lacre claro
  w: "#f4ecd8", // blanco papel
  // Alias estructurales (mismos hex de arriba; ver nota)
  s: "#f4ecd8", // camisa Nahuel = blanco papel
  S: "#c9b689", // sombra camisa Nahuel = pergamino sombra
  h: "#1d242e", // pelo Nahuel = tinta de hierro
  H: "#55677f", // brillo pelo Nahuel = acero grabado
};
