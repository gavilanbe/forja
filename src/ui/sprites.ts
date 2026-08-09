// Arte pixel original de FORJA. Cada sprite es un mapa de caracteres
// sobre la paleta del proyecto; se renderiza como SVG con bordes nítidos.
// Nada de emojis, ni personajes ajenos, ni assets externos.

export const PALETTE: Record<string, string> = {
  k: "#05070d", // contorno
  K: "#232c40", // acero oscuro
  s: "#3b4963", // acero
  S: "#9aa7bd", // acero claro
  w: "#f4e7c5", // pergamino / núcleo caliente
  e: "#ff873d", // brasa
  E: "#c2532a", // brasa profunda
  y: "#ffd166", // oro
  Y: "#b98f2f", // oro profundo
  d: "#50e3c2", // completado
  b: "#65a8ff", // azul
  B: "#3c6ea8", // azul profundo
  r: "#f25f5c", // peligro
  W: "#f5b942", // advertencia
  o: "#6b4a2f", // madera
  O: "#8c6239", // madera clara
  "1": "#d99e77", // piel Nahuel
  "2": "#b0764e", // piel Nahuel sombra
  "4": "#2a2c34", // pelo Nahuel
  "5": "#e9bd8f", // piel Carlos
  "6": "#c08b5c", // piel Carlos sombra
  "7": "#5c4330" // pelo Carlos
};

export type SpriteMap = string[];

/** Retrato de Nahuel: pelo corto oscuro, barba, camiseta brasa. */
export const AVATAR_NAHUEL: SpriteMap = [
  "....44444444....",
  "...4444444444...",
  "..444444444444..",
  "..444111111444..",
  ".44111111111144.",
  ".4411k1111k1144.",
  ".44111211211144.",
  ".44411111111444.",
  "..444422224444..",
  "....21111112....",
  "..1112eeee2111..",
  ".111eeeeeeee111.",
  ".112eeeeeeee211.",
  ".11eEEeeeeEEe11.",
  ".12eeeeeeeeee21.",
  ".EEeeeeEEeeeeEE."
];

/** Retrato de Carlos: pelo castaño rizado, camiseta azul. */
export const AVATAR_CARLOS: SpriteMap = [
  "...777777777....",
  "..77777777777...",
  ".7777777777777..",
  ".7775555555777..",
  ".77555555555577.",
  ".7755k5555k5577.",
  ".77555655655577.",
  ".77555555555577.",
  "...5556666555...",
  "....65555556....",
  "..5556bbbb6555..",
  ".555bbbbbbbb555.",
  ".556bbbbbbbb655.",
  ".55bBBbbbbBBb55.",
  ".56bbbbbbbbbb65.",
  ".BBbbbbBBbbbbBB."
];

/** Llama de la Forja — dos fotogramas. */
export const FLAME_A: SpriteMap = [
  "....e.....",
  "....e.....",
  "...ee.....",
  "...eee....",
  "..eeeee...",
  ".eeeeee...",
  ".eeyyee.e.",
  "eeyyyyee..",
  "eyywyyye..",
  "eyywwyye..",
  ".eyywwye..",
  "..eyyye..."
];

export const FLAME_B: SpriteMap = [
  ".....e....",
  ".....e....",
  ".....ee...",
  "....eee...",
  "...eeeee..",
  "...eeeeee.",
  ".e.eeyyee.",
  "..eeyyyyee",
  "..eyyywyye",
  "..eyywwyye",
  "..eywwyye.",
  "...eyyye.."
];

/** Llama apagada (semana sin objetivo): rescoldo gris. */
export const FLAME_OUT: SpriteMap = [
  "..........",
  "..........",
  "..........",
  "..........",
  "....s.....",
  "...ss.....",
  "...sKs....",
  "..sKKs....",
  ".sKKKKs...",
  ".sKKKKKs..",
  ".KKssKKK..",
  "..KKKKK..."
];

