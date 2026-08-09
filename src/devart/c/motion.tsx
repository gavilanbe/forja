// Dirección C — MOTION LAB. Siete escenas de recreativa.
// Regla dura: prohibidos los fades suaves y el easing de plantilla. Todo se
// mueve con steps() y saltos enteros: hit-stop de 1 fotograma, FLASH blanco
// de 1 fotograma, sacudidas de ±3px y contadores que saltan por pasos.
// Con reduced motion cada escena se pinta directamente en su estado final.

import { useState, type ReactNode } from "react";
import { PaletteProvider, Spr, runTimeline, times, type TimelineStep } from "../engine";
import { PAL_C } from "./palette";
import { buildChar } from "./chars";
import {
  ANVIL_C,
  BELL_C,
  BELL_RING_C,
  BONFIRE_C,
  CHAPTER_NODES_C,
  FLAME_OFF_C,
  FLAME_ON_C,
  SEAL_ADAPT_C,
  SEAL_DONE_C,
  SPARKSTAR_C,
  STARBURST_C
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
    <article className="c-scene">
      <header className="c-scene__head">
        <h3>{title}</h3>
        <button type="button" className="c-scene__play" onClick={onPlay} disabled={playing}>
          {playing ? "…" : final ? "Repetir" : "Reproducir"}
        </button>
      </header>
      <div className="c-scene__stage">{children}</div>
      <p className="c-scene__note">{note}</p>
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

const pad6 = (n: number) => String(n).padStart(6, "0");

// 1 · Guardar serie — martillazo con hit-stop, FLASH y score que salta ------

function SceneSave() {
  const { phase, playing, run } = usePhases();
  const strike = buildChar("nahuel", "golpeando");
  // Fases: 1 arranca el golpe · 2 hit-stop (fotograma congelado en el cénit)
  // · 3 impacto: FLASH + shake + score salta · 4 sello GUARDADA.
  const score = phase >= 3 ? 460 : 450;
  return (
    <Scene
      title="1 · Guardar serie"
      note="Hit-stop de 1 fotograma en el cénit, FLASH blanco de 1 fotograma en el impacto, sacudida de ±3px y el score salta +10 de golpe. Sello GUARDADA."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [230, 2], [340, 3], [900, 4]])}
    >
      <div className={`c-stage ${phase === 3 ? "c-stage--shake" : ""}`}>
        <div className="c-hud">
          <span className="c-hud__score">SCORE {pad6(score)}</span>
          {phase >= 3 && <span className="c-hud__delta">+10</span>}
        </div>
        <div className="c-stage__anvil">
          <Spr frames={[ANVIL_C]} scale={4} />
        </div>
        <div className="c-stage__char">
          {phase === 2 ? (
            <Spr frames={[strike.frames[2]]} scale={4} />
          ) : (
            <Spr
              frames={phase >= 1 && phase < 4 ? strike.frames : [strike.frames[0]]}
              fps={strike.fps}
              loop={false}
              playing={phase >= 1 && phase < 4}
              scale={4}
            />
          )}
        </div>
        {phase >= 3 && (
          <div className="c-stage__sparks">
            <Spr frames={SPARKSTAR_C} fps={14} loop={false} scale={4} />
          </div>
        )}
        {phase === 3 && <div className="c-flash" />}
        <div className="c-ticket">
          <b>45 kg × 8</b> RIR 2
        </div>
        {phase >= 4 && <div className="c-stamp">¡GUARDADA!</div>}
      </div>
    </Scene>
  );
}

// 2 · Iniciar descanso — semáforo 3-2-1 y cuenta LED -------------------------

function SceneRest() {
  const { phase, playing, run } = usePhases();
  const rest = buildChar("nahuel", "descansando");
  const led = phase >= 5 ? "2:59" : "3:00";
  return (
    <Scene
      title="2 · Iniciar descanso"
      note="Semáforo de recreativa 3-2-1 por pasos, el herrero se apoya en el martillo y la cuenta LED cae en saltos enteros."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [350, 2], [700, 3], [1050, 4], [1500, 5]])}
    >
      <div className="c-stage c-stage--rest">
        <div className="c-lights">
          {[3, 2, 1].map((n, i) => (
            <span
              key={n}
              className={`c-light ${phase >= i + 1 ? `c-light--on${i}` : ""}`}
            >
              {n}
            </span>
          ))}
        </div>
        <div className={`c-led ${phase >= 4 ? "c-led--on" : ""}`}>{phase >= 4 ? led : "-:--"}</div>
        <div className="c-stage__char c-stage__char--rest">
          <Spr frames={rest.frames} fps={rest.fps} playing={phase >= 4} scale={4} />
        </div>
        {phase >= 4 && <div className="c-ticket c-ticket--teal">DESCANSO · serie 3 de 4</div>}
      </div>
    </Scene>
  );
}

