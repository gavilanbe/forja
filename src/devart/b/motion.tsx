// Dirección B — MOTION LAB. Siete secuencias de instrumento.
// Regla del códice: prohibidos los fades y el easing suave. Todo salta entre
// posiciones discretas (clic-clac de compás); los estampados llevan squash de
// 1 fotograma y las agujas rebasan 2 pasos antes de asentarse. Con reduced
// motion cada escena se pinta directamente en su estado final.

import { useState, type ReactNode } from "react";
import { PaletteProvider, Spr, runTimeline, times, type TimelineStep } from "../engine";
import { PAL_B } from "./palette";
import { needleDial } from "./instruments";
import {
  FOGON_OFF_B,
  FOGON_ON_B,
  LAMP_DIM_B,
  LAMP_ON_B,
  PEN_B,
  SEAL_ADAPT_B,
  SEAL_DONE_B,
  STAMP_B,
  STAMP_DOWN_B,
  STATIONS_B,
  VALVE_PLUS_B,
  VALVE_X_B,
  WAX_POUR_B
} from "./props";

// ── Andamiaje de escena ────────────────────────────────────────────────────

function Scene({
  title,
  note,
  onPlay,
  playing,
  children,
  final
}: {
  title: string;
  note: string;
  onPlay: () => void;
  playing: boolean;
  children: ReactNode;
  final?: boolean;
}) {
  return (
    <article className="b-scene">
      <header className="b-scene__head">
        <h3>{title}</h3>
        <button type="button" className="b-scene__play" onClick={onPlay} disabled={playing}>
          {playing ? "…" : final ? "Repetir" : "Reproducir"}
        </button>
      </header>
      <div className="b-scene__stage">{children}</div>
      <p className="b-scene__note">{note}</p>
    </article>
  );
}

const usePhases = () => {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const run = (steps: [number, number][]) => {
    setPlaying(true);
    setPhase(0);
    const timeline: TimelineStep[] = steps.map(([at, p]) => ({ at, do: () => setPhase(p) }));
    runTimeline(timeline, () => setPlaying(false));
  };
  return { phase, playing, run };
};

// 1 · Guardar una serie -------------------------------------------------------

function SceneSave() {
  const { phase, playing, run } = usePhases();
  // Aguja del contador: reposo → salto con rebasamiento (2 pasos) → asiento
  const frac = phase >= 4 ? 0.62 : phase === 3 ? 0.74 : phase >= 2 ? 0.68 : 0.35;
  return (
    <Scene
      title="1 · Guardar una serie"
      note="El tampón baja en dos pasos y estampa el registro en la ficha; la aguja del contador salta con rebasamiento de 2 pasos."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [260, 2], [560, 3], [760, 4]])}
    >
      <div className={`b-stage b-stage--save ${phase === 2 ? "b-stage--knock" : ""}`}>
        <div className={`b-save__stamp b-save__stamp--p${Math.min(phase, 3)}`}>
          <Spr frames={phase === 2 ? [STAMP_DOWN_B] : [STAMP_B]} scale={3} />
        </div>
        <div className="b-card b-save__card">
          <span className="b-card__tab">FICHA · SERIE 2/4</span>
          <span className="b-card__line">Press inclinado en máquina</span>
          <span className="b-card__data">45 kg × 8 · RIR 2</span>
          {phase >= 2 && <span className="b-inkstamp">REGISTRADA</span>}
        </div>
        <div className="b-save__counter">
          <Spr frames={[needleDial(frac)]} scale={3} />
          <span className="b-gauge__label">series · {phase >= 2 ? "18" : "17"}</span>
        </div>
      </div>
    </Scene>
  );
}

// 2 · Iniciar descanso --------------------------------------------------------

