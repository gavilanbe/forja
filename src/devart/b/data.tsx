// Dirección B — DATA-VIZ LAB. Nada de gráficas corporativas con skin pixel:
// cada dato se lee en un instrumento de la mesa del delineante.
//   carga      → raíl calibrado de latón con cursor (una regleta por sesión)
//   RIR        → dial semicircular de presión con aguja y zonas
//   reps       → contador de tambor mecánico (dígitos en ventanitas)
//   adherencia → mapa de ruta semanal con fogones encendidos
//   volumen    → libro mayor de lingotes (inventario)
//   récords    → sellos de lacre sobre las líneas del libro
//   molestias  → placas con parche remachado y anotación
// Valores deterministas y SIEMPRE legibles en texto monoespaciado.

import { PaletteProvider, PxSprite, times, type Frame } from "../engine";
import { PAL_B } from "./palette";
import {
  FOGON_OFF_B,
  FOGON_ON_B,
  INGOT_B,
  PATCH_PLATE_B,
  SEAL_ADAPT_B,
  SEAL_DONE_B
} from "./props";

// ── Datos de muestra (los mismos que la dirección A, para comparar) ────────

const CARGA = [
  { fecha: "10/08", kg: 40, reps: 8, rir: 2 },
  { fecha: "13/08", kg: 40, reps: 9, rir: 2 },
  { fecha: "17/08", kg: 42.5, reps: 8, rir: 2 },
  { fecha: "20/08", kg: 42.5, reps: 10, rir: 1 },
  { fecha: "24/08", kg: 45, reps: 8, rir: 2 },
  { fecha: "27/08", kg: 45, reps: 9, rir: 1 },
  { fecha: "31/08", kg: 47.5, reps: 8, rir: 1 }
];

const ADHERENCIA = [
  { semana: 1, hechas: 5, objetivo: 5 },
  { semana: 2, hechas: 5, objetivo: 5 },
  { semana: 3, hechas: 4, objetivo: 5 },
  { semana: 4, hechas: 5, objetivo: 5 },
  { semana: 5, hechas: 3, objetivo: 5 },
  { semana: 6, hechas: 2, objetivo: 5 }
];

const VOLUMEN = [
  { semana: 1, series: 98 },
  { semana: 2, series: 104 },
  { semana: 3, series: 96 },
  { semana: 4, series: 108 },
  { semana: 5, series: 88 },
  { semana: 6, series: 42 }
];

const MOLESTIAS = [
  { fecha: "18/08", ejercicio: "Hack squat", nivel: 3, accion: "Adaptó la carga" },
  { fecha: "24/08", ejercicio: "Press de hombro", nivel: 2, accion: "Continuó con cuidado" }
];

const RECORDS = [
  { fecha: "25/08", ejercicio: "Hack squat", kg: 90 },
  { fecha: "27/08", ejercicio: "Remo con pecho apoyado", kg: 55 },
  { fecha: "31/08", ejercicio: "Press inclinado", kg: 47.5 }
];

// ── Instrumentos procedimentales compartidos ───────────────────────────────

import { railGauge, railRuler, repsDrum, rirDial } from "./instruments";

// ── Componentes ────────────────────────────────────────────────────────────

const Px = ({
  f,
  scale = 3,
  fps = 1,
  label
}: {
  f: Frame | Frame[];
  scale?: number;
  fps?: number;
  label: string;
}) => (
  <PxSprite
    frames={Array.isArray(f[0]) ? (f as Frame[]) : [f as Frame]}
    palette={PAL_B}
    scale={scale}
    fps={fps}
    label={label}
  />
);

