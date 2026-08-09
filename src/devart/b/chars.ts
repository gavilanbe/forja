// Dirección B — personajes 32×32 «retrato de manual técnico».
// Rig por partes: cuerpo base calvo y SIN brazo derecho + cabezas (pelo/barba)
// + parches de cara + poses de brazo con anclaje propio. Iluminación plana:
// el volumen se sugiere con rayado (P sobre p, S sobre s), nunca con brillos.
// Carlos se deriva por remap estructural: h/H (pelo) y s/S (camisa).

import { clone, overlay, remap, shiftY, type Frame } from "../engine";

// ── Cuerpo base (32×32): calvo, postura de ficha, brazo derecho ausente ────
export const BODY_B: Frame = [
  "................................",
  "............kkkkkkkk............",
  "...........kppppppppk...........",
  "...........kppppppppk...........",
  "...........kppppppppk...........",
  "...........kppkppkppk...........",
  "...........kpppPPpppk...........",
  "...........kpppkkpppk...........",
  "...........kppppppppk...........",
  "............kppppppk............",
  "..............pppP..............",
  "..........kkkkkkkkkkkk..........",
  ".........kssssSppSssssk.........",
  ".........ksssssSSsssssk.........",
  ".........ksskssssssk...........",
  ".........ksskssssssk...........",
  ".........kSSkssssssk...........",
  ".........kppksssssSk...........",
  ".........kppksssssSk...........",
  ".........kppksssssSk...........",
  ".........kppkSSSSSSk...........",
  ".........kPPkkkkkkkk...........",
  "...........aaaaaaaaaa..........",
  "...........aaaa..aaaa..........",
  "...........aaaa..aaaa..........",
  "...........aaaa..aaaa..........",
  "...........aaaa..aaaa..........",
  "...........aaaa..aaaa..........",
  "...........aaaa..aaaa..........",
  "..........kkkkk..kkkkk.........",
  "..........kkkkk..kkkkk.........",
  "................................"
].map((r) => (r + "................................").slice(0, 32));

// ── Cabezas ────────────────────────────────────────────────────────────────

/** Nahuel: pelo oscuro corto + barba recortada (la boca queda visible). */
export const HEAD_N: Frame = [
  ".hhhhhhhh.",
  "hhhhhhhhhh",
  "hh......hh",
  "h........h",
  "h........h",
  "h........h",
  "hh......hh",
  "hhh....hhh",
  ".hhhhhhhh."
];
export const HEAD_N_AT = { x: 11, y: 1 };

/** Carlos: pelo castaño rizado con volumen, sin barba. */
export const HEAD_C: Frame = [
  "...LLLLLL...",
  ".LLLLLLLLLL.",
  "LLLkLLLLkLLL",
  ".LLL....LLL.",
  ".LL......LL.",
  "..L......L.."
];
export const HEAD_C_AT = { x: 10, y: 0 };

/** Carlos: gafas de seguridad colgadas al cuello. */
export const GOGGLES_C: Frame = [
  "kccAcck"
];
export const GOGGLES_C_AT = { x: 13, y: 12 };

/** Nahuel: delantal de herramientas (correas + peto con bolsillo). */
export const APRON_N: Frame = [
  "L....L",
  "L....L",
  "LLLLLL",
  "LLLLLL",
  "LlLLlL",
  "LLLLLL",
  "LkkkkL",
  "LkllkL",
  "LLLLLL"
];
export const APRON_N_AT = { x: 13, y: 12 };

// ── Parches de cara (8×5, anclados en x=12, y=4) ───────────────────────────

export const FACE_NEUT: Frame = [
  "pppppppp",
  "ppkppkpp",
  "pppPPppp",
  "pppkkppp",
  "pppppppp"
];

/** Cejas bajas, boca firme: preparado. */
export const FACE_READY: Frame = [
  "pkkpkkpp",
  "ppkppkpp",
  "pppPPppp",
  "ppkkkkpp",
  "pppppppp"
];

/** Concentración con esfuerzo: golpe (dientes apretados). */
export const FACE_STRIKE: Frame = [
  "pkkpkkpp",
  "ppkppkpp",
  "pppPPppp",
  "ppkwwkpp",
  "pppppppp"
];

/** Ojos cerrados, gesto sereno: descanso / adaptación. */
export const FACE_REST: Frame = [
  "pppppppp",
  "pppppppp",
  "ppkppkpp",
  "pppkkppp",
  "pppppppp"
];

/** Sonrisa abierta: celebración / récord. */
export const FACE_CHEER: Frame = [
  "pppppppp",
  "ppkppkpp",
  "pppPPppp",
  "ppkwwkpp",
  "pppkkppp"
];

export const FACE_AT = { x: 12, y: 4 };

// ── Poses de brazo derecho (anclaje propio) ────────────────────────────────

export interface ArmPose {
  map: Frame;
  x: number;
  y: number;
}

/** Brazo caído (neutral / descanso). */
export const POSE_DOWN: ArmPose = {
  x: 19,
  y: 13,
  map: [
    ".ssk",
    "kssk",
    "kssk",
    "kSSk",
    "kppk",
    "kppk",
    "kppk",
    "kppk",
    "kPPk",
    ".kk."
  ]
};

/** Martillo vertical al pecho (preparado: listo para golpear). */
export const POSE_TOOL: ArmPose = {
  x: 19,
  y: 10,
  map: [
    "kkkkk",
    "kaAAk",
    "kklkk",
    "..l..",
    ".sl..",
    ".ppp.",
    ".pPp.",
    "..l.."
  ]
};

