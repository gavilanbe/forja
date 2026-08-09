// Dirección A — atrezzo monumental: yunque de bloque, chispas, hoguera,
// horno de la fragua, sellos y los seis ambientes de capítulo.

import { overlay, remap, shiftY, times, type Frame } from "../engine";

/** Yunque monumental 56×28, con brasa reflejada en el canto inferior. */
export const ANVIL_A: Frame = [
  "........................................................",
  "..HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH.............",
  ".HssssssssssssssssssssssssssssssssssssssssH............",
  ".SssssssssssssssssssssssssssssssssssssssssS............",
  ".SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS............",
  "..kSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSk..............",
  "....kSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSk................",
  ".......kSSSSSSSSSSSSSSSSSSSSSSSSSSSk...................",
  ".........kISSSSSSSSSSSSSSSSSSSSSIk.....................",
  "...........kISSSSSSSSSSSSSSSSSIk.......................",
  "............kISSSSSSSSSSSSSSSIk........................",
  "............kISSSSSSSSSSSSSSSIk........................",
  "...........kISSSSSSSSSSSSSSSSSIk.......................",
  "..........kISSSSSSSSSSSSSSSSSSSIk......................",
  ".........kISSSSSSSSSSSSSSSSSSSSSIk.....................",
  "........kIISSSSSSSSSSSSSSSSSSSSSIIk....................",
  ".......kIIIIIIIIIIIIIIIIIIIIIIIIIIIk...................",
  ".......kIIIIIIIIIIIIIIIIIIIIIIIIIIIk...................",
  ".......kKKKKKKKKKKKKKKKKKKKKKKKKKKKk...................",
  ".......kKKKKKKKKKKKKKKKKKKKKKKKKKKKk...................",
  "......kKKKKKKKKKKKKKKKKKKKKKKKKKKKKKk..................",
  "......keeKKKKKKKKKKKKKKKKKKKKKKKKeeKk..................",
  "......keeeKKKKKKKKKKKKKKKKKKKKKeeeeKk..................",
  "......kEEeeKKKKKKKKKKKKKKKKKKeeeEEEKk..................",
  "........EEEeeeeeeeeeeeeeeeeeeeEEE......................",
  "........................................................",
  "........................................................",
  "........................................................"
];

/** Chispas de impacto — 6 fotogramas 32×20. */
const S0: Frame = times(20, () => "................................");
export const SPARKS_A: Frame[] = [
  overlay(S0, ["......W......", "....W...W....", "......Y......"], 9, 8),
  overlay(S0, ["...W.....W...", ".Y...W....Y..", "...Y...Y.....", ".....Y......."], 8, 6),
  overlay(
    S0,
    ["..Y.......Y..", "W...........W", "...Y.....Y...", ".Y.........Y.", "....y...y...."],
    8,
    4
  ),
  overlay(
    S0,
    ["Y...........Y", ".............", "..y.......y..", ".............", "y.....y.....y"],
    8,
    2
  ),
  overlay(S0, ["y...........y", ".............", "....e...e....", ".............", "e...........e"], 8, 1),
  S0
];

/** Hoguera de campamento 40×32, 4 fotogramas. */
const FIRE_BASE: Frame = [
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "......oo....................oo..........",
  ".......ooo...............ooo............",
  ".........oooo.........oooo..............",
  "...........ooooooooooo..................",
  "........qqqooooooooooooqqq..............",
  "......EEeeeeeeeeeeeeeeeeeeEE............",
  "........................................",
  "........................................"
];

const FLAME_TALL: Frame = [
  "........e.......",
  "........ee......",
  ".......eee......",
  ".......eeee.....",
  "......eeOee.....",
  "......eOOOe.....",
  ".....eOOyOOe....",
  ".....eOyyyOe....",
  "....eOOyWyOOe...",
  "....eOyWWWyOe...",
  "....eOyWWWyOe...",
  ".....eOyWyOe....",
  ".....eeOyOee....",
  "......eeOee.....",
  ".......eee......"
];

export const CAMPFIRE_A: Frame[] = [
  overlay(FIRE_BASE, FLAME_TALL, 12, 10),
  overlay(FIRE_BASE, shiftY(FLAME_TALL, -1), 12, 10),
  overlay(FIRE_BASE, remap(shiftY(FLAME_TALL, 0), { W: "y", y: "O" }), 13, 10),
  overlay(FIRE_BASE, shiftY(FLAME_TALL, -1), 11, 10)
];

