// Dirección C — ACERO ARCADE. Personajes 32×32 nativos, chunky: cabezón,
// hombros anchos, contorno negro de 2px en toda la silueta. Montaje por
// partes como en A: cuerpo base (sin brazo derecho) + poses de brazo con
// anclaje + parches de cara. El lienzo de composición es 44×40 para que el
// arco del martillo quepa; el cuerpo vive en (4,8).
//
// Char especial "x" = muñequera: Nahuel la resuelve a piel, Carlos a
// amarillo eléctrico (muñequeras es SU rasgo).

import { overlay, remap, times, type Frame } from "../engine";
import { FLASH_TABLE } from "./palette";

export const C_W = 44;
export const C_H = 40;
export const BODY_X = 4;
export const BODY_Y = 8;

const BLANK: Frame = times(C_H, () => ".".repeat(C_W));

/** Normaliza filas a 32 columnas (perdona recuentos al dibujar a mano). */
const N32 = (f: string[]): Frame => f.map((r) => (r + ".".repeat(32)).slice(0, 32));

// ── Cuerpo base de Nahuel (sin brazo derecho) ──────────────────────────────
// Cinta naranja en la frente, camiseta naranja, pantalón acero, botas negras.

export const BODY_C: Frame = N32([
  "........kkkkkkkkkkkkkkkk........",
  "......kkkkkkkkkkkkkkkkkkkk......",
  "......kk4444444444444444kk......",
  "......kk4444444444444444kk......",
  "......kk4444444444444444kk......",
  "......kk4411111111111444kk......",
  "......kkOOOOOOOOOOOOOOOOkk......",
  "......kkooooooooooooooookk......",
  "......kk1111111111111111kk......",
  "......kk111kk111111kk111kk......",
  "......kk111kk111111kk111kk......",
  "......kk1111111111111111kk......",
  "......kk1111kkkkkkk11111kk......",
  "......kk2222222222222222kk......",
  "....kkkkkkkkkkkkkkkkkkkkkkkk....",
  "..kkOOOOOOOOOOOOOOOOOOOOOOOOkk..",
  "..kkOOOOOOOOOOOOOOOOOOOOOOOOkk..",
  "..kk11kOOOOOOOOOOOOOOOOOOOOOkk..",
  "..kk11kOOOOOOOOOOOOOOOOOOOOOkk..",
  "..kkxxkOooooooooooooooooooOOkk..",
  "..kk22kkkkkkkkkkkkkkkkkkkkkkk...",
  "..kk22kssssssssssssssssssssskk..",
  "....kksssssssssssssssssssskk....",
  "....kksssssssssssssssssssskk....",
  "....kkssssssskkkkkkssssssskk....",
  "....kkddddddkk....kkddddddkk....",
  "....kkddddddkk....kkddddddkk....",
  "...kkkkkkkkkkk....kkkkkkkkkkk...",
  "...kkkSSkkkkkk....kkkSSkkkkkk...",
  "...kkkkkkkkkkk....kkkkkkkkkkk...",
  "................................",
  "................................"
]);

/** Carlos: pelo castaño, piel clara, camiseta teal, SIN cinta (pelo en su
 *  lugar) y muñequeras amarillas (char x). */
const CARLOS_BROW: Frame = [
  "7777777777777777",
  "7777777777777777",
  "5555555555555555"
];
export const toCarlosBody = (f: Frame): Frame =>
  overlay(remap(f, { "4": "7", "1": "5", "2": "6", O: "T", o: "t" }), CARLOS_BROW, 8, 5);

// ── Parches de cara (16×6, anclados en cols 8..23, filas 8..13) ────────────

export const FACE_NEUTRAL: Frame = [
  "1111111111111111",
  "111kk111111kk111",
  "111kk111111kk111",
  "1111111111111111",
  "1111kkkkkkk11111",
  "2222222222222222"
];

