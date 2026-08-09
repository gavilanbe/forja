// Dirección C — ACERO ARCADE. Atrezzo: martillo enorme, yunque compacto,
// chispas-estrella de 4 puntas, hoguera chunky, cabina FORJA-TRON, discos
// apilables, campana de feria, sellos y los 6 niveles del world-map.
// Regla: contorno negro 2px, sombreado plano de 2 tonos, sin dithering.

import { overlay, remap, times, type Frame } from "../engine";

const pad = (rows: string[], w: number): Frame =>
  rows.map((r) => (r + ".".repeat(w)).slice(0, w));

// ── Martillo enorme (pieza de exhibición 24×24) ────────────────────────────

export const HAMMER_C: Frame = pad(
  [
    "....kkkkkkkkkkkkkkkk....",
    "....kkkkkkkkkkkkkkkk....",
    "....kkSSSSSSSSSSSSkk....",
    "....kSWWWSSSSSSSSSSk....",
    "....kSWWWSSSSSSSSSSk....",
    "....kSWWSSSSSSSSSSSk....",
    "....kSSSSSSSSSSSSSSk....",
    "....kSSSSSSSSSSSSSSk....",
    "....kssssssssssssssk....",
    "....kssssssssssssssk....",
    "....kksssssssssssskk....",
    "....kkkkkkkkkkkkkkkk....",
    "....kkkkkkYYkkkkkkkk....",
    "..........kYYk..........",
    "..........kYYk..........",
    "..........kYYk..........",
    "..........kYYk..........",
    "..........kYYk..........",
    "..........kYYk..........",
    "..........kYYk..........",
    ".........kkYYkk.........",
    ".........kYYYYk.........",
    ".........kkkkkk.........",
    "........................"
  ],
  24
);

// ── Yunque compacto de silueta gruesa (32×18) ──────────────────────────────

export const ANVIL_C: Frame = pad(
  [
    "..kkkkkkkkkkkkkkkkkkkkkkkkkk....",
    ".kkSSSSSSSSSSSSSSSSSSSSSSSSkk...",
    ".kSWWSSSSSSSSSSSSSSSSSSSSSSSk...",
    ".kSSSSSSSSSSSSSSSSSSSSSSSSSSk...",
    ".kksssssssssssssssssssssssskk...",
    "..kkkkkssssssssssssssskkkkk.....",
    "......kkssssssssssskkk..........",
    ".......kksssssssskk.............",
    ".......kkssssssskk..............",
    ".......kksssssssskk.............",
    "......kksssssssssskk............",
    ".....kksssssssssssskk...........",
    "....kkdddddddddddddddkk.........",
    "....kddddddddddddddddddk........",
    "...kkddddddddddddddddddkk.......",
    "...kddddddddddddddddddddk.......",
    "...kkkkkkkkkkkkkkkkkkkkkk.......",
    "................................"
  ],
  32
);

// ── Chispas-estrella de 4 puntas (16×16 · 4 fotogramas) ────────────────────

const S16: Frame = times(16, () => ".".repeat(16));
const star = (c1: string, c2: string, big: boolean): Frame =>
  big
    ? [
        "....." + c1 + ".....",
        "....." + c1 + ".....",
        "....." + c2 + ".....",
        c1 + c1 + c2 + "." + c2 + "W" + c2 + "." + c2 + c1 + c1,
        "....." + c2 + ".....",
        "....." + c1 + ".....",
        "....." + c1 + "....."
      ]
    : ["." + c1 + ".", c1 + "W" + c1, "." + c1 + "."];

export const SPARKSTAR_C: Frame[] = [
  overlay(S16, star("Y", "W", false), 6, 6),
  overlay(S16, star("Y", "W", true), 2, 4),
  overlay(
    overlay(S16, star("O", "Y", true), 1, 1),
    star("Y", "W", false),
    11,
    10
  ),
  overlay(overlay(S16, star("O", "Y", false), 1, 2), star("o", "Y", false), 12, 11),
  S16
];

