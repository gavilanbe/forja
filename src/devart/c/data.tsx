// Dirección C — DATA-VIZ LAB. Prohibidas las gráficas corporativas con skin
// pixel. Metáforas físicas de recreativa: la carga es un RACK DE DISCOS, el
// RIR un MEDIDOR DE CALOR con zona DANGER, las reps una fila de golpes de
// combo, la adherencia LLAMAS DE COMBO x5, el volumen una TORRE DE DISCOS,
// los récords un MURO DE MEDALLAS y las molestias un panel con sello FIX.
// Los valores, fechas y unidades siempre en texto legible.

import { PaletteProvider, PxSprite, times, type Frame } from "../engine";
import { PAL_C } from "./palette";
import { FLAME_OFF_C, FLAME_ON_C, SEAL_DONE_C } from "./props";

// ── Datos de muestra (los mismos que A, para comparar direcciones) ─────────

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
  /** Rectángulo con contorno negro de 2px reducido a 1px por lado en mini. */
  box(x: number, y: number, w: number, h: number, fill: string, shade?: string) {
    this.rect(x, y, w, h, "k");
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
    if (shade && h > 3) this.rect(x + 1, y + h - 2, w - 2, 1, shade);
  }
  frame(): Frame {
    return this.cells.map((r) => r.join(""));
  }
}

// ── RACK DE DISCOS: una barra por sesión, discos según los kg ──────────────
// Descomposición por lado: discos de 20 (naranja), 10 (amarillo), 5 (acero),
// 2,5 (teal). Más kg = más hierro colgado.

const platesFor = (kg: number): number[] => {
  // Barra de 20 kg; el resto se reparte por lado.
  let side = (kg - 20) / 2;
  const out: number[] = [];
  for (const p of [10, 5, 2.5, 1.25]) {
    while (side >= p - 0.001) {
      out.push(p);
      side -= p;
    }
  }
  return out;
};

const PLATE_STYLE: Record<number, { w: number; h: number; fill: string; shade: string }> = {
  10: { w: 6, h: 22, fill: "O", shade: "o" },
  5: { w: 5, h: 16, fill: "Y", shade: "y" },
  2.5: { w: 4, h: 10, fill: "T", shade: "t" },
  1.25: { w: 3, h: 6, fill: "S", shade: "s" }
};

const rackBar = (kg: number): Frame => {
  const W = 64;
  const H = 28;
  const g = new Grid(W, H);
  const mid = 14;
  // Barra (siempre): mango de acero con topes.
  g.rect(2, mid - 1, W - 4, 3, "k");
  g.rect(3, mid, W - 6, 1, "S");
  // Discos por lado, del más pesado al más ligero, desde el centro.
  const plates = platesFor(kg);
  let lx = 26;
  let rx = 36;
  plates.forEach((p) => {
    const st = PLATE_STYLE[p];
    lx -= st.w + 1;
    g.box(lx, mid - st.h / 2, st.w, st.h, st.fill, st.shade);
    g.box(rx + 1, mid - st.h / 2, st.w, st.h, st.fill, st.shade);
    rx += st.w + 1;
  });
  // Topes interiores
  g.box(26, mid - 4, 4, 8, "s");
  g.box(32, mid - 4, 4, 8, "s");
  return g.frame();
};

// ── MEDIDOR DE CALOR (RIR): zona DANGER roja abajo, aguja chunky ───────────

const heatMeter = (rir: number): Frame => {
  const g = new Grid(20, 44);
  // Tubo con contorno
  g.rect(6, 1, 9, 42, "k");
  // Zonas de abajo (DANGER, RIR 0) a arriba (RIR 4): 8px por zona.
  const zones = ["R", "O", "Y", "T", "s"]; // 0,1,2,3,4
  zones.forEach((ch, z) => {
    const yTop = 34 - z * 8;
    g.rect(8, yTop, 5, 7, ch);
  });
  // Rayas de separación
  times(4, (i) => g.rect(8, 33 - i * 8, 5, 1, "k"));
  // Aguja chunky del valor real (flecha blanca con contorno, apunta a la zona)
  const ny = 37 - rir * 8;
  g.rect(0, ny - 3, 7, 7, "k");
  g.rect(1, ny - 2, 4, 5, "W");
  g.rect(5, ny - 1, 1, 3, "W");
  g.set(6, ny, "W");
  // Marco blanco en la zona señalada
  g.rect(7, ny - 4, 7, 1, "W");
  g.rect(7, ny + 4, 7, 1, "W");
  return g.frame();
};

// ── TORRE DE DISCOS (volumen semanal) ──────────────────────────────────────

const discTower = (series: number): Frame => {
  const W = 26;
  const H = 56;
  const g = new Grid(W, H);
  const discs = Math.max(1, Math.round(series / 12));
  const dh = 5;
  const palette = [
    { fill: "O", shade: "o" },
    { fill: "Y", shade: "y" },
    { fill: "S", shade: "s" },
    { fill: "T", shade: "t" }
  ];
  times(discs, (i) => {
    const w = 22 - (i % 3) * 4;
    const x = Math.floor((W - w) / 2);
    const y = H - 2 - (i + 1) * dh;
    const c = palette[i % palette.length];
    g.box(x, y, w, dh + 1, c.fill, c.shade);
  });
  // Suelo
  g.rect(0, H - 2, W, 2, "k");
  return g.frame();
};

