// Dirección C — VERTICAL SLICE. Seis pantallas 390px maquetadas como una
// recreativa: marquesinas, HUD de combate, countdown LED, world-map de
// niveles, pantalla RANKING y pantalla RESULTS. Nada de placas sobrias:
// marcadores, bombillas y botones-moneda.

import { PaletteProvider, Spr, times } from "../engine";
import { PAL_C } from "./palette";
import { buildChar } from "./chars";
import {
  ANVIL_C,
  BELL_RING_C,
  CHAPTER_NODES_C,
  COIN_C,
  FLAME_OFF_C,
  FLAME_ON_C,
  SEAL_DONE_C,
  STARBURST_C
} from "./props";
import type { SliceScreen } from "../types";

// ── HOY: pantalla de selección de nivel ────────────────────────────────────

function ScreenHoy() {
  const ready = buildChar("nahuel", "preparado");
  return (
    <div className="c-app">
      <div className="c-marquee c-app__marquee">
        <span className="c-marquee__k">CAPÍTULO 2 · ACERO TEMPLADO</span>
        <span className="c-marquee__text">STAGE 2-1</span>
        <span className="c-marquee__sub">TORSO A</span>
      </div>
      <div className="c-app__hero">
        <span className="c-app__heroname">NAHUEL</span>
        <Spr frames={ready.frames} fps={ready.fps} scale={6} label="Nahuel preparado" />
      </div>
      <div className="c-board">
        <div className="c-board__cell">
          <b>07</b>
          <span>ejercicios</span>
        </div>
        <div className="c-board__cell">
          <b>24</b>
          <span>series</span>
        </div>
        <div className="c-board__cell">
          <b>95</b>
          <span>min aprox</span>
        </div>
      </div>
      <button type="button" className="c-coinbtn">
        <span className="c-coinbtn__coin">
          <Spr frames={[COIN_C]} scale={3} />
        </span>
        PRESS START
      </button>
      <footer className="c-app__combo">
        {times(5, (i) => (
          <Spr key={i} frames={i < 2 ? [FLAME_ON_C] : [FLAME_OFF_C]} scale={3} />
        ))}
        <span className="c-app__combotxt">
          COMBO <b>x2</b> esta semana
        </span>
      </footer>
    </div>
  );
}

// ── REGISTRO: HUD de combate ───────────────────────────────────────────────

function ScreenRegistro() {
  const strike = buildChar("nahuel", "golpeando");
  return (
    <div className="c-app">
      <header className="c-hudbar">
        <span className="c-hudbar__name">PRESS INCLINADO</span>
        <span className="c-hudbar__sub">EJERCICIO 1/7 · anterior 40 kg × 9</span>
      </header>
      <div className="c-serierow">
        <span className="c-serierow__k">SERIE</span>
        {times(4, (i) => (
          <span key={i} className={`c-seriepip ${i < 1 ? "c-seriepip--done" : i === 1 ? "c-seriepip--now" : ""}`}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className="c-bigcounters">
        <div className="c-counter">
          <span className="c-counter__k">PESO</span>
          <b className="c-counter__num">045,0</b>
          <span className="c-counter__u">kg</span>
          <div className="c-counter__btns">
            <button type="button">−2,5</button>
            <button type="button">+2,5</button>
          </div>
        </div>
        <div className="c-counter">
          <span className="c-counter__k">REPS</span>
          <b className="c-counter__num">08</b>
          <span className="c-counter__u">de 6–10</span>
          <div className="c-counter__btns">
            <button type="button">−1</button>
            <button type="button">+1</button>
          </div>
        </div>
      </div>
      <div className="c-rirheat">
        <span className="c-rirheat__k">RIR</span>
        <span className="c-rirheat__danger">DANGER ▶</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={`c-rirheat__opt c-rirheat__opt--${n} ${n === 2 ? "c-rirheat__opt--on" : ""}`}
          >
            {n === 4 ? "4+" : n}
          </button>
        ))}
      </div>
      <button type="button" className="c-coinbtn c-coinbtn--hit">¡GOLPEA!</button>
      <div className="c-app__floor">
        <div className="c-app__anvil">
          <Spr frames={[ANVIL_C]} scale={3} />
        </div>
        <Spr frames={strike.frames} fps={strike.fps} scale={4} label="Nahuel golpeando" />
      </div>
    </div>
  );
}

// ── DESCANSO: countdown LED gigante ────────────────────────────────────────

function ScreenDescanso() {
  const rest = buildChar("nahuel", "descansando");
  return (
    <div className="c-app c-app--rest">
      <span className="c-kicker">DESCANSO ENTRE SERIES</span>
      <div className="c-led c-led--giant">2:37</div>
      <span className="c-ready c-ready--blink">READY?</span>
      <div className="c-app__rester">
        <Spr frames={rest.frames} fps={rest.fps} scale={5} label="Nahuel descansando" />
      </div>
      <div className="c-ticket c-ticket--teal">
        Siguiente: <b>serie 3 de 4</b> · 6–10 reps · 45 kg
      </div>
      <div className="c-restrow">
        <button type="button" className="c-btn">+15 s</button>
        <button type="button" className="c-btn">Pausa</button>
        <button type="button" className="c-btn c-btn--hot">Saltar</button>
      </div>
    </div>
  );
}

// ── CAMPAÑA: world-map de 6 niveles ────────────────────────────────────────

const LEVEL_NAMES = [
  "Fogón",
  "Pila de lingotes",
  "Martinete",
  "Lecho de brasas",
  "Horno boca-de-dragón",
  "Corona del temple"
];