/** Starburst de récord (24×24 · 4 fotogramas, magenta + amarillo). */
const S24: Frame = times(24, () => ".".repeat(24));
const BURST_MID: Frame = [
  "...........M...........",
  "...........M...........",
  ".....Y.....M.....Y.....",
  "......Y....W....Y......",
  ".......Y..WWW..Y.......",
  "MM........WWW........MM",
  "MM.....WWWWWWWWW.....MM",
  "..........WWW..........",
  ".......Y..WWW..Y.......",
  "......Y....W....Y......",
  ".....Y.....M.....Y.....",
  "...........M...........",
  "...........M..........."
];
const BURST_OUT: Frame = [
  "M..........M..........M",
  ".M.........M.........M.",
  "..Y........M........Y..",
  ".......................",
  "....Y......W......Y....",
  "MMM......W.W.W......MMM",
  ".......................",
  "....Y......W......Y....",
  ".......................",
  "..Y........M........Y..",
  ".M.........M.........M.",
  "M..........M..........M"
];
export const STARBURST_C: Frame[] = [
  overlay(S24, star("M", "Y", true), 6, 6),
  overlay(S24, BURST_MID, 0, 5),
  overlay(S24, BURST_OUT, 0, 6),
  S24
];

// ── Hoguera chunky (24×24 · 3 fotogramas) ──────────────────────────────────

const FIRE_BASE_C: Frame = pad(
  [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "..kkkk............kkkk..",
    "...kkokkk......kkkokk...",
    ".....kkoookkkkooookk....",
    "..kkkkkooooooooookkkkk..",
    "..koooooooooooooooooook.",
    "..kkkkkkkkkkkkkkkkkkkk.."
  ],
  24
);

const FLAME_C = (h: number): Frame => {
  // Llama chunky de 2 tonos + núcleo blanco; h = altura extra.
  const f: string[] = [
    "......kOk.....",
    ".....kOOk.....",
    ".....kOOOk....",
    "....kOOOOOk...",
    "....kOYYYOk...",
    "...kOYYYYYOk..",
    "...kOYWWYYOk..",
    "...kOYWWYOOk..",
    "....kOYYOOk...",
    "....kkOOOkk..."
  ];
  return pad(h > 0 ? [...times(0, () => ""), ...f] : f.slice(1), 14);
};

export const BONFIRE_C: Frame[] = [
  overlay(FIRE_BASE_C, FLAME_C(1), 5, 8),
  overlay(FIRE_BASE_C, remap(FLAME_C(0), { W: "Y", Y: "O" }), 5, 10),
  overlay(FIRE_BASE_C, FLAME_C(1), 4, 9)
];

// ── Llama de combo (12×14, encendida/apagada) ──────────────────────────────

export const FLAME_ON_C: Frame = pad(
  [
    ".....kOk....",
    "....kOOk....",
    "....kOOOk...",
    "...kOOYOOk..",
    "...kOYYYOk..",
    "..kOYYWYYOk.",
    "..kOYWWWYOk.",
    "..kOYWWYYOk.",
    "...kOYYYOk..",
    "....kOOOk...",
    ".....kkk....",
    "............"
  ],
  12
);

export const FLAME_OFF_C: Frame = pad(
  [
    ".....ksk....",
    "....kssk....",
    "....ksssk...",
    "...ksssssk..",
    "...ksdddsk..",
    "..ksddddssk.",
    "..ksdddddsk.",
    "..ksdddddsk.",
    "...ksdddsk..",
    "....ksssk...",
    ".....kkk....",
    "............"
  ],
  12
);

// ── FORJA-TRON: cabina recreativa con marquesina (36×48) ───────────────────

export const FORJATRON_C: Frame = pad(
  [
    "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
    ".kkYYYYYYYYYYYYYYYYYYYYYYYYYYYYkk.",
    ".kYOkOkOkOkOkOkOkOkOkOkOkOkOkOkYk.",
    ".kYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYk.",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    ".kkMMMkkkkkkkkkkkkkkkkkkkkkkMMMkk.",
    ".kkkkkkNNNNNNNNNNNNNNNNNNNNkkkkkk.",
    ".kkSSkkNNNNNNNNNNNNNNNNNNNNkkSSkk.",
    ".kkSSkkNNNkOkNNNNNNNNkOkNNNkkSSkk.",
    ".kkSSkkNNkOOOkNNNNNNkOOOkNNkkSSkk.",
    ".kkSSkkNNkOYOkNNNNNNkOYOkNNkkSSkk.",
    ".kkSSkkNNNkOkNNNNNNNNkOkNNNkkSSkk.",
    ".kkSSkkNNNNNNNkWWkNNNNNNNNNkkSSkk.",
    ".kkSSkkNNNNNNkWWWWkNNNNNNNNkkSSkk.",
    ".kkSSkkNNNNNNNkWWkNNNNNNNNNkkSSkk.",
    ".kkSSkkNNNNNNNNNNNNNNNNNNNNkkSSkk.",
    ".kkkkkkNNNNNNNNNNNNNNNNNNNNkkkkkk.",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    ".kksssssssssssssssssssssssssssskk.",
    ".kksssskkkkkkkkkkkkkkkkkkkssssskk.",
    ".kkssskYYYYYYYYYYYYYYYYYYYksssskk.",
    ".kkssskYYYYYYYYYYYYYYYYYYYksssskk.",
    ".kksssskkkkkkkkkkkkkkkkkkkssssskk.",
    ".kkssssssssssRRsssssssssssssssskk.",
    ".kksssssssssRRRRssssssssssssssskk.",
    ".kksssssssssRRRRssssssssssssssskk.",
    ".kkssssssssssRRsssssssssssssssskk.",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    ".kkddddddddddddddddddddddddddddkk.",
    ".kkddddddddddddddddddddddddddddkk.",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    "..kkkk......................kkkk..",
    "..kkkk......................kkkk.."
  ],
  36
);