// ── Panel reparado con cinta (molestias) ───────────────────────────────────

const fixPanel = (): Frame => {
  const g = new Grid(40, 26);
  g.box(1, 1, 38, 24, "d");
  g.rect(2, 2, 36, 1, "s");
  // Grieta reparada: cinta teal en X
  times(16, (i) => {
    g.rect(11 + i, 4 + i, 3, 1, "T");
    g.rect(24 - i, 4 + i, 3, 1, "t");
  });
  // Remaches
  [
    [4, 4],
    [35, 4],
    [4, 21],
    [35, 21]
  ].forEach(([x, y]) => g.rect(x, y, 2, 2, "S"));
  return g.frame();
};

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
    palette={PAL_C}
    scale={scale}
    fps={fps}
    label={label}
  />
);

export function DataLabC() {
  return (
    <PaletteProvider palette={PAL_C}>
      <section className="c-data">
        <h2 className="devart-h">Rack de discos — press inclinado</h2>
        <p className="devart-note">
          Cada sesión es una barra cargada: más kilos, más discos colgados
          (naranja 10 · amarillo 5 · teal 2,5 por lado). Los kg y la fecha, en
          marcador grande.
        </p>
        <div className="c-data__rack">
          {CARGA.map((p) => (
            <div key={p.fecha} className="c-data__rackrow">
              <span className="c-data__kg">
                {String(p.kg).replace(".", ",")}
                <i>kg</i>
              </span>
              <Px f={rackBar(p.kg)} scale={3} label={`${p.fecha}: ${p.kg} kg`} />
              <span className="c-data__date">{p.fecha}</span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Reps y medidor de calor (RIR)</h2>
        <p className="devart-note">
          Cada rep de la mejor serie es un golpe de combo (el último, en
          blanco). El medidor marca el RIR: la zona roja de abajo es DANGER
          (RIR 0, fallo); la útil es 1–2.
        </p>
        <div className="c-data__sessions">
          {CARGA.map((p) => (
            <div key={p.fecha} className="c-data__session">
              <div className="c-data__meter">
                <Px f={heatMeter(p.rir)} scale={2} label={`RIR ${p.rir}`} />
                <span className="c-data__danger">DANGER</span>
              </div>
              <div className="c-pips" aria-label={`${p.reps} repeticiones`}>
                {times(p.reps, (i) => (
                  <span key={i} className={`c-pip ${i === p.reps - 1 ? "c-pip--last" : ""}`} />
                ))}
              </div>
              <span className="c-data__mini">
                <b>{p.reps} reps</b> · RIR {p.rir}
                <i>{p.fecha}</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Llamas de combo — adherencia semanal</h2>
        <p className="devart-note">
          Cinco llamas por semana, una por misión. Semana completa = COMBO x5 y
          multiplicador en magenta.
        </p>
        <div className="c-data__weeks">
          {ADHERENCIA.map((wk) => (
            <div key={wk.semana} className="c-data__week">
              <div className="c-data__flames">
                {times(wk.objetivo, (i) => (
                  <Px
                    key={i}
                    f={i < wk.hechas ? FLAME_ON_C : FLAME_OFF_C}
                    scale={2}
                    label={i < wk.hechas ? "misión cumplida" : "misión pendiente"}
                  />
                ))}
              </div>
              <b className={`c-data__mult ${wk.hechas >= wk.objetivo ? "c-data__mult--max" : ""}`}>
                x{wk.hechas}
              </b>
              <span className="c-data__mini">
                S{wk.semana} · {wk.hechas}/{wk.objetivo}
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Torre de discos — volumen semanal</h2>
        <p className="devart-note">Un disco por cada ~12 series de trabajo: la semana 6 fue descarga y la torre lo canta.</p>
        <div className="c-data__weeks c-data__weeks--bottom">
          {VOLUMEN.map((wk) => (
            <div key={wk.semana} className="c-data__week">
              <Px f={discTower(wk.series)} scale={2} label={`Semana ${wk.semana}: ${wk.series} series`} />
              <span className="c-data__mini">
                S{wk.semana}
                <i>{wk.series} series</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Muro de medallas — récords</h2>
        <div className="c-data__records">
          {RECORDS.map((r) => (
            <div key={r.ejercicio} className="c-medal">
              <span className="c-medal__burst" aria-hidden="true" />
              <Px f={SEAL_DONE_C} scale={3} label={`Récord: ${r.ejercicio} ${r.kg} kg`} />
              <span className="c-medal__plate">
                <b>{String(r.kg).replace(".", ",")} kg</b>
              </span>
              <span className="c-data__mini">
                {r.ejercicio}
                <i>{r.fecha}</i>
              </span>
            </div>
          ))}
        </div>

        <h2 className="devart-h">Panel reparado — molestias</h2>
        <p className="devart-note">
          Dos molestias en 6 semanas, ninguna rota: cinta, ajuste y sello FIX.
        </p>
        <div className="c-data__records">
          {MOLESTIAS.map((m) => (
            <div key={m.fecha} className="c-fix">
              <div className="c-fix__panel">
                <Px f={fixPanel()} scale={3} label={`${m.ejercicio}: ${m.accion}`} />
                <span className="c-fix__seal">FIX</span>
              </div>
              <span className="c-data__mini">
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
