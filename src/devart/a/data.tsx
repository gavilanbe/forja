// Dirección A — DATA-VIZ LAB. Nada de gráficas corporativas con skin pixel:
// la carga sube por un raíl remachado, el volumen se apila en lingotes, la
// adherencia enciende hogares, el RIR es presión de caldera, los récords se
// estampan con chispa y las adaptaciones son placas remachadas.
// Los valores reales siempre acompañan en texto legible.

import { PaletteProvider, PxSprite, times, type Frame } from "../engine";
import { PAL_A } from "./palette";
import { HEARTH_OFF_A, INGOT_A, INGOT_HOT_A, PATCH_PLATE_A, SEAL_DONE_A } from "./props";

// ── Datos de muestra (deterministas, realistas) ────────────────────────────

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

// ── Lienzo procedimental ───────────────────────────────────────────────────

class Grid {
  cells: string[][];
  constructor(
    public w: number,
    public h: number
  ) {
    this.cells = times(h, () => times(w, () => "."));
  }
  set(x: number, y: number, ch: string) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.cells[Math.round(y)][Math.round(x)] = ch;
  }
  rect(x: number, y: number, w: number, h: number, ch: string) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
  }
  frame(): Frame {
    return this.cells.map((r) => r.join(""));
  }
}

// ── Raíl remachado: progresión de carga ────────────────────────────────────