export function DataLabB() {
  return (
    <PaletteProvider palette={PAL_B}>
      <section className="b-data">
        <h2 className="b-h">Lám. D-1 · Raíl calibrado — carga del press inclinado</h2>
        <p className="b-note">
          Una regleta de latón por sesión; el cursor de acero marca los kilos
          sobre la escala grabada 40–50 kg. Lectura al margen, como en un
          instrumento.
        </p>
        <div className="b-panel">
          <div className="b-rail__head">
            <span className="b-rail__date b-label">Escala</span>
            <div className="b-rail__gauge">
              <Px f={railRuler()} scale={2} label="Escala 40 a 50 kg" />
              <div className="b-rail__nums" aria-hidden="true">
                <span>40</span>
                <span>42,5</span>
                <span>45</span>
                <span>47,5</span>
                <span>50</span>
              </div>
            </div>
            <span className="b-rail__read b-label">kg · reps · RIR</span>
          </div>
          {CARGA.map((p) => (
            <div key={p.fecha} className="b-rail__row">
              <span className="b-rail__date">{p.fecha}</span>
              <div className="b-rail__gauge">
                <Px f={railGauge(p.kg)} scale={2} label={`${p.fecha}: ${p.kg} kg`} />
              </div>
              <span className="b-rail__read">
                <b>{String(p.kg).replace(".", ",")}</b> · {p.reps} · R{p.rir}
              </span>
            </div>
          ))}
          <p className="b-panel__foot">
            Progresión total: 40 → 47,5 kg en 7 sesiones (10/08–31/08). +7,5 kg.
          </p>
        </div>

        <h2 className="b-h">Lám. D-2 · Dial de presión (RIR) y tambor de reps</h2>
        <p className="b-note">
          El dial marca el esfuerzo restante: rojo = 0 (fallo), latón = 1,
          verdín = 2 (zona de trabajo), acero = 3–4. El tambor mecánico cuenta
          las repeticiones de la mejor serie.
        </p>
        <div className="b-instruments">
          {CARGA.map((p) => (
            <div key={p.fecha} className="b-instrument">
              <Px f={rirDial(p.rir)} scale={3} label={`RIR ${p.rir}`} />
              <Px f={repsDrum(p.reps)} scale={3} label={`${p.reps} repeticiones`} />
              <span className="b-instrument__read">
                {p.fecha}
                <i>RIR {p.rir} · {p.reps} reps</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="b-h">Lám. D-3 · Mapa de ruta semanal — adherencia</h2>
        <p className="b-note">
          Cinco fogones por semana, uno por misión prevista: encendido si se
          cumplió. Objetivo: 5 de 5.
        </p>
        <div className="b-panel">
          {ADHERENCIA.map((wk) => (
            <div key={wk.semana} className="b-route__row">
              <span className="b-route__week">S{wk.semana}</span>
              <div className="b-route__path">
                {times(wk.objetivo, (i) => (
                  <span key={i} className="b-route__stop">
                    <Px
                      f={i < wk.hechas ? FOGON_ON_B : FOGON_OFF_B}
                      scale={3}
                      label={i < wk.hechas ? "misión cumplida" : "misión pendiente"}
                    />
                  </span>
                ))}
              </div>
              <span className="b-route__read">
                <b>{wk.hechas}/{wk.objetivo}</b> misiones
              </span>
            </div>
          ))}
        </div>

        <h2 className="b-h">Lám. D-4 · Libro mayor de lingotes — volumen semanal</h2>
        <p className="b-note">
          Inventario de trabajo: un lingote por cada 10 series efectivas. La
          cifra exacta, en la columna de la derecha.
        </p>
        <div className="b-panel b-ledger">
          {VOLUMEN.map((wk) => (
            <div key={wk.semana} className="b-ledger__row">
              <span className="b-ledger__week">S{wk.semana}</span>
              <div className="b-ledger__ingots">
                {times(Math.max(1, Math.round(wk.series / 10)), (i) => (
                  <Px key={i} f={INGOT_B} scale={2} label="" />
                ))}
              </div>
              <span className="b-ledger__read">
                <b>{wk.series}</b> series
              </span>
            </div>
          ))}
          <p className="b-panel__foot">Semana 6 en descarga programada: 42 series.</p>
        </div>

        <h2 className="b-h">Lám. D-5 · Sellos de récord sobre el libro</h2>
        <div className="b-panel">
          {RECORDS.map((r) => (
            <div key={r.ejercicio} className="b-record__row">
              <Px f={SEAL_DONE_B} scale={2} label={`Récord: ${r.ejercicio} ${r.kg} kg`} />
              <span className="b-record__text">
                <b>{String(r.kg).replace(".", ",")} kg</b> — {r.ejercicio}
              </span>
              <span className="b-record__date">{r.fecha}</span>
            </div>
          ))}
        </div>

        <h2 className="b-h">Lám. D-6 · Placas remachadas — molestias y adaptaciones</h2>
        <div className="b-panel">
          {MOLESTIAS.map((m) => (
            <div key={m.fecha} className="b-record__row">
              <Px f={PATCH_PLATE_B} scale={2} label={`${m.ejercicio}: ${m.accion}`} />
              <span className="b-record__text">
                <b>{m.ejercicio}</b> — molestia {m.nivel}/10 · {m.accion}
              </span>
              <span className="b-record__date">{m.fecha}</span>
            </div>
          ))}
          <div className="b-record__row">
            <Px f={SEAL_ADAPT_B} scale={2} label="Sello de adaptación" />
            <span className="b-record__text">
              Toda adaptación queda sellada en verdín: reparar no es perder.
            </span>
            <span className="b-record__date">—</span>
          </div>
        </div>
      </section>
    </PaletteProvider>
  );
}
