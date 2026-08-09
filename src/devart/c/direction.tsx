// Dirección C — ACERO ARCADE.
// FORJA como recreativa de los 90: siluetas rotundas, contraste altísimo,
// golpes con hit-stop y recompensas que gritan. Diversión física, no infantil.

import { PaletteProvider, Spr, remap } from "../engine";
import { PAL_C } from "./palette";
import { buildChar, type CharId, type StateId } from "./chars";
import {
  ANVIL_C,
  BELL_C,
  BELL_RING_C,
  BONFIRE_C,
  CHAPTER_NODES_C,
  COIN_C,
  DISC_BIG_C,
  DISC_MED_C,
  DISC_SMALL_C,
  DISC_TINY_C,
  FLAME_OFF_C,
  FLAME_ON_C,
  FORJATRON_C,
  HAMMER_C,
  SEAL_ADAPT_C,
  SEAL_DONE_C,
  SPARKSTAR_C,
  STARBURST_C
} from "./props";
import type { ArtDirection, SliceScreen } from "../types";
import { MotionLabC } from "./motion";
import { DataLabC } from "./data";
import { SliceC } from "./slice";
import "./c.css";

/** Parpadeo de la llama de combo sin apagarse (para la vitrina). */
const FLAME_FLICKER = [
  FLAME_ON_C,
  FLAME_ON_C,
  remap(FLAME_ON_C, { W: "Y", Y: "O" }),
  FLAME_ON_C
];

const STATES: { id: StateId; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "preparado", label: "Preparado" },
  { id: "golpeando", label: "Golpeando" },
  { id: "descansando", label: "Descansando" },
  { id: "celebrando", label: "Celebrando" },
  { id: "record", label: "Récord" },
  { id: "adaptacion", label: "Adaptación" }
];

function CharCell({ who, state }: { who: CharId; state: StateId }) {
  const { frames, fps } = buildChar(who, state);
  return (
    <figure className="devart-cell">
      <Spr frames={frames} fps={fps} scale={4} label={`${who}: ${state}`} />
      <figcaption>{state}</figcaption>
    </figure>
  );
}

// ── Art bible ──────────────────────────────────────────────────────────────

function BibleC() {
  return (
    <PaletteProvider palette={PAL_C}>
      <section className="c-bible">
        <h2 className="devart-h">C · Acero Arcade — art bible</h2>
        <div className="c-bible__grid">
          <article className="c-panel">
            <h3>Paleta</h3>
            <div className="c-swatches">
              {Object.entries(PAL_C)
                .filter(([ch]) => ch !== "x")
                .map(([ch, hex]) => (
                  <span key={ch} className="c-swatch" style={{ background: hex }} title={`${ch} ${hex}`} />
                ))}
            </div>
            <p>
              ~12 colores saturados sobre negro azulado. El magenta señal solo
              aparece en recompensas (récords, combos llenos): cuando sale, es
              que ha pasado algo grande. Luz superior simple, 2 tonos por
              material, sin dithering.
            </p>
          </article>
          <article className="c-panel">
            <h3>Regla de contorno</h3>
            <p>
              TODO sprite lleva contorno negro puro de 2px (doble píxel). La
              silueta debe leerse a un metro de la pantalla, como un mueble de
              recreativa. Interior plano: color + sombra, nada más.
            </p>
            <div className="c-row">
              <Spr frames={[HAMMER_C]} scale={4} label="Martillo" />
              <Spr frames={[ANVIL_C]} scale={4} label="Yunque" />
            </div>
          </article>
          <article className="c-panel">
            <h3>Tipografía</h3>
            <p className="c-shout">¡RÉCORD!</p>
            <p className="c-score">SCORE 000450</p>
            <p className="c-panel__body">
              Press Start 2P GRANDE para gritos y marcadores, inclinable −3°;
              contadores con ceros a la izquierda. Sans bold para el texto de
              apoyo: los datos reales siempre legibles.
            </p>
          </article>
          <article className="c-panel">
            <h3>Sprites</h3>
            <ul>
              <li>Personajes 32×32 nativos chunky: cabezón, hombros anchos.</li>
              <li>Mostrados a 4–6×, siempre en múltiplos enteros.</li>
              <li>Squash &amp; stretch de 1–2px en saltos y aterrizajes.</li>
              <li>Smear de 1 fotograma en el arco del martillo.</li>
              <li>1 fotograma de FLASH blanco total en cada impacto.</li>
            </ul>
          </article>
          <article className="c-panel">
            <h3>Movimiento</h3>
            <ul>
              <li>fps 10–15: todo enérgico, nada se arrastra.</li>
              <li>Hit-stop: 1 fotograma congelado antes del impacto.</li>
              <li>Sacudida de cámara fuerte (±3px) en pasos enteros.</li>
              <li>Prohibidos fades suaves y easing de plantilla: steps() y saltos enteros.</li>
            </ul>
          </article>
          <article className="c-panel">
            <h3>Fondo y marquesina</h3>
            <p>
              Negro azulado con rayas diagonales sutiles de acero y viñetas de
              marquesina con bombillas. Este mismo panel usa la superficie base
              de la dirección.
            </p>
            <div className="c-marquee">
              <span className="c-marquee__text">STAGE 2-1</span>
            </div>
          </article>
          <article className="c-panel">
            <h3>Reduced motion</h3>
            <p>
              Cada secuencia salta a su estado final: sello ya estampado, score
              ya sumado, campana quieta con el récord en pantalla. El FLASH
              blanco se sustituye por un borde amarillo estático.
            </p>
          </article>
        </div>
      </section>
    </PaletteProvider>
  );
}

