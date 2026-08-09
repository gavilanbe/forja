// Dirección A — MOTION LAB. Siete secuencias interactivas.
// Regla: nada de fades ni easing continuo. Los elementos saltan entre
// posiciones enteras de píxel (jump cuts), los impactos sacuden la cámara
// dos pasos y las chispas mueren en el suelo. Con reduced motion cada
// escena se pinta directamente en su estado final.

import { useState, type ReactNode } from "react";
import { PaletteProvider, Spr, runTimeline, times, type TimelineStep } from "../engine";
import { PAL_A } from "./palette";
import { buildChar } from "./chars";
import {
  ANVIL_A,
  CAMPFIRE_A,
  CHAPTER_SCENES_A,
  HEARTH_OFF_A,
  HEARTH_ON_A,
  PATCH_PLATE_A,
  SEAL_ADAPT_A,
  SEAL_DONE_A,
  SPARKS_A
} from "./props";

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
    <article className="a-scene">
      <header className="a-scene__head">
        <h3>{title}</h3>
        <button type="button" className="a-scene__play" onClick={onPlay} disabled={playing}>
          {playing ? "…" : final ? "Repetir" : "Reproducir"}
        </button>
      </header>
      <div className="a-scene__stage">{children}</div>
      <p className="a-scene__note">{note}</p>
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

// 1 · Guardar una serie ------------------------------------------------------

function SceneSave() {
  const { phase, playing, run } = usePhases();
  const strike = buildChar("nahuel", "golpeando");
  return (
    <Scene
      title="1 · Guardar una serie"
      note="El martillo cae sobre el hierro: la serie queda grabada. Impacto con destello de 1 fotograma y sacudida de ±2px."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [400, 2], [640, 3], [1300, 4]])}
    >
      <div className={`a-stage ${phase === 3 ? "a-stage--shake" : ""}`}>
        <div className="a-stage__anvil">
          <Spr frames={[ANVIL_A]} scale={3} />
        </div>
        <div className="a-stage__char">
          <Spr
            frames={phase >= 1 && phase < 4 ? strike.frames : [strike.frames[0]]}
            fps={strike.fps}
            loop={false}
            playing={phase >= 1 && phase < 4}
            scale={3}
          />
        </div>
        {phase >= 3 && (
          <div className="a-stage__sparks">
            <Spr frames={SPARKS_A} fps={12} loop={false} scale={3} />
          </div>
        )}
        <div className={`a-plate a-stage__plate a-stage__plate--p${Math.min(phase, 4)}`}>
          <b>45 kg × 8</b> RIR 2
        </div>
        {phase >= 4 && <div className="a-stamp">GRABADA EN EL HIERRO</div>}
      </div>
    </Scene>
  );
}

// 2 · Iniciar descanso -------------------------------------------------------

function SceneRest() {
  const { phase, playing, run } = usePhases();
  const rest = buildChar("nahuel", "descansando");
  return (
    <Scene
      title="2 · Iniciar descanso"
      note="La fragua baja a rescoldo y la cuenta cae en pasos enteros. El herrero respira."
      playing={playing}
      final={phase >= 3}
      onPlay={() => run([[0, 1], [350, 2], [700, 3]])}
    >
      <div className={`a-stage a-stage--rest a-stage--rest-p${phase}`}>
        <div className="a-stage__fire">
          <Spr frames={phase >= 2 ? CAMPFIRE_A : [CAMPFIRE_A[0]]} fps={5} scale={3} />
        </div>
        <div className="a-stage__char a-stage__char--rest">
          <Spr frames={rest.frames} fps={rest.fps} playing={phase >= 2} scale={3} />
        </div>
        <div className={`a-plate a-counter a-counter--p${phase}`}>
          <b>{phase >= 3 ? "2:59" : "3:00"}</b> descanso
        </div>
      </div>
    </Scene>
  );
}

// 3 · Conseguir récord -------------------------------------------------------

function SceneRecord() {
  const { phase, playing, run } = usePhases();
  const rec = buildChar("nahuel", "record");
  return (
    <Scene
      title="3 · Conseguir récord"
      note="El sello cae en tres tamaños (grande→real), chispa doble y puño al cielo."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [300, 2], [460, 3], [620, 4]])}
    >
      <div className={`a-stage ${phase === 3 ? "a-stage--shake" : ""}`}>
        <div className="a-stage__char a-stage__char--center">
          <Spr frames={rec.frames} fps={rec.fps} playing={phase >= 1} scale={3} />
        </div>
        {phase >= 2 && (
          <div className={`a-seal a-seal--p${Math.min(phase, 4)}`}>
            <Spr frames={[SEAL_DONE_A]} scale={phase >= 4 ? 3 : phase === 3 ? 4 : 6} />
          </div>
        )}
        {phase >= 3 && (
          <div className="a-stage__sparks a-stage__sparks--high">
            <Spr frames={SPARKS_A} fps={12} loop={false} scale={3} />
          </div>
        )}
        {phase >= 4 && <div className="a-stamp a-stamp--gold">RÉCORD · 47,5 KG</div>}
      </div>
    </Scene>
  );
}

