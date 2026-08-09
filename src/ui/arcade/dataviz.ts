// Data-viz arcade de producción (dirección C): rack de discos, medidor
// de calor de RIR y torre de discos. Los valores reales siempre acompañan
// en texto: la metáfora ilustra, nunca sustituye al dato.

import { times, type Frame } from "../px";

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

export const platesFor = (kg: number): number[] => {
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

export const rackBar = (kg: number): Frame => {
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

export const heatMeter = (rir: number): Frame => {
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

export const discTower = (series: number): Frame => {
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