/** Campamento: hoguera con leños cruzados. */
export const CAMPFIRE: SpriteMap = [
  "..............",
  "..............",
  "......ee......",
  ".....eee......",
  "....eeeee.....",
  "....eyyee.....",
  "...eyywyye....",
  "....eyyye.....",
  ".oo........oo.",
  "..ooo....ooo..",
  "....oooooo....",
  "..OOOooooOOO.."
];

/** Yunque con brasa (identidad de la app). */
export const ANVIL: SpriteMap = [
  ".......e........",
  "......ee........",
  "......eye.......",
  ".....eyye.......",
  ".SSSSSSSSSSSSS..",
  ".sssssssssssss..",
  "...ssssssss.....",
  ".....ssss.......",
  ".....Ksss.......",
  "....ssssss......",
  "...ssssssss.....",
  "..KssssssssK....",
  ".KKKKKKKKKKKK...",
  ".KKKKKKKKKKKK...",
  "................",
  "................"
];

/** Cofre del botín (resumen de misión). */
export const CHEST_CLOSED: SpriteMap = [
  "..............",
  "..oooooooooo..",
  ".oOOOOOOOOOOo.",
  ".oOooooooooOo.",
  ".oooooyyooooo.",
  ".oOooooooooOo.",
  ".oOOOOOOOOOOo.",
  ".oooooyyooooo.",
  ".oOooyyyyooOo.",
  ".oOOOOOOOOOOo.",
  "..oooooooooo..",
  ".............."
];

export const CHEST_OPEN: SpriteMap = [
  "..y..w..y..w..",
  ".oooooooooo.y.",
  "oOOOOOOOOOOo..",
  "oyyyyyyyyyyo.w",
  "oyywyyyywyyo..",
  ".oooooooooo...",
  ".oOOOOOOOOOo..",
  ".oooooyyooOo..",
  ".oOooyyyyooo..",
  ".oOOOOOOOOOo..",
  "..ooooooooo...",
  ".............."
];

// ── Iconos de navegación (12×12) ────────────────────────────────────────────

export const ICON_HOY: SpriteMap = [
  "............",
  ".....e......",
  "....eye.....",
  ".SSSSSSSSSS.",
  ".ssssssssss.",
  "...ssssss...",
  "....ssss....",
  "....ssss....",
  "...ssssss...",
  "..ssssssss..",
  ".KKKKKKKKKK.",
  "............"
];

export const ICON_CAMPANA: SpriteMap = [
  "............",
  "..seeeeee...",
  "..seeeeeee..",
  "..seeeeeee..",
  "..seeeeee...",
  "..seeee.....",
  "..s.........",
  "..s.........",
  "..s.........",
  "..s.........",
  ".sss........",
  "............"
];

export const ICON_PROGRESO: SpriteMap = [
  "............",
  ".........dd.",
  ".........dd.",
  ".....yy..dd.",
  ".....yy..dd.",
  ".ee..yy..dd.",
  ".ee..yy..dd.",
  ".ee..yy..dd.",
  ".ee..yy..dd.",
  ".ee..yy..dd.",
  ".ssssssssss.",
  "............"
];

export const ICON_CODICE: SpriteMap = [
  "............",
  ".YYYYYYYYYY.",
  ".YyyyyyyyYY.",
  ".YyyyyyyyYY.",
  ".YyssyyyyYY.",
  ".YyyyyyyyYY.",
  ".YyyyyyyyYY.",
  ".YyssyyyyYY.",
  ".YyyyyyyyYY.",
  ".YYYYYYYYYY.",
  ".KKKKKKKKKK.",
  "............"
];

export const ICON_PERFIL: SpriteMap = [
  "............",
  "....SSSS....",
  "...SSSSSS...",
  "...SSSSSS...",
  "...SSSSSS...",
  "....SSSS....",
  ".....SS.....",
  "..SSSSSSSS..",
  ".SSSSSSSSSS.",
  ".SSSSSSSSSS.",
  ".SSSSSSSSSS.",
  "............"
];

