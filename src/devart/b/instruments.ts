// Dirección B — instrumentos procedimentales compartidos.
// Regletas, diales y tambores dibujados sobre el lienzo Grid.

import type { Frame } from "../engine";
import { DIGITS, Grid } from "./grid";

// ── Raíl calibrado (escala 40–50 kg) ───────────────────────────────────────

export const RAIL_MIN = 40;
export const RAIL_MAX = 50;
const RAIL_X0 = 3;
const RAIL_X1 = 117;

export const railX = (kg: number) =>
  Math.round(RAIL_X0 + ((kg - RAIL_MIN) / (RAIL_MAX - RAIL_MIN)) * (RAIL_X1 - RAIL_X0));

/** Regleta de latón con escala grabada y cursor de acero en `kg`. */
export const railGauge = (kg: number): Frame => {
  const g = new Grid(121, 12);
  g.rect(RAIL_X0, 4, RAIL_X1 - RAIL_X0 + 1, 3, "l");
  g.rect(RAIL_X0, 6, RAIL_X1 - RAIL_X0 + 1, 1, "L");
  g.rect(RAIL_X0 - 1, 3, 1, 5, "k");
  g.rect(RAIL_X1 + 1, 3, 1, 5, "k");
  for (let i = 0; i <= 8; i++) {
    const kgTick = RAIL_MIN + i * 1.25;
    const x = railX(kgTick);
    const major = i % 2 === 0;
    g.rect(x, 7, 1, major ? 3 : 2, major ? "k" : "C");
  }
  const cx = railX(kg);
  g.rect(cx - 2, 1, 5, 8, "k");
  g.rect(cx - 1, 2, 3, 6, "A");
  g.rect(cx, 4, 1, 2, "w");
  return g.frame();
};

/** Regla de cabecera de la escala (los números van en HTML). */
export const railRuler = (): Frame => {
  const g = new Grid(121, 6);
  g.rect(RAIL_X0, 4, RAIL_X1 - RAIL_X0 + 1, 1, "C");
  for (let i = 0; i <= 4; i++) {
    const x = railX(RAIL_MIN + i * 2.5);
    g.rect(x, 1, 1, 4, "c");
  }
  return g.frame();
};

// ── Dial semicircular de presión (RIR) ─────────────────────────────────────

/** Zonas: rojo 0 · latón 1 · verdín 2 · acero 3–4. Aguja al valor real. */
export const rirDial = (rir: number): Frame => {
  const g = new Grid(30, 17);
  const cx = 14.5;
  const cy = 14;
  const R = 12;
  const zoneOf = (t: number) => (t < 0.2 ? "r" : t < 0.4 ? "l" : t < 0.6 ? "v" : "a");
  for (let i = 0; i <= 44; i++) {
    const t = i / 44;
    const ang = Math.PI - t * Math.PI;
    g.set(cx + Math.cos(ang) * R, cy - Math.sin(ang) * R, zoneOf(t));
    g.set(cx + Math.cos(ang) * (R - 1), cy - Math.sin(ang) * (R - 1), zoneOf(t));
  }
  for (let z = 0; z <= 5; z++) {
    const ang = Math.PI - (z / 5) * Math.PI;
    g.set(cx + Math.cos(ang) * (R + 1), cy - Math.sin(ang) * (R + 1), "k");
  }
  // La aguja apunta al CENTRO de su zona (0→0,1 · 1→0,3 · 2→0,5 · 3→0,7 · 4→0,9)
  const angN = Math.PI - (rir * 0.2 + 0.1) * Math.PI;
  g.line(cx, cy, cx + Math.cos(angN) * (R - 4), cy - Math.sin(angN) * (R - 4), "w");
  g.rect(13, 13, 4, 2, "k");
  g.rect(14, 13, 2, 1, "A");
  g.rect(2, 16, 26, 1, "k");
  return g.frame();
};

// ── Dial genérico con aguja ────────────────────────────────────────────────

/** Aguja en `frac` (0 = izquierda, 1 = derecha); zona opcional. */
export const needleDial = (frac: number, zone: "v" | "r" | null = null): Frame => {
  const g = new Grid(26, 15);
  const cx = 12.5;
  const cy = 12;
  const R = 10;
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const ang = Math.PI - t * Math.PI;
    const ch = zone === "v" ? (t < 0.3 ? "v" : "a") : zone === "r" ? (t > 0.7 ? "r" : "a") : "a";
    g.set(cx + Math.cos(ang) * R, cy - Math.sin(ang) * R, ch);
    g.set(cx + Math.cos(ang) * (R - 1), cy - Math.sin(ang) * (R - 1), ch);
  }
  const ang = Math.PI - frac * Math.PI;
  g.line(cx, cy, cx + Math.cos(ang) * (R - 3), cy - Math.sin(ang) * (R - 3), "w");
  g.rect(11, 11, 4, 2, "k");
  g.rect(1, 14, 24, 1, "k");
  return g.frame();
};

// ── Contador de tambor mecánico ────────────────────────────────────────────

export const repsDrum = (reps: number): Frame => {
  const g = new Grid(26, 15);
  g.rect(0, 0, 26, 15, "k");
  g.rect(1, 1, 24, 13, "a");
  g.rect(2, 2, 22, 11, "k");
  const txt = String(reps).padStart(2, "0");
  [0, 1].forEach((i) => {
    const wx = 3 + i * 11;
    g.rect(wx, 3, 9, 9, "k");
    g.rect(wx + 1, 4, 7, 7, "w");
    g.stamp(DIGITS[txt[i]], wx + 3, 5);
  });
  g.set(1, 1, "A");
  g.set(24, 1, "A");
  g.set(1, 13, "A");
  g.set(24, 13, "A");
  return g.frame();
};