/** Martillo de bola a media altura (clic). */
export const POSE_HAMMER_MID: ArmPose = {
  x: 19,
  y: 7,
  map: [
    ".....kkkkk",
    "....kaAAAk",
    ".....kkkkk",
    "......l...",
    ".....l....",
    "...ppl....",
    ".sspp.....",
    "kss.......",
    "kSS.......",
    ".kk......."
  ]
};

/** Martillo en el cénit, sobre la cabeza (clac). */
export const POSE_HAMMER_HIGH: ArmPose = {
  x: 17,
  y: 1,
  map: [
    "...kkkkk....",
    "...kaAAk....",
    "...kkkkk....",
    ".....l......",
    ".....l......",
    ".....l......",
    "....pp......",
    "....pp......",
    "...pP.......",
    "...ss.......",
    "..kss.......",
    "..kSS......."
  ]
};

/** Impacto: martillo abajo, a la derecha, sobre el banco. */
export const POSE_STRIKE: ArmPose = {
  x: 19,
  y: 13,
  map: [
    ".ss........",
    "kssp.......",
    ".kppp......",
    "..kpppl....",
    "......kkkkk",
    "......kaAAk",
    "......kkkkk"
  ]
};

/** Puño en alto (celebración / récord). */
export const POSE_FIST: ArmPose = {
  x: 19,
  y: 6,
  map: [
    ".kk.",
    "kppk",
    "kppk",
    "kpPk",
    "kpPk",
    "kssk",
    "kssk",
    ".ssk",
    ".ssk"
  ]
};

/** Mano al mentón (adaptación: repensar la placa). */
export const POSE_CHIN: ArmPose = {
  x: 16,
  y: 9,
  map: [
    "..pp...",
    "..pp...",
    "...pp..",
    "....pps",
    "...kssk",
    "...kssk",
    "...kSSk",
    "....kk."
  ]
};

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

/** Camisa azul acero y pelo castaño para Carlos. */
const toCarlos = (f: Frame): Frame => remap(f, { s: "A", S: "a", h: "L", H: "l" });

const buildBase = (who: CharId, face: Frame): Frame => {
  let f = overlay(BODY_B, face, FACE_AT.x, FACE_AT.y);
  if (who === "nahuel") {
    f = overlay(f, HEAD_N, HEAD_N_AT.x, HEAD_N_AT.y);
    f = overlay(f, APRON_N, APRON_N_AT.x, APRON_N_AT.y);
  } else {
    f = toCarlos(f);
    f = overlay(f, HEAD_C, HEAD_C_AT.x, HEAD_C_AT.y);
    f = overlay(f, GOGGLES_C, GOGGLES_C_AT.x, GOGGLES_C_AT.y);
  }
  return f;
};

const armOn = (who: CharId, body: Frame, pose: ArmPose, dx = 0, dy = 0): Frame => {
  const map = who === "carlos" ? toCarlos(pose.map) : pose.map;
  return overlay(body, map, pose.x + dx, pose.y + dy);
};

/** Respiración mecánica: la cabeza baja 1px (solo filas 0–10). */
const breathe = (f: Frame): Frame => {
  const shifted = shiftY(f, 1);
  const out = clone(f);
  for (let i = 0; i < 11; i++) out[i] = shifted[i];
  return out;
};

/** Marca de lacre (destello documental del récord). */
const WAX_MARK: Frame = ["..r..", ".rRr.", "r.R.r", ".rRr.", "..r.."];

export const buildChar = (
  who: CharId,
  state: StateId
): { frames: Frame[]; fps: number } => {
  const B = (face: Frame) => buildBase(who, face);

  switch (state) {
    case "neutral": {
      const a = armOn(who, B(FACE_NEUT), POSE_DOWN);
      const blink = armOn(who, B(FACE_REST), POSE_DOWN);
      return { frames: [a, breathe(a), a, blink], fps: 4 };
    }
    case "preparado": {
      const b = B(FACE_READY);
      const a = armOn(who, b, POSE_TOOL);
      const a2 = armOn(who, b, POSE_TOOL, 0, 1);
      return { frames: [a, a2, a, breathe(a)], fps: 5 };
    }
    case "golpeando": {
      const b = B(FACE_STRIKE);
      const mid = armOn(who, b, POSE_HAMMER_MID);
      const high = armOn(who, b, POSE_HAMMER_HIGH);
      const hit = armOn(who, b, POSE_STRIKE);
      return {
        frames: [mid, high, high, hit, armOn(who, shiftY(b, 1), POSE_STRIKE, 0, 1), mid],
        fps: 8
      };
    }
    case "descansando": {
      const a = armOn(who, B(FACE_REST), POSE_DOWN);
      return { frames: [a, breathe(a), breathe(a), a], fps: 4 };
    }
    case "celebrando": {
      const b = B(FACE_CHEER);
      const up = armOn(who, b, POSE_FIST);
      const up2 = armOn(who, b, POSE_FIST, 0, -1);
      return { frames: [up, up2, up, up2], fps: 6 };
    }
    case "record": {
      const b = B(FACE_CHEER);
      const up = armOn(who, b, POSE_FIST);
      const up2 = armOn(who, b, POSE_FIST, 0, -1);
      return {
        frames: [
          up,
          overlay(up2, WAX_MARK, 25, 3),
          overlay(up, WAX_MARK, 4, 8),
          overlay(up2, WAX_MARK, 26, 12),
          up
        ],
        fps: 7
      };
    }
    case "adaptacion": {
      const b = B(FACE_REST);
      const a = armOn(who, b, POSE_CHIN);
      return { frames: [a, breathe(a), a, armOn(who, b, POSE_CHIN, 0, 1)], fps: 4 };
    }
  }
};