// ── Glifos de estado (8×8) ──────────────────────────────────────────────────

export const GLYPH_CHECK: SpriteMap = [
  "........",
  "......d.",
  ".....dd.",
  "d...dd..",
  "dd.dd...",
  ".ddd....",
  "..d.....",
  "........"
];

export const GLYPH_LOCK: SpriteMap = [
  "..ssss..",
  ".s....s.",
  ".s....s.",
  ".yyyyyy.",
  ".yyKKyy.",
  ".yyyyyy.",
  ".yyyyyy.",
  "........"
];

export const GLYPH_CROSS: SpriteMap = [
  "........",
  ".r....r.",
  "..r..r..",
  "...rr...",
  "...rr...",
  "..r..r..",
  ".r....r.",
  "........"
];

export const GLYPH_STAR: SpriteMap = [
  "...yy...",
  "...yy...",
  ".yyyyyy.",
  "..yyyy..",
  "...yy...",
  "..y..y..",
  "........",
  "........"
];

export const GLYPH_ADAPT: SpriteMap = [
  "...WW...",
  "..WWWW..",
  ".WWWWWW.",
  ".WWkkWW.",
  "..WWWW..",
  "...WW...",
  "........",
  "........"
];

export const GLYPH_HAMMER: SpriteMap = [
  "..ssss..",
  "..ssss..",
  "..ssss..",
  "....o...",
  "....o...",
  "....o...",
  "....o...",
  "........"
];

/** Chispas de finalización (efecto breve). */
export const SPARK: SpriteMap = [
  ".y.",
  "ywy",
  ".y."
];

// ── Estados de la Llama de la Forja ─────────────────────────────────────────
// apagada = FLAME_OUT · rescoldo = FLAME_EMBER · encendida = FLAME_A/B
// al rojo = FLAME_RED_A/B

/** Rescoldo: ceniza con brasa aún viva dentro. */
export const FLAME_EMBER: SpriteMap = [
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "....e.....",
  "...sE.....",
  "..sKEs....",
  ".sKEeKs...",
  ".KKEeEKK..",
  ".KKsEsKK..",
  "..KKKKK..."
];

/** Llama al rojo: objetivo semanal cumplido. Núcleo blanco, dos fotogramas. */
export const FLAME_RED_A: SpriteMap = [
  "....e.....",
  "...ee..e..",
  "...eee.e..",
  "..eeeee...",
  ".eeeyeee..",
  ".eyyyyee..",
  "eyywyyyee.",
  "eywwwyyee.",
  "eywwwwye..",
  ".eywwwye..",
  "..eywyye..",
  "...eyye..."
];

export const FLAME_RED_B: SpriteMap = [
  ".....e....",
  "..e..ee...",
  "..e.eee...",
  "...eeeee..",
  "..eeeyeee.",
  "..eeyyyye.",
  ".eeyyywyye",
  ".eeyywwwye",
  "..eywwwwye",
  "..eywwwye.",
  "..eyywye..",
  "...eyye..."
];

// ── Hoguera animada (campamento) ────────────────────────────────────────────

export const CAMPFIRE_B: SpriteMap = [
  "..............",
  "......e.......",
  ".....ee.......",
  "......eee.....",
  "....eeeee.....",
  "....eyyeee....",
  "...eyywyye....",
  "....eyyye.....",
  ".oo........oo.",
  "..ooo....ooo..",
  "....oooooo....",
  "..OOOooooOOO.."
];

// ── Golpe de yunque (secuencia de misión sellada) ───────────────────────────
// 18×18 · martillo levantado → cayendo → impacto con chispas → reposo.