function SceneRest() {
  const { phase, playing, run } = usePhases();
  // Manómetro de tiempo: cae a la zona verdín en dos saltos
  const frac = phase >= 3 ? 0.16 : phase === 2 ? 0.45 : 0.86;
  return (
    <Scene
      title="2 · Iniciar descanso"
      note="La válvula gira por pasos, el manómetro cae a su zona de temple y la lámpara de mesa se atenúa. Sin fundidos: dos saltos."
      playing={playing}
      final={phase >= 3}
      onPlay={() => run([[0, 1], [350, 2], [700, 3]])}
    >
      <div className={`b-stage b-stage--rest ${phase >= 3 ? "b-stage--dim" : ""}`}>
        <div className="b-rest__lamp">
          <Spr frames={phase >= 3 ? [LAMP_DIM_B] : [LAMP_ON_B]} scale={3} />
        </div>
        <div className="b-rest__valve">
          <Spr
            frames={phase >= 1 && phase < 3 ? [VALVE_PLUS_B, VALVE_X_B] : phase >= 3 ? [VALVE_X_B] : [VALVE_PLUS_B]}
            fps={4}
            scale={3}
          />
          <span className="b-gauge__label">válvula de vapor</span>
        </div>
        <div className="b-rest__gauge">
          <Spr frames={[needleDial(frac, "v")]} scale={4} />
          <span className="b-rest__count">{phase >= 3 ? "3:00" : "0:00"}</span>
          <span className="b-gauge__label">presión de descanso</span>
        </div>
      </div>
    </Scene>
  );
}

// 3 · Conseguir récord --------------------------------------------------------

function SceneRecord() {
  const { phase, playing, run } = usePhases();
  const kg = "47,5 kg";
  const visible = phase >= 5 ? kg : phase === 4 ? kg.slice(0, 4) : phase === 3 ? kg.slice(0, 2) : "";
  return (
    <Scene
      title="3 · Conseguir récord"
      note="El lacre se derrama en tres fotogramas, el sello cae con squash y la pluma anota los kilos por pasos."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [520, 2], [780, 3], [980, 4], [1180, 5]])}
    >
      <div className={`b-stage b-stage--record ${phase === 2 ? "b-stage--knock" : ""}`}>
        <div className="b-card b-record__card">
          <span className="b-card__tab">LIBRO DE MARCAS</span>
          <span className="b-card__line">Press inclinado — mejor marca</span>
          <span className="b-card__data b-record__kg">{visible || "······"}</span>
          {phase >= 4 && <div className="b-record__pen"><Spr frames={[PEN_B]} scale={3} /></div>}
        </div>
        <div className="b-record__wax">
          {phase === 0 && <Spr frames={[WAX_POUR_B[0]]} scale={3} />}
          {phase === 1 && <Spr frames={WAX_POUR_B} fps={5} loop={false} scale={3} />}
          {phase >= 2 && (
            <div className={`b-record__seal ${phase === 2 ? "b-record__seal--big" : ""}`}>
              <Spr frames={[SEAL_DONE_B]} scale={phase === 2 ? 4 : 3} />
            </div>
          )}
        </div>
        {phase >= 5 && <div className="b-inkstamp b-inkstamp--free">RÉCORD SELLADO</div>}
      </div>
    </Scene>
  );
}

// 4 · Adaptar una misión ------------------------------------------------------

function SceneAdapt() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="4 · Adaptar una misión"
      note="Del índice lateral se despliega la placa alternativa, se remacha en cuatro golpes y recibe el sello verdín."
      playing={playing}
      final={phase >= 6}
      onPlay={() => run([[0, 1], [280, 2], [460, 3], [640, 4], [820, 5], [1080, 6]])}
    >
      <div className={`b-stage b-stage--adapt ${phase >= 2 && phase <= 5 ? "b-stage--tap" : ""}`}>
        <div className="b-adapt__index">
          <span className="b-label">Índice</span>
          <span className="b-adapt__tab">HACK SQUAT</span>
          <span className="b-adapt__tab b-adapt__tab--alt">PRENSA 45°</span>
          <span className="b-adapt__tab">EXT. RODILLA</span>
        </div>
        <div className={`b-adapt__plate b-adapt__plate--p${Math.min(phase, 2)}`}>
          <span className="b-card__tab">PLACA ALTERNATIVA</span>
          <span className="b-card__line">Prensa 45° — molestia de rodilla</span>
          <span className="b-card__data">3 × 8–10 · misma zona</span>
          <span className="b-adapt__rivets" aria-hidden="true">
            {times(4, (i) => (
              <i key={i} className={phase >= i + 2 ? "b-rivet b-rivet--set" : "b-rivet"} />
            ))}
          </span>
          {phase >= 6 && (
            <div className="b-adapt__seal">
              <Spr frames={[SEAL_ADAPT_B]} scale={3} />
            </div>
          )}
        </div>
        {phase >= 6 && <div className="b-inkstamp b-inkstamp--verdigris">ADAPTADA</div>}
      </div>
    </Scene>
  );
}

// 5 · Completar entrenamiento -------------------------------------------------