function ScreenCampana() {
  return (
    <div className="c-app c-app--map">
      <div className="c-marquee c-app__marquee">
        <span className="c-marquee__text">WORLD MAP</span>
        <span className="c-marquee__sub">LA CAMPAÑA DE NAHUEL</span>
      </div>
      <div className="c-map">
        {CHAPTER_NODES_C.map((f, i) => {
          const state = i < 1 ? "past" : i === 1 ? "current" : "locked";
          return (
            <div key={i} className={`c-map__lvl c-map__lvl--${state} c-map__lvl--${i % 2 ? "r" : "l"}`}>
              <div className="c-map__dots" aria-hidden="true" />
              <div className={`c-map__node ${state === "current" ? "c-map__node--bounce" : ""}`}>
                <Spr frames={[f]} scale={state === "current" ? 4 : 3} label={`Nivel ${i + 1}`} />
                {state === "past" && <span className="c-map__badge c-map__badge--done">OK</span>}
                {state === "locked" && <span className="c-map__badge">?</span>}
                {state === "current" && <span className="c-map__you">TÚ</span>}
              </div>
              <div className="c-map__label">
                <span className="c-kicker">STAGE {i + 1}</span>
                <b>{LEVEL_NAMES[i]}</b>
                {state === "current" && <i>2 de 5 misiones esta semana</i>}
                {state === "past" && <i>Forjado 5/5</i>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PROGRESO: pantalla RANKING ─────────────────────────────────────────────

function ScreenProgreso() {
  return (
    <div className="c-app">
      <div className="c-marquee c-app__marquee">
        <span className="c-marquee__text">RANKING</span>
        <span className="c-marquee__sub">PRESS INCLINADO · 6 SEMANAS</span>
      </div>
      <div className="c-rank__row">
        <span className="c-rank__from">40,0</span>
        <span className="c-rank__arrow">▶▶</span>
        <span className="c-rank__to">47,5 kg</span>
      </div>
      <div className="c-rank__discs">
        {[40, 42.5, 45, 47.5].map((kg, i) => (
          <div key={kg} className="c-rank__disc">
            <div className="c-discpile">
              {times(i + 2, (j) => (
                <span key={j} className={`c-discpile__d c-discpile__d--${j % 3}`} />
              ))}
            </div>
            <span>{String(kg).replace(".", ",")}</span>
          </div>
        ))}
      </div>
      <h3 className="c-h3">MURO DE MEDALLAS</h3>
      <div className="c-rank__medals">
        {[
          { kg: "90", ej: "Hack squat" },
          { kg: "55", ej: "Remo apoyado" },
          { kg: "47,5", ej: "Press inclinado" }
        ].map((r) => (
          <div key={r.ej} className="c-medal c-medal--slice">
            <span className="c-medal__burst" aria-hidden="true" />
            <Spr frames={[SEAL_DONE_C]} scale={3} label={`Récord ${r.ej}`} />
            <span className="c-medal__plate">
              <b>{r.kg} kg</b>
            </span>
            <span className="c-medal__ej">{r.ej}</span>
          </div>
        ))}
      </div>
      <div className="c-board">
        <div className="c-board__cell">
          <b>x2</b>
          <span>combo semana</span>
        </div>
        <div className="c-board__cell">
          <b>41</b>
          <span>series</span>
        </div>
        <div className="c-board__cell">
          <b>03</b>
          <span>récords</span>
        </div>
      </div>
    </div>
  );
}

// ── FINAL: pantalla RESULTS ────────────────────────────────────────────────

function ScreenFinal() {
  const cheer = buildChar("nahuel", "celebrando");
  return (
    <div className="c-app c-app--results">
      <span className="c-results__title c-results__title--big">RESULTS</span>
      <div className="c-final__seal">
        <div className="c-final__burst">
          <Spr frames={STARBURST_C} fps={10} scale={4} />
        </div>
        <Spr frames={[SEAL_DONE_C]} scale={5} label="Sello: misión completada" />
        <div className="c-final__bell">
          <Spr frames={[BELL_RING_C]} scale={3} />
        </div>
      </div>
      <div className="c-final__rank">
        RANK <b className="c-shout c-shout--inline">FORJADO</b>
      </div>
      <div className="c-final__lines">
        <div>
          <span>SERIES × 24</span>
          <b>+2400</b>
        </div>
        <div>
          <span>PROGRESOS × 3</span>
          <b>+3000</b>
        </div>
        <div>
          <span>RIR DISCIPLINA</span>
          <b>+1080</b>
        </div>
        <div>
          <span>RÉCORD PRESS 47,5 KG</span>
          <b className="c-final__mag">+6000</b>
        </div>
        <div className="c-final__total">
          <span>SCORE</span>
          <b>012480</b>
        </div>
      </div>
      <div className="c-final__cheer">
        <Spr frames={cheer.frames} fps={cheer.fps} scale={4} label="Nahuel celebrando" />
      </div>
      <span className="c-ready c-ready--blink">CONTINUE?</span>
      <button type="button" className="c-coinbtn">SEGUIR FORJANDO</button>
    </div>
  );
}

export function SliceC({ screen }: { screen: SliceScreen }) {
  return (
    <PaletteProvider palette={PAL_C}>
      <div className="c-slice">
        {screen === "hoy" && <ScreenHoy />}
        {screen === "registro" && <ScreenRegistro />}
        {screen === "descanso" && <ScreenDescanso />}
        {screen === "campana" && <ScreenCampana />}
        {screen === "progreso" && <ScreenProgreso />}
        {screen === "final" && <ScreenFinal />}
      </div>
    </PaletteProvider>
  );
}
