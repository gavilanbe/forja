// Dirección A — VERTICAL SLICE. Seis pantallas maquetadas a 390px con el
// lenguaje monumental: escena de fragua a sangre, personaje protagonista,
// placas de hierro como superficie de UI y un solo CTA rotundo.

import { PaletteProvider, Spr, times } from "../engine";
import { PAL_A } from "./palette";
import { buildChar } from "./chars";
import {
  ANVIL_A,
  CAMPFIRE_A,
  CHAPTER_SCENES_A,
  FURNACE_A,
  HEARTH_OFF_A,
  HEARTH_ON_A,
  INGOT_A,
  INGOT_HOT_A,
  SEAL_DONE_A,
  SPARKS_A
} from "./props";
import type { SliceScreen } from "../types";

function ScreenHoy() {
  const ready = buildChar("nahuel", "preparado");
  return (
    <div className="a-app">
      <div className="a-app__sky">
        <Spr frames={FURNACE_A} fps={2} scale={4} />
      </div>
      <header className="a-app__id">
        <span className="a-app__name">NAHUEL</span>
        <span className="a-app__lv">Nv. 3 · Portamartillos</span>
      </header>
      <div className="a-app__scene">
        <div className="a-app__anvil">
          <Spr frames={[ANVIL_A]} scale={3} />
        </div>
        <div className="a-app__hero">
          <Spr frames={ready.frames} fps={ready.fps} scale={4} label="Nahuel preparado" />
        </div>
        <div className="a-app__plate a-app__plate--mission">
          <span className="a-kicker">Capítulo 2 · Acero templado</span>
          <b className="a-app__mission">TORSO A</b>
          <span className="a-app__meta">85–105 min · 7 etapas · 24 series</span>
        </div>
      </div>
      <button type="button" className="a-cta">
        EMPEZAR MISIÓN
      </button>
      <footer className="a-app__week">
        {times(5, (i) => (
          <Spr key={i} frames={i < 2 ? [HEARTH_ON_A] : [HEARTH_OFF_A]} scale={3} />
        ))}
        <span>2 de 5 · rescoldo</span>
      </footer>
    </div>
  );
}

