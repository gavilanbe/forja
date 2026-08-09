// Dirección B — CÓDICE TÁCTICO.
// La mesa de delineante de un ingeniero de fragua: fichas de pergamino,
// placas grabadas, instrumentos de latón calibrados y mapas plegables.
// Luz plana de flexo; el volumen se dibuja con rayado, nunca con glow.

import { PaletteProvider, Spr } from "../engine";
import { PAL_B } from "./palette";
import { buildChar, type CharId, type StateId } from "./chars";
import {
  ANVIL_FIG_B,
  BURNER_B,
  CALIPER_B,
  FOGON_OFF_B,
  FOGON_ON_B,
  HAMMER_B,
  INGOT_B,
  LAMP_DIM_B,
  LAMP_ON_B,
  PATCH_PLATE_B,
  PEN_B,
  SEAL_ADAPT_B,
  SEAL_DONE_B,
  STAMP_B,
  STATIONS_B,
  VALVE_PLUS_B,
  VALVE_X_B,
  WAX_POUR_B
} from "./props";
import type { ArtDirection, SliceScreen } from "../types";
import { MotionLabB } from "./motion";
import { DataLabB } from "./data";
import { SliceB } from "./slice";
import "./b.css";

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
    <figure className="devart-cell b-cell">
      <Spr frames={frames} fps={fps} scale={4} label={`${who}: ${state}`} />
      <figcaption>{state}</figcaption>
    </figure>
  );
}