// 3 · Récord — campana de feria + starburst ----------------------------------

function SceneRecord() {
  const { phase, playing, run } = usePhases();
  const rec = buildChar("nahuel", "record");
  const kg = phase >= 3 ? "47,5" : phase === 2 ? "46,0" : phase === 1 ? "44,0" : "40,0";
  return (
    <Scene
      title="3 · Conseguir récord"
      note="El marcador sube por pasos como un fuerza-martillo de feria; al llegar arriba la campana hace DING, starburst magenta y ¡RÉCORD! inclinado."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [260, 2], [520, 3], [1050, 4]])}
    >
      <div className={`c-stage ${phase === 3 ? "c-stage--shake" : ""}`}>
        <div className="c-tower">
          <div className="c-tower__bell">
            <Spr frames={phase >= 3 ? [BELL_RING_C, BELL_C, BELL_RING_C] : [BELL_C]} fps={10} scale={3} />
          </div>
          <div className="c-tower__rail">
            {times(4, (i) => (
              <span key={i} className={`c-tower__step ${i < (phase >= 3 ? 4 : phase) ? "c-tower__step--lit" : ""}`} />
            ))}
          </div>
          <span className="c-tower__kg">{kg} kg</span>
        </div>
        <div className="c-stage__char">
          <Spr frames={rec.frames} fps={rec.fps} playing={phase >= 3} scale={4} />
        </div>
        {phase >= 3 && (
          <div className="c-stage__burst">
            <Spr frames={STARBURST_C} fps={12} loop={phase < 4} scale={4} />
          </div>
        )}
        {phase === 3 && <div className="c-flash" />}
        {phase >= 4 && <div className="c-shout c-shout--stamp">¡RÉCORD!</div>}
        {phase >= 4 && <div className="c-ticket c-ticket--magenta">Press inclinado · 47,5 kg</div>}
      </div>
    </Scene>
  );
}

// 4 · Adaptar misión — cambio de arma estilo power-up ------------------------

function SceneAdapt() {
  const { phase, playing, run } = usePhases();
  const adapt = buildChar("nahuel", "adaptacion");
  // Fases: 1 panel gira (canto) · 2 nueva cara · 3 escudo se acopla · 4 sello.
  const flip = phase === 1 ? "c-swap--edge" : phase >= 2 ? "c-swap--b" : "";
  return (
    <Scene
      title="4 · Adaptar misión"
      note="Cambio de arma: el panel gira en 2 pasos duros (nada de tween), el escudo teal se acopla con salto de escala y sello JUGADA INTELIGENTE."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [220, 2], [520, 3], [950, 4]])}
    >
      <div className="c-stage">
        <div className="c-stage__char c-stage__char--left">
          <Spr frames={adapt.frames} fps={adapt.fps} playing scale={4} />
        </div>
        <div className={`c-swap ${flip}`}>
          {phase < 2 ? (
            <>
              <span className="c-swap__k">ARMA ACTUAL</span>
              <b>Hack squat</b>
              <span className="c-swap__meta">4 × 8-10 · molestia rodilla</span>
            </>
          ) : (
            <>
              <span className="c-swap__k c-swap__k--teal">ARMA NUEVA</span>
              <b>Prensa inclinada</b>
              <span className="c-swap__meta">4 × 10-12 · sin dolor</span>
            </>
          )}
          {phase >= 3 && (
            <span className={`c-swap__seal ${phase === 3 ? "c-swap__seal--pop" : ""}`}>
              <Spr frames={[SEAL_ADAPT_C]} scale={3} />
            </span>
          )}
        </div>
        {phase >= 4 && <div className="c-stamp c-stamp--teal">JUGADA INTELIGENTE</div>}
      </div>
    </Scene>
  );
}

// 5 · Completar entrenamiento — pantalla RESULTS -----------------------------