/** Cejas en V, mirada fija: preparado. */
export const FACE_READY: Frame = [
  "11kkk11111kkk111",
  "111kk111111kk111",
  "111kk111111kk111",
  "1111111111111111",
  "1111kkkkkkk11111",
  "2222222222222222"
];

/** Esfuerzo con dientes apretados: golpe. */
export const FACE_STRIKE: Frame = [
  "11kkk11111kkk111",
  "111kk111111kk111",
  "111kk111111kk111",
  "1111111111111111",
  "111kkWWWWWkk1111",
  "2222222222222222"
];

/** Ojos cerrados, gesto sereno: descanso / adaptación. */
export const FACE_REST: Frame = [
  "1111111111111111",
  "1111111111111111",
  "111kk111111kk111",
  "1111111111111111",
  "11111kkkk1111111",
  "2222222222222222"
];

/** Sonrisa enorme abierta: celebración y récord. */
export const FACE_CHEER: Frame = [
  "1111111111111111",
  "11kkk11111kkk111",
  "1111111111111111",
  "111kkkkkkkkk1111",
  "111kWWWWWWWk1111",
  "2222kkkkkkk22222"
];

// ── Martillo ENORME de cabeza cuadrada ─────────────────────────────────────
// Cabeza acero con brillo W arriba-izquierda, mango amarillo eléctrico.

const HEAD_H: Frame = [
  "kkkkkkkkkkkk",
  "kkSSSSSSSSkk",
  "kSWWSSSSSSSk",
  "kSWWSSSSSSSk",
  "kSSSSSSSSSSk",
  "kssssssssssk",
  "kksssssssskk",
  "kkkkkkkkkkkk"
];

// ── Poses de brazo derecho (mapas con anclaje en el lienzo 44×40) ──────────

export interface ArmPose {
  map: Frame;
  x: number;
  y: number;
}

/** Brazo colgando, martillo apoyado en el suelo (idle). */
const ARM_DOWN_MAP: Frame = [
  "kOOk..........",
  "kOOk..........",
  "k11k..........",
  "k11k..........",
  ".kxxk.........",
  ".k22k.........",
  ".k2Y2k........",
  ".kkYkk........",
  "..kYk.........",
  "..kYk.........",
  ...HEAD_H.map((r) => ("" + r).padEnd(14, "."))
].map((r) => r.padEnd(14, "."));

/** Martillo al hombro, apuntando arriba-atrás (preparado). */
const ARM_BACK_MAP: Frame = [
  "........kkkkkkkk",
  "........kkSSSSkk",
  "........kSWWSSSk",
  "........kSSSSSSk",
  "........kssssssk",
  "........kkkkkkkk",
  ".......kYYk.....",
  "......kYYk......",
  ".....kYYk.......",
  "....k2Y2k.......",
  "....kxxk........",
  "...k11k.........",
  "...k11k.........",
  "..kOOk..........",
  "..kOOk.........."
];

/** Martillo en el cénit, por encima de la cabeza. */
const ARM_UP_MAP: Frame = [
  "..kkkkkkkkkkkk",
  "..kkSSSSSSSSkk",
  "..kSWWSSSSSSSk",
  "..kSSSSSSSSSSk",
  "..kssssssssssk",
  "..kkkkkkkkkkkk",
  "......kYYk....",
  "......kYYk....",
  ".....k2Y2k....",
  ".....kxxk.....",
  ".....k11k.....",
  "....k11k......",
  "....k11k......",
  "...kOOk.......",
  "...kOOk......."
];

/** Fotograma de SMEAR: el arco del martillo como estela hacia el impacto. */
const ARM_SMEAR_MAP: Frame = [
  "kWWk..............",
  "kWWYk.............",
  ".kWWYk............",
  "..kWWYk...........",
  "...kWWYk..........",
  "....kWWYk.........",
  ".....kWWYk........",
  "......kWWYk.......",
  ".......kWWYk......",
  "........kWWYk.....",
  ".........kWWYk....",
  "..........kWWYk...",
  "...........kWWYk..",
  "............kWWYk.",
  ".............kWWYk",
  ".............kWWYk",
  "..............kWYk",
  "..............kWYk",
  "..............kYYk",
  "...............kYk"
];

