// Iconos de navegación y glifos de estado en lenguaje Acero Arcade:
// silueta con contorno negro, 2 tonos por material, colores de PAL_C.

import type { Frame } from "../px";
import { PAL_C } from "./palette";

// ── Navegación inferior (14×14) ─────────────────────────────────────────────

export const NAV_HOY: Frame = [
  "..............",
  "......kk......",
  "....kkOOk.....",
  "....kOYOk.....",
  ".kkkkkkkkkkkk.",
  ".kSSSSSSSSSSk.",
  ".kssSSSSSSssk.",
  "..kkssssssk...",
  "....kssssk....",
  "....kssssk....",
  "...kssssssk...",
  "..kssssssssk..",
  ".kkkkkkkkkkkk.",
  ".............."
];

export const NAV_CAMPANA: Frame = [
  "..............",
  "..kk..........",
  "..kskkkkkkk...",
  "..kskOOOOOOk..",
  "..kskOYYOOOk..",
  "..kskOOOOOk...",
  "..kskOOOOk....",
  "..kskkkkk.....",
  "..ksk.........",
  "..ksk.........",
  "..ksk.........",
  ".kkskk........",
  ".kkkkk........",
  ".............."
];

export const NAV_PROGRESO: Frame = [
  "..............",
  "..............",
  "....kkkkkk....",
  "...kSSSSSSk...",
  "...kssssssk...",
  "..kkkkkkkkkk..",
  "..kSSSSSSSSk..",
  "..kssssssssk..",
  ".kkkkkkkkkkkk.",
  ".kSSSSSSSSSSk.",
  ".kssssssssssk.",
  ".kkkkkkkkkkkk.",
  "..............",
  ".............."
];

export const NAV_CODICE: Frame = [
  "..............",
  "..kkkkkkkkkk..",
  ".kYYYYYYYYYYk.",
  ".kYyyyyyyyyYk.",
  ".kYykkkkkyyYk.",
  ".kYyyyyyyyyYk.",
  ".kYykkkkkyyYk.",
  ".kYyyyyyyyyYk.",
  ".kYykkkyyyyYk.",
  ".kYyyyyyyyyYk.",
  ".kYYYYYYYYYYk.",
  "..kkkkkkkkkk..",
  "..............",
  ".............."
];

export const NAV_PERFIL: Frame = [
  "..............",
  "....kkkkkk....",
  "...k111111k...",
  "...k111111k...",
  "...k1k11k1k...",
  "...k111111k...",
  "....k1111k....",
  ".....k11k.....",
  "...kkkOOkkk...",
  "..kOOOOOOOOk..",
  ".kOOOOOOOOOOk.",
  ".kOooOOOOooOk.",
  ".kkkkkkkkkkkk.",
  ".............."
];

// ── Glifos de estado (10×10) ────────────────────────────────────────────────

export const G_CHECK: Frame = [
  "..........",
  ".......kk.",
  "......kTTk",
  ".....kTTk.",
  ".kk.kTTk..",
  "kTTkTTk...",
  ".kTTTk....",
  "..kTk.....",
  "...k......",
  ".........."
];

export const G_CROSS: Frame = [
  "..........",
  ".kk....kk.",
  "kRRk..kRRk",
  ".kRRkkRRk.",
  "..kRRRRk..",
  "..kRRRRk..",
  ".kRRkkRRk.",
  "kRRk..kRRk",
  ".kk....kk.",
  ".........."
];

export const G_ADAPT: Frame = [
  "....kk....",
  "...kTTk...",
  "..kTTTTk..",
  ".kTTTTTTk.",
  ".kTTkkTTk.",
  ".kTTkkTTk.",
  ".kTTTTTTk.",
  "..kTTTTk..",
  "...kTTk...",
  "....kk...."
];

export const G_STAR: Frame = [
  "....kk....",
  "...kYYk...",
  "...kYYk...",
  ".kkYYYYkk.",
  "kYYYYYYYYk",
  ".kkYYYYkk.",
  "..kYYYYk..",
  "..kYkkYk..",
  ".kYk..kYk.",
  "..k....k.."
];

export const G_LOCK: Frame = [
  "..kkkkkk..",
  ".ks....sk.",
  ".ks....sk.",
  "kYYYYYYYYk",
  "kYYkkkkYYk",
  "kYYkkkkYYk",
  "kYYYYYYYYk",
  "kYYYYYYYYk",
  ".kkkkkkkk.",
  ".........."
];

export const G_HAMMER: Frame = [
  "..kkkkkk..",
  ".kSSSSSSk.",
  ".kssSSssk.",
  ".kkkOOkkk.",
  "....kOk...",
  "....kOk...",
  "....kOk...",
  "....kOk...",
  "....kk....",
  ".........."
];

export const G_CAMP: Frame = [
  "....kk....",
  "...kOOk...",
  "..kOYYOk..",
  "..kOYWOk..",
  "...kOOk...",
  ".kk.kk.kk.",
  "kookkkkook",
  ".kookook..",
  "..kookk...",
  ".........."
];

/** Paleta atenuada para pestañas inactivas. */
export const PAL_DIM: Record<string, string> = Object.fromEntries(
  Object.keys(PAL_C).map((ch) => [ch, ch === "k" ? "#10131c" : "#3b4762"])
);