function ScreenRegistro() {
  const strike = buildChar("nahuel", "golpeando");
  return (
    <div className="a-app">
      <header className="a-app__bar">
        <span>Press inclinado en máquina</span>
        <span className="a-app__sub">Etapa 1 · Serie 2 de 4 · anterior 40 kg × 9</span>
      </header>
      <div className="a-app__bigplate">
        <div className="a-app__field">
          <span className="a-kicker">Peso</span>
          <b className="a-num">45</b>
          <span className="a-unit">kg</span>
        </div>
        <div className="a-app__field">
          <span className="a-kicker">Reps</span>
          <b className="a-num">8</b>
        </div>
        <div className="a-app__field a-app__field--rir">
          <span className="a-kicker">RIR</span>
          <div className="a-rir">
            {[0, 1, 2, 3, 4].map((n) => (
              <span key={n} className={`a-rir__opt${n === 2 ? " a-rir__opt--on" : ""}`}>
                {n === 4 ? "4+" : n}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="a-cta">
        GOLPEAR Y GUARDAR
      </button>
      <div className="a-app__floor">
        <div className="a-app__anvil a-app__anvil--small">
          <Spr frames={[ANVIL_A]} scale={2} />
        </div>
        <Spr frames={strike.frames} fps={strike.fps} scale={3} label="Nahuel golpeando" />
      </div>
    </div>
  );
}

function ScreenDescanso() {
  const rest = buildChar("nahuel", "descansando");
  return (
    <div className="a-app a-app--night">
      <span className="a-kicker a-kicker--center">Campamento breve</span>
      <div className="a-app__count">2:37</div>
      <div className="a-app__campfire">
        <Spr frames={CAMPFIRE_A} fps={5} scale={4} label="Hoguera" />
        <div className="a-app__rester">
          <Spr frames={rest.frames} fps={rest.fps} scale={3} label="Nahuel descansando" />
        </div>
      </div>
      <div className="a-app__plate">
        Siguiente: <b>serie 3 de 4</b> · 6–10 reps
      </div>
      <div className="a-app__restrow">
        <button type="button" className="a-btn">+15 s</button>
        <button type="button" className="a-btn">Pausa</button>
        <button type="button" className="a-btn a-btn--hot">Saltar</button>
      </div>
    </div>
  );
}

function ScreenCampana() {
  return (
    <div className="a-app a-app--shaft">
      <span className="a-kicker a-kicker--center">La campaña · pozo de la forja</span>
      <div className="a-shaft">
        {CHAPTER_SCENES_A.map((f, i) => {
          const state = i < 1 ? "past" : i === 1 ? "current" : "locked";
          return (
            <div key={i} className={`a-shaft__lvl a-shaft__lvl--${state}`}>
              <div className="a-shaft__rail" />
              <div className="a-shaft__cage">
                <Spr frames={[f]} scale={state === "current" ? 4 : 3} label={`Capítulo ${i + 1}`} />
              </div>
              <div className="a-shaft__label">
                <span className="a-kicker">Cap. {i + 1}</span>
                <b>
                  {["El primer fuego", "Acero templado", "El martillo cae", "Brasas vivas", "Forja profunda", "La prueba del temple"][i]}
                </b>
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

function ScreenProgreso() {
  return (
    <div className="a-app">
      <span className="a-kicker a-kicker--center">Progreso · el raíl de la carga</span>
      <div className="a-app__railbox">
        <div className="a-app__railart">
          {/* El raíl real vive en el Data-viz lab; aquí, la versión hero */}
          <Spr frames={[ANVIL_A]} scale={2} />
          <div className="a-app__ingots">
            {times(4, (i) => (
              <Spr key={i} frames={i === 0 ? [INGOT_HOT_A] : [INGOT_A]} scale={3} />
            ))}
          </div>
        </div>
        <div className="a-app__plate">
          <b>Press inclinado</b> 40 → 47,5 kg en 6 semanas
        </div>
        <div className="a-app__plate">
          Esta semana: <b>2 de 5 misiones</b> · 41 series
        </div>
        <div className="a-app__week">
          {times(5, (i) => (
            <Spr key={i} frames={i < 2 ? [HEARTH_ON_A] : [HEARTH_OFF_A]} scale={3} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenFinal() {
  const cheer = buildChar("nahuel", "celebrando");
  return (
    <div className="a-app">
      <div className="a-app__sealrow">
        <Spr frames={[SEAL_DONE_A]} scale={4} label="Sello de misión completada" />
        <div className="a-stage__sparks a-stage__sparks--inline">
          <Spr frames={SPARKS_A} fps={10} scale={2} />
        </div>
      </div>
      <b className="a-app__mission a-app__mission--center">MISIÓN COMPLETADA</b>
      <span className="a-kicker a-kicker--center">Torso A · capítulo 2</span>
      <div className="a-app__statplates">
        <div className="a-app__stat">
          <b>24</b>
          <span>series</span>
        </div>
        <div className="a-app__stat">
          <b>3</b>
          <span>progresos</span>
        </div>
        <div className="a-app__stat">
          <b>1,8</b>
          <span>RIR medio</span>
        </div>
        <div className="a-app__stat">
          <b>+85</b>
          <span>XP</span>
        </div>
      </div>
      <div className="a-app__cheer">
        <Spr frames={cheer.frames} fps={cheer.fps} scale={4} label="Nahuel celebrando" />
      </div>
      <button type="button" className="a-cta">
        VOLVER A LA FORJA
      </button>
    </div>
  );
}

export function SliceA({ screen }: { screen: SliceScreen }) {
  return (
    <PaletteProvider palette={PAL_A}>
      <div className="a-slice">
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