// ── Discos de pesas apilables (vistos de canto, apilan en vertical) ────────

export const DISC_BIG_C: Frame = pad(
  ["kkkkkkkkkkkkkkkkkkkk", "kOOOOOOOOWWOOOOOOOOk", "kOOOOOOOOWWOOOOOOOOk", "koooooooooooooooooook", "kkkkkkkkkkkkkkkkkkkk"],
  20
);
export const DISC_MED_C: Frame = pad(
  ["..kkkkkkkkkkkkkkkk..", "..kYYYYYYWWYYYYYYk..", "..kyyyyyyyyyyyyyyk..", "..kkkkkkkkkkkkkkkk.."],
  20
);
export const DISC_SMALL_C: Frame = pad(
  ["....kkkkkkkkkkkk....", "....kSSSSWWSSSSk....", "....kssssssssssk....", "....kkkkkkkkkkkk...."],
  20
);
export const DISC_TINY_C: Frame = pad(
  ["......kkkkkkkk......", "......kTTWWTTk......", "......kkkkkkkk......"],
  20
);

// ── Campana de feria (22×22 · reposo / volteo + badajo) ────────────────────

const BELL_BODY = [
  "........kkkkkk........",
  ".......kkYYYYkk.......",
  "......kkYYWWYYkk......",
  ".....kkYYYWWYYYkk.....",
  ".....kYYYYYYYYYYk.....",
  "....kkYYYYYYYYYYkk....",
  "....kYYYYYYYYYYYYk....",
  "....kYYYYYYYYYYYYk....",
  "....kyyyyyyyyyyyyk....",
  "....kyyyyyyyyyyyyk....",
  "...kkkkkkkkkkkkkkkk...",
  "...kyyyyyyyyyyyyyyk...",
  "...kkkkkkkkkkkkkkkk...",
  "........kkkk..........",
  "........kyyk..........",
  "........kkkk.........."
];
export const BELL_C: Frame = pad(BELL_BODY, 22);
export const BELL_RING_C: Frame = overlay(
  overlay(pad(BELL_BODY.map((r) => "." + r), 22), star("Y", "W", false), 1, 2),
  star("Y", "W", false),
  18,
  4
);

// ── Sellos de misión ───────────────────────────────────────────────────────

/** COMPLETADA: medalla estrella dorada (24×24). */
export const SEAL_DONE_C: Frame = pad(
  [
    "...........kk...........",
    "..........kYYk..........",
    "..........kYYk..........",
    ".........kYYYYk.........",
    ".........kYWWYk.........",
    "..kkkkkkkkYWWYkkkkkkkk..",
    "..kYYYYYYYYWWYYYYYYYYk..",
    "...kkYYYYYYWWYYYYYYkk...",
    ".....kkYYYYYYYYYYkk.....",
    ".......kYYYYYYYYk.......",
    "......kYYYYYYYYYYk......",
    "......kYYYkkkkYYYk......",
    ".....kYYYkk..kkYYYk.....",
    ".....kYYkk....kkYYk.....",
    ".....kykk......kkyk.....",
    ".....kkk........kkk.....",
    "........................"
  ],
  24
);

