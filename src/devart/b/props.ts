// Dirección B — atrezzo de mesa de delineante. Todo con contorno de tinta
// de hierro (k), volumen por rayado y cotas en cian de delineante (c/C).
// Nada brilla: la luz es plana, de flexo de mesa.

import { type Frame } from "../engine";

// ── Martillo de bola calibrado (mango con anillas de calibración) ──────────
export const HAMMER_B: Frame = [
  "............kkkkkk",
  "lllLlllLllllkaAAAk",
  "............kkkkkk"
];

// ── Compás de puntas con arco de medida ────────────────────────────────────
export const CALIPER_B: Frame = [
  "......ll......",
  "......ll......",
  ".....l..l.....",
  ".....l..l.....",
  "....l....l....",
  "....l....l....",
  "...l......l...",
  "...l.cccc.l...",
  "..l..........l" ,
  "..k..........k"
].map((r) => r.slice(0, 14));

// ── Yunque esquemático «fig. 1» con cotas de delineante ────────────────────
export const ANVIL_FIG_B: Frame = [
  "..............................",
  "..ccccccccccccccccccccc..ccc..",
  ".cc.C..C..C..C..C..C..c...c...",
  "..ccccccccccccccccccccc...c...",
  "........c.......c.........c...",
  ".........c.....c..........c...",
  ".........c.....c..........c...",
  "........c.......c.........c...",
  ".......c.........c........c...",
  "......ccccccccccccc.......c...",
  "......c.C..C..C..Cc.......c...",
  "......ccccccccccccc......ccc..",
  "..............................",
  "......c...........c...........",
  "......ccccccccccccc...........",
  ".............................."
];

// ── Lámpara de mesa articulada (2 estados: encendida / atenuada) ───────────
const lamp = (bulb: string): Frame => [
  "..kkkkkk............",
  ".klllllk............",
  ".kllllllk...........",
  ".kLLLLLLLk..........",
  `..k${bulb}${bulb}${bulb}${bulb}k...........`,
  "........a...........",
  ".........a..........",
  "..........a.........",
  "..........a.........",
  ".........a..........",
  "........a...........",
  "........a...........",
  "......kkakk.........",
  ".....kkkkkkk........"
];
export const LAMP_ON_B: Frame = lamp("w");
export const LAMP_DIM_B: Frame = lamp("P");

// ── Hornillo de crisol (llama corta, sin resplandor) ───────────────────────
const burner = (flame: Frame): Frame => [
  "..kAAAAAAAAk....",
  "..kaaaaaaaak....",
  "...kaaaaaak.....",
  "....kkkkkk......",
  flame[0],
  flame[1],
  "....kkkkkk......",
  "....k....k......",
  "...kk....kk....."
];
export const BURNER_B: Frame[] = [
  burner(["......ll........", ".....lrrl......."]),
  burner([".......l........", ".....lrrl......."]),
  burner(["......l.l.......", ".....lrrl......."])
];

// ── Sellos de lacre ────────────────────────────────────────────────────────

/** COMPLETADA: lacre rojo con yunque grabado. */
export const SEAL_DONE_B: Frame = [
  "....rrrrrr....",
  "..rrrrrrrrrr..",
  ".rRrrrrrrrrrr.",
  ".rrrkkkkkkrrr.",
  "rrrr.kkkk.rrrr",
  "rrrrr.kk.rrrrr",
  "rrrr.kkkk.rrrr",
  ".rrrkkkkkkrrr.",
  ".rrrrrrrrrRrr.",
  "..rrrrrrrrrr..",
  "....rrrrrr...."
];

/** ADAPTADA: lacre verdín con llave inglesa grabada. */
export const SEAL_ADAPT_B: Frame = [
  "....vvvvvv....",
  "..vvvvvvvvvv..",
  ".vvvkk.kkvvvv.",
  ".vvvkk.kkvvvv.",
  "vvvvvkkkvvvvvv",
  "vvvvvvkkvvvvvv",
  "vvvvvvkkvvvvvv",
  ".vvvvkkkkvvvv.",
  ".vvvvkkkkvvvv.",
  "..vvvvvvvvvv..",
  "....vvvvvv...."
];