// ── Sprites ────────────────────────────────────────────────────────────────

function SpritesC() {
  return (
    <PaletteProvider palette={PAL_C}>
      <section>
        <h2 className="devart-h">Nahuel — 32×32 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="nahuel" state={s.id} />
          ))}
        </div>
        <h2 className="devart-h">Carlos — 32×32 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="carlos" state={s.id} />
          ))}
        </div>
        <h2 className="devart-h">Atrezzo</h2>
        <div className="devart-grid">
          <figure className="devart-cell">
            <Spr frames={[HAMMER_C]} scale={4} label="Martillo enorme" />
            <figcaption>Martillo</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[ANVIL_C]} scale={4} label="Yunque compacto" />
            <figcaption>Yunque</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={SPARKSTAR_C} fps={12} scale={4} label="Chispa estrella" />
            <figcaption>Chispa 4 puntas</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={STARBURST_C} fps={10} scale={4} label="Starburst de récord" />
            <figcaption>Starburst récord</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={BONFIRE_C} fps={8} scale={4} label="Hoguera" />
            <figcaption>Hoguera chunky</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[FORJATRON_C]} scale={4} label="FORJA-TRON" />
            <figcaption>FORJA-TRON</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[BELL_C, BELL_C, BELL_RING_C]} fps={6} scale={4} label="Campana de feria" />
            <figcaption>Campana de feria</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[COIN_C]} scale={4} label="Moneda" />
            <figcaption>Moneda</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[SEAL_DONE_C]} scale={4} label="Sello completada" />
            <figcaption>COMPLETADA · medalla</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[SEAL_ADAPT_C]} scale={4} label="Sello adaptada" />
            <figcaption>ADAPTADA · escudo</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={FLAME_FLICKER} fps={8} scale={4} label="Llama de combo" />
            <figcaption>Llama combo ON</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[FLAME_OFF_C]} scale={4} label="Llama apagada" />
            <figcaption>Llama combo OFF</figcaption>
          </figure>
          <figure className="devart-cell">
            <div className="c-discstack">
              <Spr frames={[DISC_TINY_C]} scale={3} label="" />
              <Spr frames={[DISC_SMALL_C]} scale={3} label="" />
              <Spr frames={[DISC_MED_C]} scale={3} label="" />
              <Spr frames={[DISC_BIG_C]} scale={3} label="Discos apilados" />
            </div>
            <figcaption>Discos apilables</figcaption>
          </figure>
        </div>
        <h2 className="devart-h">World-map — 6 pantallas de nivel</h2>
        <div className="devart-grid">
          {CHAPTER_NODES_C.map((f, i) => (
            <figure key={i} className="devart-cell">
              <Spr frames={[f]} scale={4} label={`Nivel ${i + 1}`} />
              <figcaption>
                {i + 1} ·{" "}
                {["Fogón", "Pila de lingotes", "Martinete", "Lecho de brasas", "Horno dragón", "Corona del temple"][i]}
              </figcaption>
            </figure>
          ))}
        </div>
        <h2 className="devart-h">Fotogramas del golpe (smear + flash)</h2>
        <div className="devart-grid">
          {buildChar("nahuel", "golpeando").frames.map((f, i) => (
            <figure key={i} className="devart-cell">
              <Spr frames={[f]} scale={3} label={`golpe f${i + 1}`} />
              <figcaption>f{i + 1}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </PaletteProvider>
  );
}

export const DIRECTION_C: ArtDirection = {
  id: "c",
  nombre: "Acero Arcade",
  claim:
    "FORJA como recreativa de los 90: siluetas rotundas, hit-stop, y recompensas que gritan.",
  rootClass: "dir-c",
  Bible: BibleC,
  Sprites: SpritesC,
  MotionLab: MotionLabC,
  DataLab: DataLabC,
  Slice: (p: { screen: SliceScreen }) => <SliceC screen={p.screen} />
};