/** Horno de la fragua 64×40 (maquinaria de fondo), 2 fases de brasa. */
const FURNACE_BASE: Frame = [
  "................................................................",
  "....KKKKKKKKKKKKKKKKKKKK........................................",
  "....KIIIIIIIIIIIIIIIIIIK.....KKKKKKKKKK.........................",
  "....KIIIIIIIIIIIIIIIIIIK.....KIIIIIIIIK.........................",
  "....KIIKKKKKKKKKKKKKIIIK.....KIIIIIIIIK.....KKKKKKKKKKKKKK......",
  "....KIIKKKKKKKKKKKKKIIIKKKKKKKIIIIIIIIKKKKKKKIIIIIIIIIIIIK......",
  "....KIIKKKKKKKKKKKKKIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIK......",
  "....KIIKKKKKKKKKKKKKIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIK......",
  "....KIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIK......",
  "..KKKIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIKKK....",
  "..KIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIK....",
  "..KIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIK....",
  "..KIISSSSSSSSSSSSSSIIIIIIIIIIIIIIIIIIIIIIIIISSSSSSSSSSSSIIIK....",
  "..KIISSSSSSSSSSSSSSIIIIKKKKKKKKKKKKKKKKIIIIISSSSSSSSSSSSIIIK....",
  "..KIISSSSSSSSSSSSSSIIIIKDDDDDDDDDDDDDDKIIIIISSSSSSSSSSSSIIIK....",
  "..KIIIIIIIIIIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIIIIIIIIIIK....",
  "..KIIIIIIIIIIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIIIIIIIIIIK....",
  "..KIIIIIIIIIIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIIIIIIIIIIK....",
  "..KKKKKKKKKKKKKKKKKKKKKKDDDDDDDDDDDDDDKKKKKKKKKKKKKKKKKKKKKK....",
  "..KIIIIIIIKKIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIKKIIIIIIIK....",
  "..KIIIIIIIKKIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIKKIIIIIIIK....",
  "..KIIIIIIIKKIIIIIIIIIIIKDDDDDDDDDDDDDDKIIIIIIIIIIIKKIIIIIIIK....",
  "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK....",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................"
];

const GLOW_LOW: Frame = ["EEeeEE", "eeOOee", "EeOOeE"];
const GLOW_HIGH: Frame = ["eOOOOe", "OyWWyO", "eOyyOe"];

export const FURNACE_A: Frame[] = [
  overlay(FURNACE_BASE, GLOW_LOW, 29, 15),
  overlay(FURNACE_BASE, GLOW_HIGH, 29, 15)
];

/** Sello de misión completada 28×28: medallón de oro con yunque grabado. */
export const SEAL_DONE_A: Frame = [
  "..........YYYYYYYY..........",
  ".......YYYyyyyyyyyYYY.......",
  ".....YYyyyyyyyyyyyyyyYY.....",
  "....Yyyyyyyyyyyyyyyyyy Y....",
  "...YyyyyywwwwwwwwyyyyyyY....",
  "..Yyyyyywyyyyyyyywyyyyyy Y..",
  "..YyyyywyyyyyyyyyywyyyyyY...",
  ".YyyyyywyyyyyyyyyywyyyyyyY..",
  ".YyyyyyySSSSSSSSSSyyyyyyyY..",
  "Yyyyyyyyy SSSSSS yyyyyyyyyY.",
  "YyyyyyyyyySSSSSSyyyyyyyyyyY.",
  "Yyyyyyyyy SSSSSS yyyyyyyyyY.",
  "YyyyyyyySSSSSSSSSSyyyyyyyyY.",
  "YyyyyyySSSSSSSSSSSSyyyyyyyY.",
  "YyyyyyKKKKKKKKKKKKKKyyyyyyY.",
  ".YyyyyyKKKKKKKKKKKKyyyyyyY..",
  ".YyyyyyyyyyyyyyyyyyyyyyyyY..",
  "..YyyyywyyyyyyyyyyWyyyyyY...",
  "..YyyyyywyyyyyyyywyyyyyyY...",
  "...YyyyyywwwwwwwwyyyyyyY....",
  "....Yyyyyyyyyyyyyyyyyy Y....",
  ".....YYyyyyyyyyyyyyyyYY.....",
  ".......YYYyyyyyyyyYYY.......",
  "..........YYYYYYYY..........",
  "............................",
  "............................",
  "............................",
  "............................"
];

/** Sello de misión adaptada: acero templado con gota de temple. */
export const SEAL_ADAPT_A: Frame = remap(
  overlay(SEAL_DONE_A, ["...dd...", "..dddd..", ".dddddd.", ".dddddd.", "..dddd.."], 10, 8),
  { Y: "H", y: "s", w: "H", W: "H" }
);

/** Seis ambientes de capítulo 36×24: la forja evoluciona.
 *  Fondo común: muro de hierro remachado y suelo de piedra visibles. */
const CH_BASE: Frame = times(24, (y) => {
  if (y >= 21) return "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII";
  if (y === 20) return "SISSISSISSISSISSISSISSISSISSISSISSIS";
  const row = times(36, (x) => {
    if (y === 2 || y === 11) return x % 2 === 0 ? "K" : ".";
    if ((y === 5 || y === 14) && x % 9 === 4) return "I";
    return ".";
  });
  return row.join("");
});