export const STRIKE_1: SpriteMap = [
  "..........SSS.....",
  ".........SSSSs....",
  ".........SssSs....",
  "..........sOo.....",
  "..........Oo......",
  ".........Oo.......",
  "..................",
  "..................",
  "..SSSSSSSSSSSSS...",
  "..sssssssssssss...",
  "....ssssssss......",
  "......ssss........",
  "......Ksss........",
  ".....ssssss.......",
  "....ssssssss......",
  "...KssssssssK.....",
  "..KKKKKKKKKKKK....",
  "..KKKKKKKKKKKK...."
];

export const STRIKE_2: SpriteMap = [
  "..................",
  "..................",
  "......SSS.........",
  ".....SSSSs........",
  ".....SssSs........",
  "......sOo.........",
  ".......Oo.........",
  "........Oo........",
  "..SSSSSSSSSSSSS...",
  "..sssssssssssss...",
  "....ssssssss......",
  "......ssss........",
  "......Ksss........",
  ".....ssssss.......",
  "....ssssssss......",
  "...KssssssssK.....",
  "..KKKKKKKKKKKK....",
  "..KKKKKKKKKKKK...."
];

export const STRIKE_3: SpriteMap = [
  "..................",
  "....w.....y.......",
  "..y...w.....w.....",
  "....y..SSS...y....",
  "..w...SSSSs.......",
  "...y..SssSs..w....",
  "......sOo..y......",
  "....y..Oo.........",
  "..SSSSSSSSSSSSS...",
  "..sssssssssssss...",
  "....ssssssss......",
  "......ssss........",
  "......Ksss........",
  ".....ssssss.......",
  "....ssssssss......",
  "...KssssssssK.....",
  "..KKKKKKKKKKKK....",
  "..KKKKKKKKKKKK...."
];

export const STRIKE_4: SpriteMap = [
  "..................",
  "..................",
  "..................",
  ".......SSS........",
  "......SSSSs.......",
  "......SssSs.......",
  ".......sOo.e......",
  "..e.....Oo........",
  "..SSSSSSSSSSSSS...",
  "..sssssssssssss...",
  "....ssssssss......",
  "......ssss........",
  "......Ksss........",
  ".....ssssss.......",
  "....ssssssss......",
  "...KssssssssK.....",
  "..KKKKKKKKKKKK....",
  "..KKKKKKKKKKKK...."
];

// ── Sellos de misión ────────────────────────────────────────────────────────

/** Sello de misión completada: medalla de oro con marca forjada. */
export const SEAL_COMPLETE: SpriteMap = [
  ".....yyyyyy.....",
  "...yyYYYYYYyy...",
  "..yYYyyyyyyYYy..",
  ".yYyyyyyyyyyyYy.",
  ".yYyyyyyyyydyYy.",
  "yYyyyyyyyyddyYyy",
  "yYyydyyyyddyyYyy",
  "yYyyddyyddyyyYyy",
  "yYyyyddddyyyyYyy",
  "yYyyyyddyyyyyYyy",
  ".yYyyyyyyyyyyYy.",
  ".yYyyyyyyyyyyYy.",
  "..yYYyyyyyyYYy..",
  "...yyYYYYYYyy...",
  ".....yyyyyy.....",
  "................"
];

/** Sello de misión adaptada: la decisión inteligente, en acero y oro. */
export const SEAL_ADAPTED: SpriteMap = [
  ".....SSSSSS.....",
  "...SSssssssSS...",
  "..SssssssssssS..",
  ".SsssssyysssssS.",
  ".SssssyyyyssssS.",
  "SsssyyyyyyyysssS",
  "SssyyyWWyyyyssSS",
  "SssyyWWWWyyyssSS",
  "SssyyyWWyyyyssSS",
  "SsssyyyyyyyysssS",
  ".SssssyyyyssssS.",
  ".SsssssyysssssS.",
  "..SssssssssssS..",
  "...SSssssssSS...",
  ".....SSSSSS.....",
  "................"
];

// ── Hitos de capítulo (mapa de campaña, 12×12) ──────────────────────────────