function SceneComplete() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="5 · Completar entrenamiento"
      note="La ficha se desliza al archivo en saltos enteros, caen dos sellos y la línea de cierre se traza por pasos."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [300, 2], [560, 3], [820, 4], [1080, 5]])}
    >
      <div className={`b-stage b-stage--complete ${phase === 3 || phase === 4 ? "b-stage--knock" : ""}`}>
        <div className={`b-card b-complete__card b-complete__card--p${Math.min(phase, 2)}`}>
          <span className="b-card__tab">TORSO A · CAP. 2</span>
          <span className="b-card__line">24 series · 3 progresos · RIR medio 1,8</span>
          <div className="b-complete__seals">
            {phase >= 3 && <Spr frames={[SEAL_DONE_B]} scale={3} />}
            {phase >= 4 && <Spr frames={[SEAL_ADAPT_B]} scale={2} />}
          </div>
          <span
            className="b-complete__rule"
            style={{ width: phase >= 5 ? "100%" : phase === 4 ? "66%" : phase === 3 ? "33%" : "0%" }}
          />
        </div>
        <div className="b-complete__archive">
          <span className="b-label">Archivo</span>
          <div className="b-complete__slot" />
          <div className="b-complete__slot" />
        </div>
        {phase >= 5 && <div className="b-inkstamp b-inkstamp--free">ARCHIVADA · +85 XP</div>}
      </div>
    </Scene>
  );
}

// 6 · Llama semanal -----------------------------------------------------------

function SceneFlame() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="6 · Llama semanal"
      note="En el mapa de ruta, los cinco fogones de la semana prenden por pasos y el trazado se marca en tinta de lacre."
      playing={playing}
      final={phase >= 6}
      onPlay={() => run([[0, 1], [240, 2], [480, 3], [720, 4], [960, 5], [1240, 6]])}
    >
      <div className="b-stage b-stage--flame">
        <div className="b-flame__route">
          {times(5, (i) => (
            <span key={i} className="b-flame__leg">
              <Spr frames={phase >= i + 1 ? [FOGON_ON_B] : [FOGON_OFF_B]} scale={3} />
              {i < 4 && (
                <i className={`b-flame__dash ${phase >= i + 2 ? "b-flame__dash--ink" : ""}`} />
              )}
            </span>
          ))}
        </div>
        <span className="b-flame__read">
          {Math.min(Math.max(phase, 0), 5)}/5 misiones · semana 4
        </span>
        {phase >= 6 && <div className="b-inkstamp">SEMANA FORJADA</div>}
      </div>
    </Scene>
  );
}

// 7 · Desbloquear capítulo ----------------------------------------------------

function SceneChapter() {
  const { phase, playing, run } = usePhases();
  const done = STATIONS_B.slice(0, 2);
  const next = STATIONS_B[2];
  return (
    <Scene
      title="7 · Desbloquear capítulo"
      note="El mapa plegable se despliega un panel más en dos pasos discretos y revela la estación siguiente."
      playing={playing}
      final={phase >= 3}
      onPlay={() => run([[0, 1], [350, 2], [700, 3]])}
    >
      <div className="b-stage b-stage--chapter">
        <div className="b-map">
          {done.map((st) => (
            <div key={st.ref} className="b-map__panel">
              <Spr frames={[st.frame]} scale={3} label={st.nombre} />
              <span className="b-map__ref">{st.ref} · forjada</span>
            </div>
          ))}
          <div className={`b-map__panel b-map__panel--fold b-map__panel--p${Math.min(phase, 2)}`}>
            <Spr frames={[next.frame]} scale={3} label={next.nombre} />
            <span className="b-map__ref">{next.ref} · nueva</span>
          </div>
        </div>
        {phase >= 3 && (
          <div className="b-inkstamp b-inkstamp--free">CAP. 3 · {next.nombre.toUpperCase()}</div>
        )}
      </div>
    </Scene>
  );
}

export function MotionLabB() {
  return (
    <PaletteProvider palette={PAL_B}>
      <section className="b-motion">
        <h2 className="b-h">Motion lab — 7 secuencias de instrumento</h2>
        <p className="b-note">
          Timing mecánico de compás: pasos discretos, squash de 1 fotograma en
          los estampados y agujas con rebasamiento. Con reduced motion cada
          escena aparece resuelta en su estado final.
        </p>
        <SceneSave />
        <SceneRest />
        <SceneRecord />
        <SceneAdapt />
        <SceneComplete />
        <SceneFlame />
        <SceneChapter />
      </section>
    </PaletteProvider>
  );
}