function SceneComplete() {
  const { phase, playing, run } = usePhases();
  const cheer = buildChar("nahuel", "celebrando");
  const score = phase >= 5 ? 12480 : phase === 4 ? 9000 : phase === 3 ? 4500 : 0;
  return (
    <Scene
      title="5 · Completar entrenamiento"
      note="Pantalla RESULTS: el sello estrella cae con sacudida, rank FORJADO, y el score final cuenta en 3 saltos, nunca suave."
      playing={playing}
      final={phase >= 5}
      onPlay={() => run([[0, 1], [280, 2], [560, 3], [760, 4], [960, 5]])}
    >
      <div className={`c-stage c-stage--results ${phase === 2 ? "c-stage--shake" : ""}`}>
        <span className="c-results__title">RESULTS</span>
        <div className={`c-results__seal c-results__seal--p${Math.min(phase, 2)}`}>
          {phase >= 1 && <Spr frames={[SEAL_DONE_C]} scale={phase >= 2 ? 4 : 6} />}
        </div>
        {phase >= 2 && (
          <div className="c-stage__sparks c-stage__sparks--seal">
            <Spr frames={SPARKSTAR_C} fps={14} loop={false} scale={3} />
          </div>
        )}
        {phase >= 3 && (
          <div className="c-results__rank">
            RANK <b className="c-shout c-shout--inline">FORJADO</b>
          </div>
        )}
        {phase >= 3 && <div className="c-results__score">SCORE {pad6(score)}</div>}
        <div className="c-stage__char c-stage__char--right">
          <Spr frames={cheer.frames} fps={cheer.fps} playing={phase >= 5} scale={3} />
        </div>
      </div>
    </Scene>
  );
}

// 6 · Llama semanal — barra de COMBO x1…x5 -----------------------------------

function SceneFlame() {
  const { phase, playing, run } = usePhases();
  const combo = Math.min(phase, 5);
  return (
    <Scene
      title="6 · Encender la Llama semanal"
      note="Barra de COMBO: cada misión de la semana es un golpe que sube el multiplicador x1…x5. El quinto prende la llama gigante."
      playing={playing}
      final={phase >= 6}
      onPlay={() => run([[0, 1], [240, 2], [480, 3], [720, 4], [960, 5], [1300, 6]])}
    >
      <div className={`c-stage c-stage--flame ${phase >= 1 && phase <= 5 ? "c-stage--tap" : ""}`}>
        <div className="c-combo">
          {times(5, (i) => (
            <span key={i} className="c-combo__cell">
              <Spr frames={i < combo ? [FLAME_ON_C] : [FLAME_OFF_C]} scale={3} />
            </span>
          ))}
          <b className={`c-combo__x ${combo >= 5 ? "c-combo__x--max" : ""}`}>x{Math.max(combo, 1)}</b>
        </div>
        {phase >= 6 && (
          <div className="c-stage__bonfire">
            <Spr frames={BONFIRE_C} fps={9} scale={5} />
          </div>
        )}
        {phase === 6 && <div className="c-flash" />}
        {phase >= 6 && <div className="c-stamp c-stamp--magenta">¡SEMANA COMPLETA! COMBO x5</div>}
      </div>
    </Scene>
  );
}

// 7 · Desbloquear capítulo — cortina de marquesina ---------------------------

function SceneChapter() {
  const { phase, playing, run } = usePhases();
  return (
    <Scene
      title="7 · Desbloquear capítulo"
      note="La cortina de marquesina sube en 3 pasos duros y el nivel nuevo parpadea NEW! por steps, como un mueble recién enchufado."
      playing={playing}
      final={phase >= 4}
      onPlay={() => run([[0, 1], [300, 2], [600, 3], [900, 4]])}
    >
      <div className="c-stage c-stage--unlock">
        <div className="c-booth">
          <div className="c-booth__node">
            <Spr frames={[CHAPTER_NODES_C[4]]} scale={5} />
          </div>
          <div className={`c-booth__curtain c-booth__curtain--p${Math.min(phase, 3)}`} />
        </div>
        {phase >= 4 && <span className="c-new c-new--blink">NEW!</span>}
        {phase >= 4 && <div className="c-ticket">Nivel 5 · Horno boca-de-dragón</div>}
      </div>
    </Scene>
  );
}

export function MotionLabC() {
  return (
    <PaletteProvider palette={PAL_C}>
      <section className="c-motion">
        <h2 className="devart-h">Motion lab — 7 secuencias</h2>
        <p className="devart-note">
          Golpes con hit-stop, FLASH de 1 fotograma y marcadores que saltan por
          pasos. Con reduced motion cada escena aparece resuelta en su estado
          final.
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
