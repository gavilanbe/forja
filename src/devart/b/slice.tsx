// Dirección B — VERTICAL SLICE. Seis pantallas maquetadas a 390px como una
// app real de papel e instrumentos: dosier de misión, panel de instrumentos,
// diagrama de válvula, mapa plegable, doble página de libro mayor y acta de
// cierre. Nada de placa-héroe con CTA gigante: fichas, sellos y regletas.

import { PaletteProvider, Spr, times } from "../engine";
import { PAL_B } from "./palette";
import { buildChar } from "./chars";
import { needleDial, railGauge, railRuler, repsDrum, rirDial } from "./instruments";
import {
  FOGON_OFF_B,
  FOGON_ON_B,
  INGOT_B,
  LAMP_ON_B,
  PEN_B,
  SEAL_ADAPT_B,
  SEAL_DONE_B,
  STATIONS_B,
  VALVE_PLUS_B
} from "./props";
import type { SliceScreen } from "../types";

const RAIL_NUMS = ["40", "42,5", "45", "47,5", "50"];

// ── HOY · dosier de misión ─────────────────────────────────────────────────

function ScreenHoy() {
  const ready = buildChar("nahuel", "preparado");
  return (
    <div className="b-app">
      <header className="b-app__bar">
        <span className="b-app__codex">CÓDICE DE FORJA</span>
        <span className="b-app__ref">FICHA Nº 038 · 24/08</span>
      </header>
      <div className="b-dossier">
        <div className="b-dossier__tabs" aria-hidden="true">
          <span className="b-dossier__tab b-dossier__tab--on">HOY</span>
          <span className="b-dossier__tab">MAPA</span>
          <span className="b-dossier__tab">LIBRO</span>
        </div>
        <div className="b-dossier__sheet">
          <div className="b-dossier__head">
            <div className="b-portrait">
              <Spr frames={ready.frames} fps={ready.fps} scale={3} label="Nahuel preparado" />
            </div>
            <div className="b-dossier__id">
              <span className="b-label">Operario</span>
              <b>NAHUEL</b>
              <span className="b-dossier__meta">Nv. 3 · Portamartillos</span>
              <span className="b-dossier__meta">Cap. 2 · Acero templado</span>
            </div>
          </div>
          <table className="b-spec">
            <tbody>
              <tr>
                <th scope="row">Misión</th>
                <td><b>TORSO A</b></td>
              </tr>
              <tr>
                <th scope="row">Duración</th>
                <td>85–105 min</td>
              </tr>
              <tr>
                <th scope="row">Etapas</th>
                <td>7 ejercicios</td>
              </tr>
              <tr>
                <th scope="row">Series</th>
                <td>24 de trabajo</td>
              </tr>
              <tr>
                <th scope="row">Objetivo</th>
                <td>RIR 1–2 · progresar 40 → 42,5 kg</td>
              </tr>
            </tbody>
          </table>
          <button type="button" className="b-sealcta">
            <span className="b-sealcta__ring">INICIAR</span>
            <span className="b-sealcta__hint">estampar para comenzar</span>
          </button>
        </div>
      </div>
      <footer className="b-app__week">
        <span className="b-label">Semana 4</span>
        <span className="b-app__stops">
          {times(5, (i) => (
            <Spr key={i} frames={i < 2 ? [FOGON_ON_B] : [FOGON_OFF_B]} scale={2} />
          ))}
        </span>
        <span className="b-app__weekread">2/5 misiones</span>
      </footer>
    </div>
  );
}

// ── REGISTRO · panel de instrumentos ───────────────────────────────────────

