// Dirección A — FORJA MONUMENTAL. Paleta e iluminación.
// Regla de luz: la fragua es la única luz clave, baja y a la izquierda;
// todo sprite recibe subrayado cálido abajo-izquierda (e/y) y un rim frío
// arriba-derecha (H). El negro puro solo silueta exterior.

import type { Palette } from "../engine";

export const PAL_A: Palette = {
  // Estructura fría
  k: "#05060a", // silueta exterior
  K: "#10141d", // hierro en sombra
  I: "#1c2433", // hierro
  S: "#2e3b52", // acero
  s: "#49597a", // acero claro
  H: "#93a5c4", // rim frío
  // Calor
  D: "#3a1408", // brasa en sombra
  E: "#7c2d12", // brasa oscura
  e: "#c2532a", // brasa
  O: "#ff873d", // naranja de fragua
  y: "#ffb347", // ámbar
  Y: "#ffd166", // oro
  w: "#ffe9b3", // metal caliente
  W: "#fffbe8", // blanco incandescente
  // Personajes
  "1": "#d99e77", // piel Nahuel
  "2": "#a06a48", // piel Nahuel sombra
  "4": "#23252d", // pelo Nahuel
  "5": "#e9bd8f", // piel Carlos
  "6": "#b07c50", // piel Carlos sombra
  "7": "#5c4330", // pelo Carlos
  b: "#65a8ff", // azul (camiseta Carlos)
  B: "#3c6ea8", // azul profundo
  // Materia
  o: "#6b4a2f", // madera / cuero
  q: "#4a3220", // cuero oscuro
  // Señales
  d: "#50e3c2", // temple / correcto
  r: "#f25f5c" // alarma
};