function BibleB() {
  return (
    <PaletteProvider palette={PAL_B}>
      <section className="b-bible">
        <h2 className="b-h">Códice Táctico — art bible</h2>
        <div className="b-bible__grid">
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 1 · Paleta (14 tintas)</h3>
            <div className="b-swatches">
              {[
                ["b", "pizarra blueprint"],
                ["k", "tinta de hierro"],
                ["c", "línea delineante"],
                ["C", "cian tenue"],
                ["p", "pergamino"],
                ["P", "pergamino sombra"],
                ["a", "acero grabado"],
                ["A", "acero claro"],
                ["l", "latón"],
                ["L", "latón profundo"],
                ["v", "verdín"],
                ["r", "lacre"],
                ["R", "lacre claro"],
                ["w", "blanco papel"]
              ].map(([ch, nombre]) => (
                <span key={ch} className="b-swatch">
                  <i style={{ background: PAL_B[ch] }} />
                  <b>{PAL_B[ch]}</b> {nombre}
                </span>
              ))}
            </div>
          </article>
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 2 · Iluminación y volumen</h3>
            <p>
              Luz plana de flexo de mesa: documental, sin dramatismo. El volumen
              se dibuja con <b>rayado de líneas paralelas de 1px</b> (hatching),
              jamás con degradados, glow ni dithering de tablero. La tinta de
              hierro hace todos los contornos; el cian es exclusivamente línea
              de delineante: rejilla, cotas y anotaciones.
            </p>
            <div className="b-hatch-demo" aria-hidden="true" />
            <p className="b-sheet__foot">Fig. — rayado reglamentario a 45°.</p>
          </article>
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 3 · Yunque, fig. 1 (con cotas)</h3>
            <div className="b-slate">
              <Spr frames={[ANVIL_FIG_B]} scale={4} label="Yunque esquemático con cotas" />
            </div>
            <p className="b-sheet__foot">
              Los diagramas técnicos van SIEMPRE en cian sobre pizarra, con cota
              y referencia. Los objetos reales, en tinta + latón sobre pergamino.
            </p>
          </article>
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 4 · Tipografía</h3>
            <p className="b-type-stamp">SELLO</p>
            <p className="b-sheet__foot">Press Start 2P: solo sellos estampados y cabeceras cortas.</p>
            <p className="b-type-body">
              Cuerpo y datos en monoespaciada de sistema, 12–15px: lecturas de
              instrumento. 47,5 kg · RIR 2 · 08/31
            </p>
            <p className="b-type-label">Etiquetas uppercase con tracking</p>
          </article>
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 5 · Sprites</h3>
            <ul className="b-list">
              <li>Resolución nativa 32×32, mostrados a 3–4×.</li>
              <li>Contorno de 1px en tinta de hierro (#1d242e).</li>
              <li>Proporciones de retrato de manual técnico, postura de ficha.</li>
              <li>Piel en pergamino: los personajes son grabados del códice.</li>
            </ul>
          </article>
          <article className="b-sheet">
            <h3 className="b-sheet__title">Lám. 6 · Movimiento</h3>
            <ul className="b-list">
              <li>Timing mecánico de compás: 4–8 fps, clic-clac.</li>
              <li>Solo saltos discretos y steps(); prohibidos fades y easing.</li>
              <li>Estampados con squash de 1 fotograma.</li>
              <li>Agujas con rebasamiento de 2 pasos y retorno.</li>
              <li>Reduced motion: cada escena salta a su estado final.</li>
            </ul>
          </article>
        </div>
      </section>
    </PaletteProvider>
  );
}

function SpritesB() {
  return (
    <PaletteProvider palette={PAL_B}>
      <section className="b-sprites">
        <h2 className="b-h">Nahuel — 32×32 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="nahuel" state={s.id} />
          ))}
        </div>
        <h2 className="b-h">Carlos — 32×32 · 7 estados</h2>
        <div className="devart-grid">
          {STATES.map((s) => (
            <CharCell key={s.id} who="carlos" state={s.id} />
          ))}
        </div>
        <h2 className="b-h">Instrumentos del códice</h2>
        <div className="devart-grid">
          <figure className="devart-cell b-cell">
            <Spr frames={[HAMMER_B]} scale={4} label="Martillo de bola calibrado" />
            <figcaption>Martillo calibrado</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[CALIPER_B]} scale={4} label="Compás de puntas" />
            <figcaption>Compás de puntas</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[LAMP_ON_B, LAMP_ON_B, LAMP_DIM_B]} fps={2} scale={3} label="Lámpara de mesa" />
            <figcaption>Lámpara de mesa</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={BURNER_B} fps={4} scale={4} label="Hornillo de crisol" />
            <figcaption>Hornillo de crisol</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[VALVE_PLUS_B, VALVE_X_B]} fps={3} scale={4} label="Válvula" />
            <figcaption>Válvula (giro por pasos)</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[STAMP_B]} scale={4} label="Tampón" />
            <figcaption>Tampón de registro</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[PEN_B]} scale={4} label="Pluma" />
            <figcaption>Pluma de anotar</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={WAX_POUR_B} fps={3} scale={4} label="Lacre derramándose" />
            <figcaption>Lacre (3f)</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[SEAL_DONE_B]} scale={4} label="Sello completada" />
            <figcaption>Sello: COMPLETADA</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[SEAL_ADAPT_B]} scale={4} label="Sello adaptada" />
            <figcaption>Sello: ADAPTADA</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[INGOT_B]} scale={4} label="Lingote" />
            <figcaption>Lingote (inventario)</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[FOGON_OFF_B, FOGON_ON_B]} fps={2} scale={4} label="Fogón de ruta" />
            <figcaption>Fogón de ruta</figcaption>
          </figure>
          <figure className="devart-cell b-cell">
            <Spr frames={[PATCH_PLATE_B]} scale={3} label="Placa con parche remachado" />
            <figcaption>Placa remachada</figcaption>
          </figure>
        </div>
        <h2 className="b-h">Seis estaciones del mapa de ruta</h2>
        <div className="devart-grid">
          {STATIONS_B.map((st, i) => (
            <figure key={st.ref} className="devart-cell b-cell">
              <Spr frames={[st.frame]} scale={4} label={`Estación ${i + 1}: ${st.nombre}`} />
              <figcaption>
                {st.ref} · {st.nombre}
              </figcaption>
            </figure>
          ))}
        </div>
        <h2 className="b-h">Fotogramas del golpe (Nahuel)</h2>
        <div className="devart-grid">
          {buildChar("nahuel", "golpeando").frames.map((f, i) => (
            <figure key={i} className="devart-cell b-cell">
              <Spr frames={[f]} scale={3} label={`golpe f${i + 1}`} />
              <figcaption>f{i + 1}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </PaletteProvider>
  );
}

export const DIRECTION_B: ArtDirection = {
  id: "b",
  nombre: "Códice Táctico",
  claim:
    "Instrumentación de herrería: fichas de pergamino, placas grabadas y latón calibrado sobre papel blueprint.",
  rootClass: "dir-b",
  Bible: BibleB,
  Sprites: SpritesB,
  MotionLab: MotionLabB,
  DataLab: DataLabB,
  Slice: (p: { screen: SliceScreen }) => <SliceB screen={p.screen} />
};