/** Impacto: martillo clavado abajo-derecha. */
const ARM_IMPACT_MAP: Frame = [
  "kOOk..............",
  "kOOOk.............",
  ".k111k............",
  "..k11k............",
  "..kxxk............",
  "...k22k...........",
  "...k2Yk...........",
  "....kYYk..........",
  ".....kYYk.........",
  "......kkkkkkkkkkkk",
  "......kkSSSSSSSSkk",
  "......kSWWSSSSSSSk",
  "......kSSSSSSSSSSk",
  "......kssssssssssk",
  "......kkkkkkkkkkkk"
];

/** Puño en alto (celebración/récord). */
const ARM_RAISED_MAP: Frame = [
  ".k22k.",
  ".k22k.",
  ".k11k.",
  ".k11k.",
  "k11k..",
  "kxxk..",
  "kOOk..",
  "kOOk.."
];

/** Mano a la barbilla (adaptación). */
const ARM_ADAPT_MAP: Frame = [
  ".k22k...",
  ".k112k..",
  "..k11k..",
  "...k11k.",
  "...kOOk.",
  "...kOOk."
];

/** Descanso: martillo plantado, mano apoyada encima. */
const ARM_REST_MAP: Frame = [
  "kOOk..........",
  "kOOk..........",
  "k11k..........",
  ".k11k.........",
  ".kxxk.........",
  ".k2222k.......",
  "..kkY2k.......",
  "...kYkk.......",
  "...kYk........",
  "...kYk........",
  ...HEAD_H.map((r) => r.padEnd(14, "."))
].map((r) => r.padEnd(14, "."));

export const POSE_DOWN: ArmPose = { map: ARM_DOWN_MAP, x: 30, y: 21 };
export const POSE_BACK: ArmPose = { map: ARM_BACK_MAP, x: 27, y: 9 };
export const POSE_UP: ArmPose = { map: ARM_UP_MAP, x: 27, y: 7 };
export const POSE_SMEAR: ArmPose = { map: ARM_SMEAR_MAP, x: 26, y: 8 };
export const POSE_IMPACT: ArmPose = { map: ARM_IMPACT_MAP, x: 26, y: 22 };
export const POSE_RAISED: ArmPose = { map: ARM_RAISED_MAP, x: 30, y: 15 };
export const POSE_ADAPT: ArmPose = { map: ARM_ADAPT_MAP, x: 24, y: 19 };
export const POSE_REST: ArmPose = { map: ARM_REST_MAP, x: 29, y: 21 };

// ── Montaje ────────────────────────────────────────────────────────────────

export type CharId = "nahuel" | "carlos";
export type StateId =
  | "neutral"
  | "preparado"
  | "golpeando"
  | "descansando"
  | "celebrando"
  | "record"
  | "adaptacion";

/** Coloca el cuerpo (con o sin desplazamiento de squash) en el lienzo. */
const place = (body: Frame, dx = 0, dy = 0): Frame =>
  overlay(BLANK, body, BODY_X + dx, BODY_Y + dy);

const withArm = (canvas: Frame, pose: ArmPose, dx = 0, dy = 0): Frame =>
  overlay(canvas, pose.map, pose.x + dx, pose.y + dy);

/** Fotograma FLASH: silueta entera en blanco impacto. */
export const toFlash = (f: Frame): Frame => remap(f, FLASH_TABLE);

/** Estrella de 4 puntas (chispa) para superponer en el lienzo. */
export const SPARK4: Frame = ["..W..", "..Y..", "WYWYW", "..Y..", "..W.."];