// ── Tampón de registro (reposo y estampado con squash) ─────────────────────
export const STAMP_B: Frame = [
  "....llll....",
  "....llll....",
  ".....LL.....",
  ".....LL.....",
  "..LLLLLLLL..",
  ".kkkkkkkkkk.",
  ".kkkkkkkkkk.",
  ".rrrrrrrrrr."
];
export const STAMP_DOWN_B: Frame = [
  "...llllll...",
  "....LLLL....",
  "LLLLLLLLLLLL",
  "kkkkkkkkkkkk",
  "rrrrrrrrrrrr"
];

// ── Barra de lacre derramándose (3 fotogramas) ─────────────────────────────
export const WAX_POUR_B: Frame[] = [
  [
    "..kLLl......",
    "...kLLl.....",
    "....kLLl....",
    ".....krl....",
    "......R.....",
    "............",
    "............",
    "............"
  ],
  [
    "..kLLl......",
    "...kLLl.....",
    "....kLLl....",
    ".....krl....",
    "......r.....",
    "......R.....",
    "......r.....",
    "............"
  ],
  [
    "..kLLl......",
    "...kLLl.....",
    "....kLLl....",
    ".....krl....",
    "......r.....",
    "......rR....",
    "....rrrrr...",
    "...rrrrrrr.."
  ]
];

// ── Pluma de anotar ────────────────────────────────────────────────────────
export const PEN_B: Frame = [
  ".......kLL..",
  "......kLL...",
  ".....kLL....",
  "....kLl.....",
  "...kkl......",
  "..kk........",
  ".k..........",
  "k..........."
];

// ── Lingote de latón (libro mayor de volumen) ──────────────────────────────
export const INGOT_B: Frame = [
  "..kkkkkkkk..",
  ".kllllllllk.",
  "kllwllllllLk",
  "kLLLLLLLLLLk",
  ".kkkkkkkkkk."
];

// ── Fogón de ruta (apagado / encendido) ────────────────────────────────────
export const FOGON_OFF_B: Frame = [
  "..........",
  "..........",
  ".kkkkkkkk.",
  "..kkkkkk..",
  "..k....k..",
  "..k....k.."
];
export const FOGON_ON_B: Frame = [
  "...lrl....",
  "..lrrrl...",
  ".kkkkkkkk.",
  "..kkkkkk..",
  "..k....k..",
  "..k....k.."
];

// ── Válvula (2 posiciones de giro: + y ×) ──────────────────────────────────
export const VALVE_PLUS_B: Frame = [
  "....kkkk....",
  "..kkaaaakk..",
  ".kaaakkaaak.",
  ".kaaakkaaak.",
  "kaakkkkkkaak",
  "kaakkkkkkaak",
  ".kaaakkaaak.",
  ".kaaakkaaak.",
  "..kkaaaakk..",
  "....kkkk...."
];
export const VALVE_X_B: Frame = [
  "....kkkk....",
  "..kkaaaakk..",
  ".kkaaaaaakk.",
  ".kakaakkaak.",
  "kaaakkkkaaak",
  "kaaakkkkaaak",
  ".kakaakkaak.",
  ".kkaaaaaakk.",
  "..kkaaaakk..",
  "....kkkk...."
];

// ── Placa con parche remachado (molestia / adaptación) ─────────────────────
export const PATCH_PLATE_B: Frame = [
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kaaaaaaaaaaaaaaaaaaaaaaaak",
  "kaaaaaaak.aaaaaaaaaaaaaaak",
  "kaaaaaaaak.aakkkkkkkkkaaak",
  "kaaaaaaaaak.akAlAAAlAkaaak",
  "kaaaaaaaaaak.kAAAAAAAkaaak",
  "kaaaaaaaaaaakkAAAAAAAkaaak",
  "kaaaaaaaaaaa.kAlAAAlAkaaak",
  "kaaaaaaaaaaa.kkkkkkkkkaaak",
  "kaaaaaaaaaaaaaaaaaaaaaaaak",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk"
];

// ── Seis estaciones del mapa de ruta plegable (viñetas 24×18) ──────────────
// Cada estación es una viñeta grabada sobre ficha de pergamino.

const card = (rows: Frame): Frame => {
  const w = 24;
  const top = "k".repeat(w);
  const body = rows.map((r) => "k" + (r + "p".repeat(w)).slice(0, w - 2) + "k");
  return [top, ...body, top];
};