/** ADAPTADA: escudo teal con llave inglesa (24×24). */
export const SEAL_ADAPT_C: Frame = pad(
  [
    "....kkkkkkkkkkkkkkkk....",
    "....kTTTTTTTTTTTTTTk....",
    "....kTTTTTTTTTTTTTTk....",
    "....kTTkkWWkkWWkkTTk....",
    "....kTTkkWWkkWWkkTTk....",
    "....kTTkkWWWWWWkkTTk....",
    "....kTTTkkWWWWkkTTTk....",
    "....kTTTTkkWWkkTTTTk....",
    "....kTTTTkkWWkkTTTTk....",
    "....kttTTkkWWkkTTttk....",
    "....kttTTkkWWkkTTttk....",
    ".....kttTkkkkkkTttk.....",
    ".....ktttTTTTTTtttk.....",
    "......kttttttttttk......",
    ".......kttttttttk.......",
    ".........kttttk.........",
    "..........kkkk..........",
    "........................"
  ],
  24
);

// ── Seis niveles del world-map (28×22) ─────────────────────────────────────
// 1 fogón · 2 pila de lingotes · 3 martinete · 4 lecho de brasas ·
// 5 horno boca-de-dragón · 6 corona del temple.

const NODE_BASE: Frame = pad(
  times(22, (y) => {
    if (y < 2 || y >= 20) return "k".repeat(28);
    if (y >= 17) return "kk" + "d".repeat(24) + "kk";
    return "kk" + "N".repeat(24) + "kk";
  }),
  28
);

const node = (art: string[], x: number, y: number): Frame =>
  overlay(NODE_BASE, art, x, y);

export const CHAPTER_NODES_C: Frame[] = [
  // 1 · Fogón
  node(
    [
      ".....kOk....",
      "....kOYOk...",
      "...kOYWYOk..",
      "...kOYYYOk..",
      "....kOOOk...",
      "..kkkkkkkkk.",
      ".kssssssssk.",
      ".kkkkkkkkkk."
    ],
    8,
    9
  ),
  // 2 · Pila de lingotes
  node(
    [
      "....kkkkkkkk....",
      "...kSSSSSWSk....",
      "...kkkkkkkkk....",
      ".kkkkkkkkkkkkk..",
      ".kSSSSWSSSSSSk..",
      ".kkkkkkkkkkkkk..",
      "kkkkkkkkkkkkkkkk",
      "kSSWSSSSSSWSSSSk",
      "kkkkkkkkkkkkkkkk"
    ],
    6,
    8
  ),
  // 3 · Martinete (mazo mecánico)
  node(
    [
      "..kkkkkk....",
      "..kSSSSk....",
      "..kssssk....",
      "..kkkkkk....",
      "....kYk.....",
      "....kYk.....",
      "..kkkkkkkk..",
      "..kssssssk..",
      "..kkkkkkkk.."
    ],
    8,
    8
  ),
  // 4 · Lecho de brasas
  node(
    [
      ".O..Y..O..Y..O..",
      "kOkkYkkOkkYkkOkk",
      "koookoookoookook",
      "kkkkkkkkkkkkkkkk"
    ],
    6,
    13
  ),
  // 5 · Horno boca-de-dragón
  node(
    [
      "..kkkkkkkkkkkk..",
      ".kksssssssssskk.",
      "kkskkkkkkkkkkskk",
      "kkskOOOOOOOOkskk",
      "kkskOYYWWYYOkskk",
      "kkskOYWWWWYOkskk",
      "kkskOOYYYYOOkskk",
      "kkskkkkkkkkkkskk",
      ".kksssssssssskk."
    ],
    6,
    8
  ),
  // 6 · Corona del temple
  node(
    [
      "kYk..kYk..kYk",
      "kYYk.kYk.kYYk",
      "kYYYkYYYkYYYk",
      "kYYYYYYYYYYYk",
      "kYYWWYYYWWYYk",
      "kyyyyyyyyyyyk",
      "kkkkkkkkkkkkk"
    ],
    7,
    9
  )
];

// ── Moneda (14×14) ─────────────────────────────────────────────────────────

export const COIN_C: Frame = pad(
  [
    "....kkkkkk....",
    "..kkYYYYYYkk..",
    ".kYYWWYYYYYYk.",
    ".kYWWYYYYYYYk.",
    "kYYWYkkkkYYYYk",
    "kYYYYkkkkYYYYk",
    "kYYYYYkkYYYYYk",
    "kYYYYYkkYYYYYk",
    "kYYYYYkkYYYYyk",
    ".kYYYYkkYYYyk.",
    ".kyYYYYYYYyyk.",
    "..kkyyyyyykk..",
    "....kkkkkk....",
    ".............."
  ],
  14
);