const railChart = (points: { kg: number }[]): Frame => {
  const step = 14;
  const w = points.length * step + 10;
  const h = 48;
  const g = new Grid(w, h);
  const kgs = points.map((p) => p.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const yOf = (kg: number) =>
    Math.round(36 - ((kg - min) / Math.max(1, max - min)) * 26);

  // Suelo de brasas
  for (let x = 0; x < w; x++) g.set(x, 45, (x + 45) % 3 === 0 ? "e" : "E");

  points.forEach((p, i) => {
    const x = 7 + i * step;
    const y = yOf(p.kg);
    // Pilar de apoyo hasta el suelo
    for (let yy = y + 3; yy < 45; yy++) g.set(x, yy, "K");
    g.rect(x - 1, 43, 3, 2, "K");
    // Tramo de raíl escalonado hasta la siguiente estación
    if (i < points.length - 1) {
      const ny = yOf(points[i + 1].kg);
      let cy = y;
      for (let xx = x; xx <= x + step; xx++) {
        const t = (xx - x) / step;
        const target = Math.round(y + (ny - y) * t);
        while (cy > target) cy--;
        while (cy < target) cy++;
        g.set(xx, cy, "S");
        g.set(xx, cy + 1, "s");
        if ((xx - x) % 4 === 0) g.set(xx, cy + 2, "K"); // traviesa
      }
    }
    // Remache dorado de la estación
    g.rect(x - 1, y - 1, 3, 3, "Y");
    g.set(x, y, "w");
  });
  return g.frame();
};

// ── Caldera de RIR ─────────────────────────────────────────────────────────

const rirGauge = (rir: number): Frame => {
  const g = new Grid(16, 40);
  // Tubo
  g.rect(5, 2, 6, 36, "K");
  g.rect(6, 3, 4, 34, "I");
  // Zonas: 0 (rojo, fallo) abajo … 4 (frío) arriba. Cada RIR = 8px.
  const zones: [number, string][] = [
    [0, "r"],
    [1, "y"],
    [2, "d"],
    [3, "s"],
    [4, "S"]
  ];
  zones.forEach(([z, ch]) => {
    const y = 35 - z * 8;
    for (let yy = Math.max(3, y - 7); yy <= y; yy++) g.rect(7, yy, 2, 1, ch);
  });
  // Aguja del valor real
  const ny = 35 - rir * 8;
  g.rect(2, ny, 3, 1, "W");
  g.rect(11, ny, 3, 1, "W");
  g.rect(1, ny - 1, 1, 3, "H");
  return g.frame();
};

// ── Tally de repeticiones ──────────────────────────────────────────────────

const repsPlate = (reps: number): Frame => {
  const g = new Grid(30, 14);
  g.rect(0, 0, 30, 14, "I");
  g.rect(1, 1, 28, 12, "S");
  for (let i = 0; i < Math.min(reps, 12); i++) {
    const gx = 3 + (i % 6) * 4;
    const gy = i < 6 ? 3 : 8;
    g.rect(gx, gy, 2, 4, i === reps - 1 ? "w" : "H");
  }
  return g.frame();
};

// ── Componentes ────────────────────────────────────────────────────────────

const Px = ({ f, scale = 3, fps = 1, label }: { f: Frame | Frame[]; scale?: number; fps?: number; label: string }) => (
  <PxSprite frames={Array.isArray(f[0]) ? (f as Frame[]) : [f as Frame]} palette={PAL_A} scale={scale} fps={fps} label={label} />
);

export function DataLabA() {
  const maxKg = Math.max(...CARGA.map((p) => p.kg));
  const minKg = Math.min(...CARGA.map((p) => p.kg));
  return (
    <PaletteProvider palette={PAL_A}>
      <section className="a-data">
        <h2 className="devart-h">El raíl de la carga — press inclinado</h2>
        <p className="devart-note">
          Cada remache dorado es una sesión; el raíl sube con los kilos. Escala
          real: {minKg}–{maxKg} kg.
        </p>
        <div className="a-data__rail">
          <Px f={railChart(CARGA)} scale={3} label={`Progresión de carga: ${CARGA.map((p) => `${p.fecha} ${p.kg} kg`).join(", ")}`} />
          <div className="a-data__labels" aria-hidden="true">
            {CARGA.map((p) => (
              <span key={p.fecha}>
                <b>{p.kg}</b>
                <i>{p.fecha}</i>
              </span>
            ))}
          </div>
        </div>

        <h2 className="devart-h">Repeticiones y presión de RIR por sesión</h2>
        <p className="devart-note">
          Marcas cinceladas = repeticiones de la mejor serie. La caldera marca
          el RIR: rojo es fallo (0), verde temple es la zona útil (1–2).
        </p>
        <div className="a-data__sessions">
          {CARGA.map((p) => (
            <div key={p.fecha} className="a-data__session">
              <Px f={rirGauge(p.rir)} scale={2} label={`RIR ${p.rir}`} />
              <Px f={repsPlate(p.reps)} scale={2} label={`${p.reps} repeticiones`} />
              <span className="a-data__mini">
                {p.reps} reps · RIR {p.rir}
                <i>{p.fecha}</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Hogares de adherencia — 6 semanas</h2>
        <p className="devart-note">
          Un hogar por misión prevista: encendido si se cumplió. El objetivo de
          Nahuel es 5 por semana.
        </p>
        <div className="a-data__weeks">
          {ADHERENCIA.map((wk) => (
            <div key={wk.semana} className="a-data__week">
              <div className="a-data__hearths">
                {times(wk.objetivo, (i) => (
                  <Px
                    key={i}
                    f={i < wk.hechas ? [hearthLit(), hearthEmber()] : HEARTH_OFF_A}
                    fps={2 + (i % 2)}
                    scale={3}
                    label={i < wk.hechas ? "misión cumplida" : "misión pendiente"}
                  />
                ))}
              </div>
              <span className="a-data__mini">
                S{wk.semana} · {wk.hechas}/{wk.objetivo}
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Almacén de lingotes — volumen semanal</h2>
        <p className="devart-note">Un lingote por cada 10 series de trabajo; el último de cada pila aún está al rojo.</p>
        <div className="a-data__weeks a-data__weeks--bottom">
          {VOLUMEN.map((wk) => {
            const n = Math.max(1, Math.round(wk.series / 10));
            return (
              <div key={wk.semana} className="a-data__week">
                <div className="a-data__stack">
                  {times(n, (i) => (
                    <Px key={i} f={i === 0 ? INGOT_HOT_A : INGOT_A} scale={2} label="" />
                  ))}
                </div>
                <span className="a-data__mini">
                  S{wk.semana}
                  <i>{wk.series} series</i>
                </span>
              </div>
            );
          })}
        </div>

        <h2 className="devart-h">Viga de récords</h2>
        <div className="a-data__records">
          {RECORDS.map((r) => (
            <div key={r.ejercicio} className="a-data__record">
              <Px f={SEAL_DONE_A} scale={2} label={`Récord: ${r.ejercicio} ${r.kg} kg`} />
              <span className="a-data__mini">
                <b>{r.kg} kg</b> {r.ejercicio}
                <i>{r.fecha}</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Placas remachadas — molestias y adaptaciones</h2>
        <div className="a-data__records">
          {MOLESTIAS.map((m) => (
            <div key={m.fecha} className="a-data__record">
              <Px f={PATCH_PLATE_A} scale={3} label={`${m.ejercicio}: ${m.accion}`} />
              <span className="a-data__mini">
                <b>{m.ejercicio}</b> {m.nivel}/10 · {m.accion}
                <i>{m.fecha}</i>
              </span>
            </div>
          ))}
        </div>
      </section>
    </PaletteProvider>
  );
}

/** Hogar encendido con llama corta (variación del sprite base). */
const hearthLit = (): Frame => [
  "....O.....",
  "...OyO....",
  ".KKOWOKK..",
  ".KKeOeKK..",
  "..KKKKKK.."
];

/** Hogar en rescoldo (segundo fotograma del parpadeo). */
const hearthEmber = (): Frame => [
  "..........",
  "....O.....",
  ".KKyWyKK..",
  ".KKeOeKK..",
  "..KKKKKK.."
];
