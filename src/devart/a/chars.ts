// Dirección A — personajes 48×48 nativos, montados por partes:
// cuerpo base (sin brazo derecho) + poses de brazo + parches de cara.
// Carlos se deriva del mismo rig con su propio pelo, piel y camiseta.

import { clone, overlay, remap, shiftY, type Frame } from "../engine";

// Cuerpo base de Nahuel: de pie, 3/4 mirando a la derecha, delantal de cuero.
// Sin brazo derecho (se superpone por pose). 48×48.
export const BODY_N: Frame = [
  "................................................",
  "................................................",
  "................................................",
  "..................444444444.....................",
  "................4444444444444...................",
  "...............444444444444444..................",
  "..............44444444444444444.................",
  "..............44444444444444444.................",
  "..............44411111111111444.................",
  "..............4411111111111114..................",
  "..............4411111111111114..................",
  "..............44111k11111k1111..................",
  "..............44111k11111k1111..................",
  "..............4411111111111111..................",
  "..............441112111121111...................",
  "..............44411111111111....................",
  "...............4441111111111....................",
  "................44411111111.....................",
  "..................221111122.....................",
  "...................2111112......................",
  "..............eeee2111112eeee...................",
  "............eeeeeeee1111eeeeeee.................",
  "...........eeeeeeeeeeeeeeeeeeeee................",
  "..........eeeeeeqqqqqqqqqqeeeeee................",
  "..........eeeeqqqqqqqqqqqqqqeeee................",
  "..........eeeqqqqqqqqqqqqqqqqeee................",
  "..........ee2qqqqqqqqqqqqqqqq2ee................",
  "..........112qqqqqqqqqqqqqqqq211................",
  "..........112qqqqoooooooqqqqq211................",
  "..........112qqqqqqqqqqqqqqqq211................",
  "..........122qqqqqqqqqqqqqqqq221................",
  "...........1qqqqqqqqqqqqqqqqqq1.................",
  "............qqqqqqqqqqqqqqqqqq..................",
  "............qqqqqqqqqqqqqqqqq...................",
  "............IIIIIIIII.IIIIIII...................",
  "............IIIIIIIII.IIIIIII...................",
  "............KIIIIIIII.IIIIIIK...................",
  "............KIIIIIII...IIIIIK...................",
  "............KIIIIIII...IIIIIK...................",
  "............KKIIIIII...IIIIKK...................",
  "............KKIIIII.....IIIKK...................",
  "............qqqqqqq.....qqqqq...................",
  "...........qqqqqqqq....qqqqqqq..................",
  "...........qoqqqqqq....qqqqqoq..................",
  "..........kkkkkkkkk....kkkkkkkk.................",
  "..........kkkkkkkkk....kkkkkkkk.................",
  "................................................",
  "......EEEeeeeeeeeeeeeeeeeeeeeeeeEEE.............",
  "................................................"
];

// Carlos: pelo castaño rizado (más volumen), piel clara, camiseta azul.
export const toCarlos = (f: Frame): Frame =>
  remap(f, { "4": "7", "1": "5", "2": "6", e: "b", E: "B" });

// ── Parches de cara (14×7, anclados en x=16, y=10) ─────────────────────────
// Cubren por completo la zona de ojos y boca del rostro base (cols 16–29,
// filas 10–16): sin dots, para sobreescribir limpio.

/** Ojos decididos con ceja baja y boca firme. */
export const FACE_READY: Frame = [
  "11kk1111kk11..",
  "111k11111k11..",
  "111k11111k11..",
  "111111111111..",
  "1112kkkkk211..",
  ".11111111111..",
  "..1111111111.."
];

/** Ojos cerrados, gesto sereno. */
export const FACE_REST: Frame = [
  "111111111111..",
  "111111111111..",
  "11kk1111kk11..",
  "111111111111..",
  "111211112111..",
  ".11122211111..",
  "..1111111111.."
];

/** Sonrisa abierta (celebración/récord). */
export const FACE_CHEER: Frame = [
  "11k11111k111..",
  "1k1k111k1k11..",
  "111111111111..",
  "111kkkkkk111..",
  "111kwwwwk111..",
  ".112kkkk1111..",
  "..1111111111.."
];

/** Concentración con esfuerzo (golpe). */
export const FACE_STRIKE: Frame = [
  "1kk11111kk11..",
  "111k11111k11..",
  "111k11111k11..",
  "111111111111..",
  "111kkkkkk211..",
  ".11211112111..",
  "..1111111111.."
];