// 4 · Adaptar una misión -----------------------------------------------------

function SceneAdapt() {
  const { phase, playing, run } = usePhases();
  const adapt = buildChar("nahuel", "adaptacion");
  return (
    <Scene
      title="4 · Adaptar una misión"
      note="La placa dañada no se tira: se remacha un parche, remache a remache. Adaptar es reparar, no perder."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [350, 2], [520, 3], [690, 4], [900, 5]])}
    >
      <div className={`a-stage ${phase === 2 || phase === 3 || phase === 4 ? "a-stage--tap" : ""}`}>
        <div className="a-stage__char">
          <Spr frames={adapt.frames} fps={adapt.fps} playing scale={3} />
        </div>
        <div className="a-patch">
          <Spr frames={[PATCH_PLATE_A]} scale={4} />
          {times(4, (i) => (
            <span key={i} className={`a-rivet a-rivet--${i} ${phase >= i + 1 ? "a-rivet--set" : ""}`} />
          ))}
        </div>
        {phase >= 5 && (
          <div className="a-seal a-seal--side">
            <Spr frames={[SEAL_ADAPT_A]} scale={2} />
          </div>
        )}
        {phase >= 5 && <div className="a-stamp a-stamp--teal">ADAPTADA CON CABEZA</div>}
      </div>
    </Scene>
  );
}

// 5 · Completar entrenamiento ------------------------------------------------

function SceneComplete() {
  const { phase, playing, run } = usePhases();
  const cheer = buildChar("nahuel", "celebrando");
  return (
    <Scene
      title="5 · Completar entrenamiento"
      note="La prensa de sellos baja en tres pasos y estampa la misión. Después, celebración."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [260, 2], [420, 3], [700, 4]])}
    >
      <div className={`a-stage ${phase === 3 ? "a-stage--shake" : ""}`}>
        <div className={`a-press a-press--p${Math.min(phase, 3)}`} />
        <div className="a-banner">
          <span>TORSO A</span>
          {phase >= 3 && (
            <span className="a-banner__seal">
              <Spr frames={[SEAL_DONE_A]} scale={2} />
            </span>
          )}
        </div>
        {phase >= 3 && (
          <div className="a-stage__sparks">
            <Spr frames={SPARKS_A} fps={12} loop={false} scale={2} />
          </div>
        )}
        <div className="a-stage__char a-stage__char--right">
          <Spr frames={cheer.frames} fps={cheer.fps} playing={phase >= 4} scale={3} />
        </div>
        {phase >= 4 && <div className="a-stamp">MISIÓN COMPLETADA · +60 XP</div>}
      </div>
    </Scene>
  );
}

// 6 · Encender la Llama semanal ---------------------------------------------

function SceneFlame() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="6 · Encender la Llama semanal"
      note="Cinco hogares, uno por misión. El quinto prende la Llama de la semana: al rojo."
      playing={playing}
      final={phase >= 6}
      onPlay={() => run([[0, 1], [220, 2], [440, 3], [660, 4], [880, 5], [1150, 6]])}
    >
      <div className={`a-stage a-stage--flame ${phase === 6 ? "a-stage--glow" : ""}`}>
        <div className="a-hearths">
          {times(5, (i) => (
            <Spr
              key={i}
              frames={phase >= i + 1 ? [HEARTH_ON_A, HEARTH_OFF_A, HEARTH_ON_A, HEARTH_ON_A] : [HEARTH_OFF_A]}
              fps={5}
              scale={4}
            />
          ))}
        </div>
        {phase >= 6 && (
          <div className="a-stage__fire a-stage__fire--center">
            <Spr frames={CAMPFIRE_A} fps={6} scale={3} />
          </div>
        )}
        {phase >= 6 && <div className="a-stamp a-stamp--gold">SEMANA FORJADA · LLAMA AL ROJO</div>}
      </div>
    </Scene>
  );
}

// 7 · Desbloquear capítulo ---------------------------------------------------

function SceneChapter() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="7 · Desbloquear capítulo"
      note="Las compuertas de hierro se abren en cuatro pasos y la luz del capítulo nuevo inunda la sala."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [250, 2], [450, 3], [650, 4], [900, 5]])}
    >
      <div className={`a-stage a-stage--gates ${phase >= 4 ? "a-stage--glow" : ""}`}>
        <div className="a-gate-room">
          <Spr frames={[CHAPTER_SCENES_A[4]]} scale={4} />
        </div>
        <div className={`a-gate a-gate--left a-gate--p${Math.min(phase, 4)}`} />
        <div className={`a-gate a-gate--right a-gate--p${Math.min(phase, 4)}`} />
        {phase >= 5 && <div className="a-stamp a-stamp--gold">CAPÍTULO 5 · FORJA PROFUNDA</div>}
      </div>
    </Scene>
  );
}

export function MotionLabA() {
  return (
    <PaletteProvider palette={PAL_A}>
      <section className="a-motion">
        <h2 className="devart-h">Motion lab — 7 secuencias</h2>
        <p className="devart-note">
          Todo se mueve a saltos de píxel entero, con anticipación e impacto.
          Con reduced motion cada escena aparece ya resuelta en su estado final.
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