/** Cap. 1 — El primer fuego: una brasa recién prendida. */
export const CH_FIRE: SpriteMap = [
  "............",
  "............",
  ".....e......",
  ".....e......",
  "....ee......",
  "....eye.....",
  "...eyye.....",
  "...eywe.....",
  "....eye.....",
  "..KKKKKK....",
  ".KKKKKKKK...",
  "............"
];

/** Cap. 2 — Acero templado: lingote enfriándose. */
export const CH_INGOT: SpriteMap = [
  "............",
  "............",
  "....b..b....",
  "............",
  "...SSSSSS...",
  "..SSssssss..",
  "..Ssssssss..",
  "..ssssssss..",
  "..KKKKKKKK..",
  "............",
  "............",
  "............"
];

/** Cap. 3 — El martillo cae. */
export const CH_HAMMER: SpriteMap = [
  "............",
  "...SSSS.....",
  "...SSSSs....",
  "...SssSs....",
  "....sOo.....",
  ".....Oo.....",
  "......Oo....",
  ".......Oo...",
  "........o...",
  "............",
  "............",
  "............"
];

/** Cap. 4 — Brasas vivas: carbones al rojo. */
export const CH_EMBERS: SpriteMap = [
  "............",
  "............",
  "............",
  "....e..y....",
  "...eEeeEe...",
  "..eEyeEyEe..",
  "..EeEeeEeE..",
  "...KEKKEK...",
  "....KKKK....",
  "............",
  "............",
  "............"
];

/** Cap. 5 — Forja profunda: boca del horno encendida. */
export const CH_FURNACE: SpriteMap = [
  "............",
  "...KKKKKK...",
  "..KKKKKKKK..",
  ".KKeeeeeeKK.",
  ".KKeyyyyeKK.",
  ".KKeywwyeKK.",
  ".KKeyyyyeKK.",
  ".KKeeeeeeKK.",
  ".KKKKKKKKKK.",
  ".KsKKKKKKsK.",
  "............",
  "............"
];

/** Cap. 6 — La prueba del temple: estandarte de checkpoint. */
export const CH_BANNER: SpriteMap = [
  "............",
  "..ssssssss..",
  "..syyyyyys..",
  "..syYYYYys..",
  "..syYyyYys..",
  "..syYyyYys..",
  "..syYYYYys..",
  "..syyyyyys..",
  "..syy..yys..",
  "..sy....ys..",
  "............",
  "............"
];

export const CHAPTER_ICONS: SpriteMap[] = [
  CH_FIRE,
  CH_INGOT,
  CH_HAMMER,
  CH_EMBERS,
  CH_FURNACE,
  CH_BANNER
];

// ── Estados de avatar ───────────────────────────────────────────────────────
// neutral (AVATAR_*), preparado (cinta de brasa), celebrando (sonrisa y
// chispas) y recuperándose (toalla y gesto relajado).

export const AVATAR_NAHUEL_READY: SpriteMap = [
  "....44444444....",
  "...4444444444...",
  "..444444444444..",
  "..4eEEEEEEEEe4..",
  ".44111111111144.",
  ".4411k1111k1144.",
  ".44111211211144.",
  ".44411111111444.",
  "..444422224444..",
  "....21111112....",
  "..1112eeee2111..",
  ".111eeeeeeee111.",
  ".112eeeeeeee211.",
  ".11eEEeeeeEEe11.",
  ".12eeeeeeeeee21.",
  ".EEeeeeEEeeeeEE."
];

export const AVATAR_NAHUEL_CHEER: SpriteMap = [
  "y...44444444...y",
  "...4444444444...",
  "..444444444444..",
  "..444111111444..",
  ".44111111111144.",
  ".4411k1111k1144.",
  ".44111111111144.",
  ".44411kkkk11444.",
  "..44422kk22444..",
  "....21111112....",
  "..1112eeee2111..",
  ".111eeeeeeee111.",
  ".112eeeeeeee211.",
  ".11eEEeeeeEEe11.",
  ".12eeeeeeeeee21.",
  ".EEeeeeEEeeeeEE."
];