// ── Poses de brazo derecho (con o sin martillo) ────────────────────────────
// Cada pose lleva su propio anclaje: el arco del martillo recorre desde
// encima de la cabeza hasta el yunque situado a la DERECHA del personaje.
// Martillo: mango o, cabeza S/s con rim H y reflejo cálido e.

export interface ArmPose {
  map: Frame;
  x: number;
  y: number;
}

/** Brazo caído con martillo bajado (idle). */
export const ARM_DOWN_MAP: Frame = [
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..eee.....................",
  "..eee1....................",
  "...ee11...................",
  "....111...................",
  "....111...................",
  "....1111..................",
  ".....111..................",
  ".....111..................",
  ".....1111.................",
  "......111.................",
  "......ooo.................",
  "......ooo.................",
  "......ooo.................",
  "......ooo.................",
  "....kSSSSSk...............",
  "....kSssssHk..............",
  "....kSssssHk..............",
  "....keSSSSSk..............",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
];

/** Martillo alzado atrás (anticipación), a la altura del hombro. */
export const ARM_BACK_MAP: Frame = [
  "...............kSSSSSk....",
  "...............kSssssHk...",
  "...............kSssssHk...",
  "...............keSSSSSk...",
  "..................ooo.....",
  ".................ooo......",
  "..eee...........ooo.......",
  "..eee1.........ooo........",
  "...ee11.......ooo.........",
  "....1111.....ooo..........",
  ".....11111..ooo...........",
  "......111111oo............",
  ".......11111..............",
  ".........................."
];

/** Martillo en el cénit, por encima de la cabeza. */
export const ARM_UP_MAP: Frame = [
  "........kSSSSSk...",
  "........kSssssHk..",
  "........kSssssHk..",
  "........keSSSSSk..",
  "...........ooo....",
  "...........ooo....",
  "...........ooo....",
  "..........o11.....",
  "..........111.....",
  "..........111.....",
  ".........111......",
  ".........111......",
  "........111.......",
  "......ee111.......",
  "....eee111........",
  "...eee111.........",
  "..eee111..........",
  "..ee111...........",
  ".................."
];

/** Impacto: el martillo cae sobre el yunque, a la derecha. */
export const ARM_IMPACT_MAP: Frame = [
  "..........................",
  "..eee.....................",
  "..eee1....................",
  "...ee111..................",
  ".....11111................",
  "......111111..............",
  "........111111............",
  "..........11111...........",
  "............ooo...........",
  ".............ooo..........",
  "..............ooo.........",
  "..............kSSSSSk.....",
  "..............kSwwssHk....",
  "..............kSwwssHk....",
  "..............keSSSSSk....",
  ".........................."
];

/** Puño en alto, fuera de la silueta de la cabeza. */
export const ARM_RAISED_MAP: Frame = [
  ".....111..",
  ".....1111.",
  ".....1111.",
  "......111.",
  "......111.",
  "......111.",
  ".....111..",
  ".....111..",
  "....111...",
  "....111...",
  "...1111...",
  "..ee111...",
  ".eee11....",
  ".eee1.....",
  "..ee......"
];

/** Mano al pecho (adaptación: ajustar con cabeza). */
export const ARM_ADAPT_MAP: Frame = [
  "..eee.....",
  "..eee1....",
  "...ee11...",
  "..1111....",
  ".1111.....",
  ".111......",
  ".........."
];

/** Brazo caído sin martillo (descanso). */
export const ARM_EMPTY_MAP: Frame = [
  "..eee.....",
  "..eee1....",
  "...ee11...",
  "....111...",
  "....111...",
  "....1111..",
  ".....111..",
  ".....111..",
  ".....1111.",
  "......111.",
  "......111.",
  ".........."
];

export const POSE_DOWN: ArmPose = { map: ARM_DOWN_MAP, x: 22, y: 12 };
export const POSE_BACK: ArmPose = { map: ARM_BACK_MAP, x: 22, y: 10 };
export const POSE_UP: ArmPose = { map: ARM_UP_MAP, x: 24, y: 0 };
export const POSE_IMPACT: ArmPose = { map: ARM_IMPACT_MAP, x: 24, y: 19 };
export const POSE_RAISED: ArmPose = { map: ARM_RAISED_MAP, x: 27, y: 4 };
export const POSE_ADAPT: ArmPose = { map: ARM_ADAPT_MAP, x: 22, y: 19 };
export const POSE_EMPTY: ArmPose = { map: ARM_EMPTY_MAP, x: 22, y: 19 };