export const CHAPTER_SCENES_A: Frame[] = [
  // 1 · El primer fuego: brasero de pie encendido
  overlay(
    overlay(
      CH_BASE,
      ["...KKKKKKKK...", "..KKKKKKKKKK..", "..KIKKKKKKIK..", "....KK..KK....", "....KK..KK....", "..KKKKKKKKKK.."],
      11,
      15
    ),
    ["...ee...", "..eeee..", ".eeOOee.", ".eOyyOe.", "eOyWWyOe", ".eOyyOe.", "..eOOe.."],
    14,
    8
  ),
  // 2 · Acero templado: cubeta de temple con vapor
  overlay(
    overlay(
      CH_BASE,
      ["KKKKKKKKKKKKKKKK", "KbbbbbbbbbbbbbbK", "KbHbbbbbbbbbHbbK", "KKKKKKKKKKKKKKKK", ".KK..........KK."],
      10,
      15
    ),
    ["..H....H....", ".H....H...H.", "H....H....H.", ".H....H....."],
    12,
    9
  ),
  // 3 · El martillo cae: yunque de trabajo con martillo clavado
  overlay(
    overlay(
      CH_BASE,
      [
        "HHHHHHHHHHHHHH",
        "SSSSSSSSSSSSSS",
        "..kSSSSSSSSk..",
        "....SSSSSS....",
        "....KSSSSK....",
        "...KSSSSSSK...",
        "..KKKKKKKKKK.."
      ],
      11,
      14
    ),
    ["kSSSk", "kSssk", "kSssk", "..oo.", "..oo.", "..oo."],
    16,
    7
  ),
  // 4 · Brasas vivas: lecho de carbón al rojo
  overlay(
    CH_BASE,
    [
      "..e..y...e..y..e..",
      ".eEyeEeyeEyeEey.e.",
      "EyEeEyEeEyEeEyEeEy",
      "KEKEKEKEKEKEKEKEKE",
      "KKKKKKKKKKKKKKKKKK"
    ],
    9,
    15
  ),
  // 5 · Forja profunda: boca de horno abierta a fuego vivo
  overlay(
    CH_BASE,
    [
      ".KKKKKKKKKKKKKK.",
      "KKKKKKKKKKKKKKKK",
      "KKeeeeeeeeeeeeKK",
      "KKeOOOOOOOOOOeKK",
      "KKeOyyWWWWyyOeKK",
      "KKeOyWWWWWWyOeKK",
      "KKeOOOOOOOOOOeKK",
      "KKeeeeeeeeeeeeKK",
      "KKKKKKKKKKKKKKKK",
      "KSKKKKKKKKKKKKSK"
    ],
    10,
    10
  ),
  // 6 · La prueba del temple: estandarte de oro con el sello
  overlay(
    overlay(
      CH_BASE,
      [
        "ssssssssssssssss",
        "sYYYYYYYYYYYYYYs",
        "sYyyyyyyyyyyyyYs",
        "sYywwyyyyyywwyYs",
        "sYyyyyyyyyyyyyYs",
        "sYYYYYYYYYYYYYYs",
        "sYyyy......yyyYs",
        "sYyy........yyYs"
      ],
      10,
      8
    ),
    ["kSSSSk", "kSssSk", "kKKKKk"],
    15,
    11
  )
];

/** Lingote de acero 16×8 (data-viz de volumen). */
export const INGOT_A: Frame = [
  "....HHHHHHHHH...",
  "..HHsssssssssH..",
  ".HssssssssssssH.",
  ".SssssssssssssS.",
  ".SSSSSSSSSSSSSS.",
  "..kSSSSSSSSSSk..",
  "...keeeeeeeek...",
  "................"
];

/** Lingote al rojo (recién forjado). */
export const INGOT_HOT_A: Frame = remap(INGOT_A, {
  H: "w",
  s: "O",
  S: "e",
  e: "E"
});

/** Hogar semanal (adherencia): apagado / encendido. */
export const HEARTH_OFF_A: Frame = [
  "..KKKKKK..",
  ".KKKKKKKK.",
  ".KKsKKsKK.",
  ".KKKKKKKK.",
  "..KKKKKK.."
];

export const HEARTH_ON_A: Frame = [
  "....O.....",
  "...OyO....",
  ".KKOWOKK..",
  ".KKeOeKK..",
  "..KKKKKK.."
];

/** Placa remachada (adaptaciones): placa con parche y remaches. */
export const PATCH_PLATE_A: Frame = [
  "SSSSSSSSSSSSSSSS",
  "SsHssssssssssHsS",
  "SssssKKKKKsssssS",
  "SssssKdddKsssssS",
  "SssssKKKKKsssssS",
  "SsHssssssssssHsS",
  "SSSSSSSSSSSSSSSS"
];