function ScreenRegistro() {
  return (
    <div className="b-app">
      <header className="b-app__bar">
        <span className="b-app__codex">PRESS INCLINADO</span>
        <span className="b-app__ref">Etapa 1 · Serie 2/4 · ant. 40 kg × 9</span>
      </header>
      <div className="b-instrpanel">
        <div className="b-instrpanel__row">
          <span className="b-label">Carga</span>
          <div className="b-instrpanel__gauge">
            <Spr frames={[railGauge(45)]} scale={2} label="45 kg" />
            <div className="b-rail__nums" aria-hidden="true">
              {RAIL_NUMS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
          <span className="b-instrpanel__read"><b>45</b> kg</span>
        </div>
        <div className="b-instrpanel__row b-instrpanel__row--pair">
          <div className="b-instrpanel__cell">
            <span className="b-label">RIR</span>
            <Spr frames={[rirDial(2)]} scale={4} label="RIR 2" />
            <span className="b-instrpanel__read">R<b>2</b> · zona verdín</span>
          </div>
          <div className="b-instrpanel__cell">
            <span className="b-label">Reps</span>
            <Spr frames={[repsDrum(8)]} scale={4} label="8 repeticiones" />
            <span className="b-instrpanel__read"><b>8</b> repeticiones</span>
          </div>
        </div>
        <button type="button" className="b-stampcta">
          REGISTRAR
          <i className="b-stampcta__base" aria-hidden="true" />
        </button>
        <p className="b-instrpanel__foot">
          El tampón estampa la serie en la ficha nº 038.
        </p>
      </div>
    </div>
  );
}

// ── DESCANSO · válvula de vapor ────────────────────────────────────────────

function ScreenDescanso() {
  return (
    <div className="b-app b-app--rest">
      <header className="b-app__bar">
        <span className="b-app__codex">DESCANSO ENTRE SERIES</span>
        <span className="b-app__ref">Diagrama V-2 · válvula de vapor</span>
      </header>
      <div className="b-valvediagram">
        <div className="b-valvediagram__lamp">
          <Spr frames={[LAMP_ON_B]} scale={3} label="Lámpara de mesa" />
        </div>
        <div className="b-valvediagram__pipes" aria-hidden="true">
          <i className="b-pipe b-pipe--h" />
          <i className="b-pipe b-pipe--v" />
        </div>
        <div className="b-valvediagram__valve">
          <Spr frames={[VALVE_PLUS_B]} scale={4} label="Válvula cerrada" />
          <span className="b-gauge__label">válvula cerrada</span>
        </div>
        <div className="b-valvediagram__gauge">
          <Spr frames={[needleDial(0.34, "v")]} scale={6} label="Manómetro de descanso" />
          <b className="b-valvediagram__count">2:37</b>
          <span className="b-gauge__label">presión restante · objetivo 3:00</span>
        </div>
        <div className="b-valvediagram__next">
          Siguiente: <b>serie 3 de 4</b> · 6–10 reps · 45 kg
        </div>
        <div className="b-valvediagram__row">
          <button type="button" className="b-platebtn">+15 s</button>
          <button type="button" className="b-platebtn">Pausa</button>
          <button type="button" className="b-platebtn b-platebtn--wax">Saltar</button>
        </div>
      </div>
    </div>
  );
}

// ── CAMPAÑA · mapa plegable vertical ───────────────────────────────────────

function ScreenCampana() {
  const estados = ["forjada", "forjada", "actual", "plegada", "plegada", "plegada"] as const;
  return (
    <div className="b-app">
      <header className="b-app__bar">
        <span className="b-app__codex">MAPA DE RUTA</span>
        <span className="b-app__ref">Plegable M-1 · 6 estaciones</span>
      </header>
      <div className="b-foldmap">
        {STATIONS_B.map((st, i) => {
          const estado = estados[i];
          if (estado === "plegada") {
            return (
              <div key={st.ref} className="b-foldmap__folded">
                <span>{st.ref}</span>
                <i aria-hidden="true" />
                <span>plegado</span>
              </div>
            );
          }
          return (
            <div
              key={st.ref}
              className={`b-foldmap__panel ${estado === "actual" ? "b-foldmap__panel--now" : ""}`}
            >
              <div className="b-foldmap__art">
                <Spr frames={[st.frame]} scale={3} label={st.nombre} />
              </div>
              <div className="b-foldmap__info">
                <span className="b-label">{st.ref}</span>
                <b>{st.nombre}</b>
                {estado === "forjada" && (
                  <span className="b-foldmap__state">
                    forjada 5/5
                    <Spr frames={[SEAL_DONE_B]} scale={1} />
                  </span>
                )}
                {estado === "actual" && (
                  <span className="b-foldmap__state b-foldmap__state--now">en curso · 2/5</span>
                )}
              </div>
              {i < 5 && <i className="b-foldmap__route" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PROGRESO · doble página de libro mayor ─────────────────────────────────

function ScreenProgreso() {
  return (
    <div className="b-app">
      <header className="b-app__bar">
        <span className="b-app__codex">LIBRO MAYOR</span>
        <span className="b-app__ref">Semanas 1–6 · press inclinado</span>
      </header>
      <div className="b-ledgerbook">
        <div className="b-ledgerbook__foldout">
          <span className="b-label">Raíl de carga · 40 → 47,5 kg</span>
          <div className="b-ledgerbook__rail">
            <Spr frames={[railRuler()]} scale={2} label="Escala 40 a 50 kg" />
            <div className="b-rail__nums b-rail__nums--small" aria-hidden="true">
              {RAIL_NUMS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            {[
              { fecha: "10/08", kg: 40 },
              { fecha: "20/08", kg: 42.5 },
              { fecha: "31/08", kg: 47.5 }
            ].map((p) => (
              <div key={p.fecha} className="b-ledgerbook__railrow">
                <Spr frames={[railGauge(p.kg)]} scale={2} label={`${p.fecha}: ${p.kg} kg`} />
                <span>
                  {p.fecha} · <b>{String(p.kg).replace(".", ",")}</b> kg
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="b-ledgerbook__spread">
          <div className="b-ledgerbook__page">
            <span className="b-label">Inventario de series</span>
            {[98, 104, 96].map((s, i) => (
              <div key={i} className="b-ledgerbook__row">
                <span>S{i + 1}</span>
                <span className="b-ledgerbook__ingots">
                  {times(Math.round(s / 20), (j) => (
                    <Spr key={j} frames={[INGOT_B]} scale={2} />
                  ))}
                </span>
                <b>{s}</b>
              </div>
            ))}
          </div>
          <i className="b-ledgerbook__spine" aria-hidden="true" />
          <div className="b-ledgerbook__page">
            <span className="b-label">&nbsp;</span>
            {[108, 88, 42].map((s, i) => (
              <div key={i} className="b-ledgerbook__row">
                <span>S{i + 4}</span>
                <span className="b-ledgerbook__ingots">
                  {times(Math.round(s / 20), (j) => (
                    <Spr key={j} frames={[INGOT_B]} scale={2} />
                  ))}
                </span>
                <b>{s}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="b-ledgerbook__records">
          <span className="b-label">Sellos de récord</span>
          <div className="b-ledgerbook__sealrow">
            <Spr frames={[SEAL_DONE_B]} scale={2} label="Récord press inclinado" />
            <span>
              <b>47,5 kg</b> press inclinado · 31/08
            </span>
          </div>
          <div className="b-ledgerbook__sealrow">
            <Spr frames={[SEAL_ADAPT_B]} scale={2} label="Adaptación hack squat" />
            <span>
              hack squat adaptado · 18/08
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FINAL · acta de cierre ─────────────────────────────────────────────────

function ScreenFinal() {
  const cheer = buildChar("nahuel", "celebrando");
  return (
    <div className="b-app">
      <header className="b-app__bar">
        <span className="b-app__codex">ACTA DE FORJA</span>
        <span className="b-app__ref">Torso A · Cap. 2 · 24/08</span>
      </header>
      <div className="b-acta">
        <div className="b-acta__stamps">
          <div className="b-acta__seal b-acta__seal--main">
            <Spr frames={[SEAL_DONE_B]} scale={4} label="Sello de misión completada" />
          </div>
          <div className="b-acta__seal b-acta__seal--side">
            <Spr frames={[SEAL_ADAPT_B]} scale={2} label="Sello de adaptación" />
          </div>
          <span className="b-inkstamp b-inkstamp--tilt">MISIÓN COMPLETADA</span>
        </div>
        <table className="b-spec b-spec--acta">
          <tbody>
            <tr>
              <th scope="row">Series</th>
              <td><b>24</b> de trabajo</td>
            </tr>
            <tr>
              <th scope="row">Progresos</th>
              <td><b>3</b> cargas subidas</td>
            </tr>
            <tr>
              <th scope="row">RIR medio</th>
              <td><b>1,8</b> · zona verdín</td>
            </tr>
            <tr>
              <th scope="row">Duración</th>
              <td><b>92</b> min</td>
            </tr>
            <tr>
              <th scope="row">Experiencia</th>
              <td><b>+85</b> XP</td>
            </tr>
          </tbody>
        </table>
        <div className="b-acta__sign">
          <div className="b-acta__pen">
            <Spr frames={[PEN_B]} scale={3} label="Pluma" />
          </div>
          <span className="b-acta__scribble">Nahuel</span>
          <span className="b-acta__signline">firma del operario</span>
        </div>
        <div className="b-acta__cheer b-portrait">
          <Spr frames={cheer.frames} fps={cheer.fps} scale={3} label="Nahuel celebrando" />
        </div>
        <button type="button" className="b-platebtn b-platebtn--wide">
          VOLVER AL CÓDICE
        </button>
      </div>
    </div>
  );
}

export function SliceB({ screen }: { screen: SliceScreen }) {
  return (
    <PaletteProvider palette={PAL_B}>
      <div className="b-slice">
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