export const buildChar = (
  who: CharId,
  state: StateId
): { frames: Frame[]; fps: number } => {
  const isC = who === "carlos";
  const skin: Record<string, string> = isC
    ? { "1": "5", "2": "6", x: "Y", O: "T", o: "t" }
    : { x: "1" };
  const faceSkin: Record<string, string> = isC ? { "1": "5", "2": "6" } : {};

  const B = (face: Frame): Frame => {
    const base = isC ? toCarlosBody(BODY_C) : BODY_C;
    // El cuerpo ya remapea; el parche de cara se remapea aparte.
    const withF = overlay(base, remap(face, faceSkin), 8, 8);
    return remap(withF, { x: isC ? "Y" : "1" });
  };
  const P = (pose: ArmPose): ArmPose => ({ ...pose, map: remap(pose.map, skin) });

  switch (state) {
    case "neutral": {
      // Rebote arcade: 1px arriba/abajo, brazo colgando con martillo.
      const b = B(FACE_NEUTRAL);
      const f0 = withArm(place(b), P(POSE_DOWN));
      const f1 = withArm(place(b, 0, 1), P(POSE_DOWN), 0, 1);
      return { frames: [f0, f0, f1, f1], fps: 6 };
    }
    case "preparado": {
      const b = B(FACE_READY);
      const f0 = withArm(place(b), P(POSE_BACK));
      const f1 = withArm(place(b, 0, 1), P(POSE_BACK), 0, 1);
      const f2 = withArm(place(b, 0, 1), P(POSE_BACK), 0, 2);
      return { frames: [f0, f1, f2, f1], fps: 10 };
    }
    case "golpeando": {
      const b = B(FACE_STRIKE);
      const back = withArm(place(b), P(POSE_BACK));
      const backUp = withArm(place(b, 0, -1), P(POSE_BACK), 0, -1);
      const up = withArm(place(b, 0, -1), P(POSE_UP), 0, -1);
      const smear = withArm(place(b), P(POSE_SMEAR));
      const impactRaw = withArm(place(b, 0, 1), P(POSE_IMPACT), 0, 1);
      const impact = overlay(impactRaw, SPARK4, 36, 30);
      return {
        frames: [back, backUp, up, smear, toFlash(impactRaw), impact, impactRaw, back],
        fps: 14
      };
    }
    case "descansando": {
      const b = B(FACE_REST);
      const f0 = withArm(place(b), P(POSE_REST));
      const f1 = withArm(place(b, 0, 1), P(POSE_REST), 0, 1);
      return { frames: [f0, f0, f1, f1], fps: 3 };
    }
    case "celebrando": {
      const b = B(FACE_CHEER);
      const up = withArm(place(b, 0, -1), P(POSE_RAISED), 0, -2);
      const mid = withArm(place(b), P(POSE_RAISED));
      const low = withArm(place(b, 0, 1), P(POSE_RAISED), 0, 2);
      return { frames: [low, mid, up, up, mid, low], fps: 12 };
    }
    case "record": {
      const b = B(FACE_CHEER);
      const up = withArm(place(b, 0, -1), P(POSE_RAISED), 0, -2);
      const mid = withArm(place(b), P(POSE_RAISED));
      return {
        frames: [
          mid,
          toFlash(up),
          overlay(overlay(up, SPARK4, 2, 4), SPARK4, 37, 8),
          overlay(up, SPARK4, 20, 1),
          overlay(overlay(mid, SPARK4, 5, 14), SPARK4, 36, 18),
          up
        ],
        fps: 12
      };
    }
    case "adaptacion": {
      const b = B(FACE_REST);
      const f0 = withArm(place(b), P(POSE_ADAPT));
      const f1 = withArm(place(b, 0, 1), P(POSE_ADAPT), 0, 1);
      return { frames: [f0, f0, f1, f1], fps: 4 };
    }
  }
};