export const AVATAR_NAHUEL_REST: SpriteMap = [
  "....wwwwwwww....",
  "...wwwwwwwwww...",
  "..44wwwwwwww44..",
  "..444111111444..",
  ".44111111111144.",
  ".44b1kk11kk1144.",
  ".44111211211144.",
  ".44411111111444.",
  "..444422224444..",
  "....21111112....",
  "..1112eeee2111..",
  ".111eeeeeeee111.",
  ".112eeeeeeee211.",
  ".11eEEeeeeEEe11.",
  ".12eeeeeeeeee21.",
  ".EEeeeeEEeeeeEE."
];

export const AVATAR_CARLOS_READY: SpriteMap = [
  "...777777777....",
  "..77777777777...",
  ".7777777777777..",
  ".7eEEEEEEEEEe7..",
  ".77555555555577.",
  ".7755k5555k5577.",
  ".77555655655577.",
  ".77555555555577.",
  "...5556666555...",
  "....65555556....",
  "..5556bbbb6555..",
  ".555bbbbbbbb555.",
  ".556bbbbbbbb655.",
  ".55bBBbbbbBBb55.",
  ".56bbbbbbbbbb65.",
  ".BBbbbbBBbbbbBB."
];

export const AVATAR_CARLOS_CHEER: SpriteMap = [
  "y..777777777...y",
  "..77777777777...",
  ".7777777777777..",
  ".7775555555777..",
  ".77555555555577.",
  ".7755k5555k5577.",
  ".77555555555577.",
  ".77555kkkk55577.",
  "...5566kk66555..",
  "....65555556....",
  "..5556bbbb6555..",
  ".555bbbbbbbb555.",
  ".556bbbbbbbb655.",
  ".55bBBbbbbBBb55.",
  ".56bbbbbbbbbb65.",
  ".BBbbbbBBbbbbBB."
];

export const AVATAR_CARLOS_REST: SpriteMap = [
  "...wwwwwwwww....",
  "..wwwwwwwwwww...",
  ".77wwwwwwwww77..",
  ".7775555555777..",
  ".77555555555577.",
  ".77b5kk55kk5577.",
  ".77555655655577.",
  ".77555555555577.",
  "...5556666555...",
  "....65555556....",
  "..5556bbbb6555..",
  ".555bbbbbbbb555.",
  ".556bbbbbbbb655.",
  ".55bBBbbbbBBb55.",
  ".56bbbbbbbbbb65.",
  ".BBbbbbBBbbbbBB."
];

// ── Entorno: silueta de maquinaria de la forja (fondo, muy sutil) ───────────

export const ENV_FORGE: SpriteMap = [
  "......K.........................",
  "......K..............K..........",
  "..KKK.K..............K..........",
  "..KKKKK......KK......KKK........",
  "..KKKKK.....KKKK.....KKK........",
  "..KKKKK....KKKKKK....KKK....KK..",
  ".KKKKKKK...KKEKKK...KKKKK..KKKK.",
  ".KKKEKKK..KKKKKKKK..KKEKK..KKKK.",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK"
];

export type AvatarMood = "neutral" | "preparado" | "celebrando" | "recuperando";

export const avatarSprite = (
  avatarId: "nahuel" | "carlos",
  mood: AvatarMood = "neutral"
): SpriteMap => {
  if (avatarId === "carlos") {
    return mood === "preparado"
      ? AVATAR_CARLOS_READY
      : mood === "celebrando"
        ? AVATAR_CARLOS_CHEER
        : mood === "recuperando"
          ? AVATAR_CARLOS_REST
          : AVATAR_CARLOS;
  }
  return mood === "preparado"
    ? AVATAR_NAHUEL_READY
    : mood === "celebrando"
      ? AVATAR_NAHUEL_CHEER
      : mood === "recuperando"
        ? AVATAR_NAHUEL_REST
        : AVATAR_NAHUEL;
};
