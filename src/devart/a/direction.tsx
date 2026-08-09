// Dirección A — FORJA MONUMENTAL.
// Fantasía industrial cinematográfica: personajes grandes, luz de fragua,
// profundidad y peso. Nada flota; todo golpea, humea o se apoya.

import { PaletteProvider, Spr, times } from "../engine";
import { PAL_A } from "./palette";
import { buildChar, type CharId, type StateId } from "./chars";
import {
  ANVIL_A,
  CAMPFIRE_A,
  CHAPTER_SCENES_A,
  FURNACE_A,
  HEARTH_OFF_A,
  HEARTH_ON_A,
  INGOT_A,
  INGOT_HOT_A,
  PATCH_PLATE_A,
  SEAL_ADAPT_A,
  SEAL_DONE_A,
  SPARKS_A
} from "./props";
import type { ArtDirection, SliceScreen } from "../types";
import { MotionLabA } from "./motion";
import { DataLabA } from "./data";
import { SliceA } from "./slice";
import "./a.css";

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
      <Spr frames={frames} fps={fps} scale={3} label={`${who}: ${state}`} />
      <figcaption>{state}</figcaption>
    </figure>
  );
}

function BibleA() {
  return (
    <PaletteProvider palette={PAL_A}>
      <section className="a-bible">
        <h2 className="devart-h">A · Forja Monumental — art bible</h2>
        <div className="a-bible__grid">
          <article className="a-plate">
            <h3>Paleta e iluminación</h3>
            <div className="a-swatches">
              {Object.entries(PAL_A).map(([ch, hex]) => (
                <span key={ch} className="a-swatch" style={{ background: hex }} title={`${ch} ${hex}`} />
              ))}
            </div>
            <p>
              La fragua es la única luz clave: baja y a la izquierda. Todo sprite
              lleva subrayado cálido (brasa) en su borde inferior-izquierdo y un
              rim frío acero en el superior-derecho. El negro puro (#05060a)
              solo dibuja la silueta exterior.
            </p>
          </article>
          <article className="a-plate">
            <h3>Materiales y fondos</h3>
            <p>
              Hierro forjado, acero pulido, cuero y madera quemada. Fondos con
              tres planos: resplandor del horno (lejos), maquinaria (medio),
              suelo con brasas (cerca). Sin degradados suaves: la profundidad se
              hace con planos de color y dithering 2×2 solo en halos de luz.
            </p>
            <Spr frames={FURNACE_A} fps={2} scale={3} label="Horno de la fragua" />
          </article>
          <article className="a-plate">
            <h3>Tipografía</h3>
            <p className="a-type-display">FORJA</p>
            <p className="a-type-h">Press Start 2P ≥16px, solo títulos monumentales</p>
            <p className="a-type-body">
              Sans del sistema 15–17px para todo dato, ayuda y control. Números
              tabulares grandes (28–40px) grabados sobre placas.
            </p>
          </article>
          <article className="a-plate">
            <h3>Sprites</h3>
            <ul>
              <li>Resolución nativa de personaje: 48×48, mostrados a 3×–4×.</li>
              <li>Contorno: 1px de silueta exterior; interior sin contornos.</li>
              <li>Dithering: patrón 2×2 únicamente en halos y humo.</li>
              <li>Escala: el personaje ocupa ~40% de la altura del hero.</li>
            </ul>
          </article>
          <article className="a-plate">
            <h3>Movimiento</h3>
            <ul>
              <li>Idle 4 fotogramas a 3 fps (respiración con peso).</li>
              <li>Golpe 8 fotogramas a 10 fps: anticipación, cénit, impacto con destello de 1 fotograma y sacudida de cámara de ±2px en 2 pasos.</li>
              <li>Chispas 6 fotogramas a 12 fps; mueren en el suelo, nunca flotan.</li>
              <li>Todo cambio de posición es por pasos enteros de píxel; prohibido el easing continuo.</li>
            </ul>
          </article>
          <article className="a-plate">
            <h3>Reduced motion</h3>
            <p>
              Cada secuencia salta directamente a su fotograma final: sello ya
              estampado, chispas apagadas, llama en su estado. Los destellos se
              sustituyen por un resalte estático dorado.
            </p>
          </article>
        </div>
      </section>
    </PaletteProvider>
  );
}

function SpritesA() {
  return (
    <PaletteProvider palette={PAL_A}>
      <section>
        <h2 className="devart-h">Nahuel — 48×48 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="nahuel" state={s.id} />
          ))}
        </div>
        <h2 className="devart-h">Carlos — 48×48 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="carlos" state={s.id} />
          ))}
        </div>
        <h2 className="devart-h">Atrezzo</h2>
        <div className="devart-grid">
          <figure className="devart-cell">
            <Spr frames={[ANVIL_A]} scale={3} label="Yunque" />
            <figcaption>Yunque monumental</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={SPARKS_A} fps={12} scale={3} label="Chispas" />
            <figcaption>Chispas (6f · 12fps)</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={CAMPFIRE_A} fps={5} scale={3} label="Hoguera" />
            <figcaption>Hoguera (4f)</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={FURNACE_A} fps={2} scale={2} label="Horno" />
            <figcaption>Maquinaria: horno</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[SEAL_DONE_A]} scale={3} label="Sello completada" />
            <figcaption>Sello: completada</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[SEAL_ADAPT_A]} scale={3} label="Sello adaptada" />
            <figcaption>Sello: adaptada</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[INGOT_A]} scale={4} label="Lingote" />
            <figcaption>Lingote</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[INGOT_HOT_A]} scale={4} label="Lingote al rojo" />
            <figcaption>Lingote al rojo</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[HEARTH_OFF_A, HEARTH_ON_A]} fps={2} scale={4} label="Hogar" />
            <figcaption>Hogar semanal</figcaption>
          </figure>
          <figure className="devart-cell">
            <Spr frames={[PATCH_PLATE_A]} scale={4} label="Placa remachada" />
            <figcaption>Placa remachada</figcaption>
          </figure>
        </div>
        <h2 className="devart-h">Seis capítulos — la forja evoluciona</h2>
        <div className="devart-grid">
          {CHAPTER_SCENES_A.map((f, i) => (
            <figure key={i} className="devart-cell">
              <Spr frames={[f]} scale={3} label={`Capítulo ${i + 1}`} />
              <figcaption>Cap. {i + 1}</figcaption>
            </figure>
          ))}
        </div>
        <h2 className="devart-h">Fotogramas del golpe</h2>
        <div className="devart-grid">
          {buildChar("nahuel", "golpeando").frames.map((f, i) => (
            <figure key={i} className="devart-cell">
              <Spr frames={[f]} scale={2} label={`golpe f${i + 1}`} />
              <figcaption>f{i + 1}</figcaption>
            </figure>
          ))}
        </div>
        {times(0, () => null)}
      </section>
    </PaletteProvider>
  );
}

export const DIRECTION_A: ArtDirection = {
  id: "a",
  nombre: "Forja Monumental",
  claim:
    "Fantasía industrial cinematográfica: personajes grandes, luz de fragua y peso físico en cada golpe.",
  rootClass: "dir-a",
  Bible: BibleA,
  Sprites: SpritesA,
  MotionLab: MotionLabA,
  DataLab: DataLabA,
  Slice: (p: { screen: SliceScreen }) => <SliceA screen={p.screen} />
};