/** Toalla al cuello (descanso): parche sobre los hombros. */
export const TOWEL: Frame = [
  "wwww....www",
  ".www....ww.",
  ".www....ww.",
  ".www....ww.",
  ".www....ww."
];

// ── Montaje de estados ─────────────────────────────────────────────────────

export type CharId = "nahuel" | "carlos";
export type StateId =
  | "neutral"
  | "preparado"
  | "golpeando"
  | "descansando"
  | "celebrando"
  | "record"
  | "adaptacion";

const withFace = (body: Frame, face: Frame | null): Frame =>
  face ? overlay(body, face, 16, 10) : body;

const arm = (body: Frame, pose: ArmPose, dx = 0, dy = 0): Frame =>
  overlay(body, pose.map, pose.x + dx, pose.y + dy);

/** Respiración: la cabeza baja 1px (peso del cuerpo al exhalar). */
const breathe = (f: Frame): Frame => {
  const shifted = shiftY(f, 1);
  const out = clone(f);
  for (let i = 0; i < 19; i++) out[i] = shifted[i];
  return out;
};

export const buildChar = (
  who: CharId,
  state: StateId
): { frames: Frame[]; fps: number } => {
  const base = who === "carlos" ? toCarlos(BODY_N) : BODY_N;
  const skin: Record<string, string> =
    who === "carlos" ? { "1": "5", "2": "6" } : {};
  const P = (pose: ArmPose): ArmPose => ({ ...pose, map: remap(pose.map, skin) });
  const F = (face: Frame) => remap(face, skin);

  switch (state) {
    case "neutral": {
      const a = arm(base, P(POSE_DOWN));
      return { frames: [a, breathe(a), a, arm(base, P(POSE_DOWN), 0, 1)], fps: 3 };
    }
    case "preparado": {
      const b = withFace(base, F(FACE_READY));
      const a = arm(b, P(POSE_BACK));
      return { frames: [a, breathe(a), a, arm(b, P(POSE_BACK), 0, 1)], fps: 4 };
    }
    case "golpeando": {
      const b = withFace(base, F(FACE_STRIKE));
      return {
        frames: [
          arm(b, P(POSE_BACK)),
          arm(b, P(POSE_BACK), 0, -1),
          arm(b, P(POSE_UP)),
          arm(b, P(POSE_IMPACT)),
          arm(shiftY(b, 1), P(POSE_IMPACT), 0, 1),
          arm(b, P(POSE_IMPACT)),
          arm(b, P(POSE_BACK), 0, 1),
          arm(b, P(POSE_BACK))
        ],
        fps: 10
      };
    }
    case "descansando": {
      const b = overlay(withFace(base, F(FACE_REST)), TOWEL, 16, 18);
      const a = arm(b, P(POSE_EMPTY));
      return { frames: [a, breathe(a), breathe(a), a], fps: 2 };
    }
    case "celebrando": {
      const b = withFace(base, F(FACE_CHEER));
      return {
        frames: [
          arm(b, P(POSE_RAISED), 0, 2),
          arm(b, P(POSE_RAISED)),
          arm(shiftY(b, -1), P(POSE_RAISED), 0, -2),
          arm(b, P(POSE_RAISED))
        ],
        fps: 6
      };
    }
    case "record": {
      const b = withFace(base, F(FACE_CHEER));
      const up = arm(b, P(POSE_RAISED), 0, -1);
      const spark: Frame = ["..Y..", ".YWY.", "Y.W.Y", ".YWY.", "..Y.."];
      return {
        frames: [
          arm(b, P(POSE_RAISED), 0, 2),
          up,
          overlay(shiftY(up, -1), spark, 34, 1),
          overlay(up, spark, 8, 4),
          overlay(shiftY(up, -1), spark, 40, 8),
          up
        ],
        fps: 8
      };
    }
    case "adaptacion": {
      const b = withFace(base, F(FACE_REST));
      const a = arm(b, P(POSE_ADAPT));
      return { frames: [a, breathe(a), a, arm(b, P(POSE_ADAPT), 0, 1)], fps: 3 };
    }
  }
};