/** 1 · Fogón de calibración: brasero con compás encima. */
export const ST_CALIBRACION: Frame = card([
  "pppppppppppppppppppppp",
  "ppppppppplppplppppppppp",
  "pppppppppl.plpppppppppp",
  "ppppppppppllpppppppppp",
  "ppppppppppllpppppppppp",
  "pppppppppppppppppppppp",
  "pppppppplpppppppppppppp",
  "ppppppplrlppppppppppppp",
  "ppppppplrrlpppppppppppp",
  "pppppkkkkkkkkppppppppp",
  "ppppppk....kpppppppppp",
  "pppppkkppppkkppppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

/** 2 · Cubeta de temple: tina con agua. */
export const ST_TEMPLE_CUBETA: Frame = card([
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "ppppppppkppppppppppppp",
  "ppppppppkppppppppppppp",
  "pppppppppkpppppppppppp",
  "ppppkkkkkkkkkkkkpppppp",
  "ppppkvvvvvvvvvvkpppppp",
  "ppppkvcvcvcvcvvkpppppp",
  "ppppkvvvvvvvvvvkpppppp",
  "pppppkkkkkkkkkkpppppp",
  "ppppppkppppppkpppppppp",
  "ppppppkppppppkpppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

/** 3 · Banco de martillado: banco con martillo apoyado. */
export const ST_BANCO: Frame = card([
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "pppppppppppkkkkkpppppp",
  "ppplllklllkkaAAAkppppp",
  "pppppppppppkkkkkpppppp",
  "pppkkkkkkkkkkkkkkppppp",
  "pppkLLLLLLLLLLLLkppppp",
  "pppkkkkkkkkkkkkkkppppp",
  "ppppkLpppppppkLpppppp",
  "ppppkLpppppppkLpppppp",
  "ppppkLpppppppkLpppppp",
  "pppppppppppppppppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

/** 4 · Lecho de brasas: parrilla con brasas contenidas. */
export const ST_BRASAS: Frame = card([
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "ppppplpplppplppppppppp",
  "ppppkkkkkkkkkkkkpppppp",
  "ppppkrlrrlrlrrlkpppppp",
  "ppppkrrlrrlrrlrkpppppp",
  "ppppkkkkkkkkkkkkpppppp",
  "pppppkppppppppkpppppp",
  "pppppkppppppppkpppppp",
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

/** 5 · Cámara del horno: arco de mampostería con boca. */
export const ST_HORNO: Frame = card([
  "pppppppppppppppppppppp",
  "pppppppkkkkkkkkpppppp",
  "ppppppkaaaaaaaakppppp",
  "pppppkaakkkkkkaakpppp",
  "pppppkaak....kaakpppp",
  "pppppkaak.rr.kaakpppp",
  "pppppkaak.rr.kaakpppp",
  "pppppkaakkkkkkaakpppp",
  "pppppkaaaaaaaaaakpppp",
  "pppppkkkkkkkkkkkkpppp",
  "pppppppppppppppppppppp",
  "pppppppppppppppppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

/** 6 · Sala del temple: pedestal con pieza terminada. */
export const ST_SALA_TEMPLE: Frame = card([
  "pppppppppppppppppppppp",
  "ppppppppppwppppppppppp",
  "ppppppppppwppppppppppp",
  "ppppppppppwppppppppppp",
  "pppppppppkwkpppppppppp",
  "ppppppppppkppppppppppp",
  "pppppppkkkkkkkpppppppp",
  "ppppppppkaaakppppppppp",
  "ppppppppkaaakppppppppp",
  "pppppppkaaaaakpppppppp",
  "ppppppkkkkkkkkkppppppp",
  "pppppppppppppppppppppp",
  "pppCCCCCCCCCCCCpppppp",
  "pppppppppppppppppppppp"
]);

export const STATIONS_B: { frame: Frame; nombre: string; ref: string }[] = [
  { frame: ST_CALIBRACION, nombre: "Fogón de calibración", ref: "EST-01" },
  { frame: ST_TEMPLE_CUBETA, nombre: "Cubeta de temple", ref: "EST-02" },
  { frame: ST_BANCO, nombre: "Banco de martillado", ref: "EST-03" },
  { frame: ST_BRASAS, nombre: "Lecho de brasas", ref: "EST-04" },
  { frame: ST_HORNO, nombre: "Cámara del horno", ref: "EST-05" },
  { frame: ST_SALA_TEMPLE, nombre: "Sala del temple", ref: "EST-06" }
];
