// Dirección B — lienzo procedimental compartido (data-viz y motion lab).

import { times, type Frame } from "../engine";

export class Grid {
  cells: string[][];
  constructor(
    public w: number,
    public h: number
  ) {
    this.cells = times(h, () => times(w, () => "."));
  }
  set(x: number, y: number, ch: string) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi >= 0 && xi < this.w && yi >= 0 && yi < this.h) this.cells[yi][xi] = ch;
  }
  rect(x: number, y: number, w: number, h: number, ch: string) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
  }
  line(x0: number, y0: number, x1: number, y1: number, ch: string) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, ch);
    }
  }
  stamp(f: Frame, x: number, y: number) {
    f.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const ch = row[dx];
        if (ch !== "." && ch !== " ") this.set(x + dx, y + dy, ch);
      }
    });
  }
  frame(): Frame {
    return this.cells.map((r) => r.join(""));
  }
}

/** Fuente 3×5 para tambores y ventanitas mecánicas. */
export const DIGITS: Record<string, Frame> = {
  "0": ["kkk", "k.k", "k.k", "k.k", "kkk"],
  "1": [".k.", "kk.", ".k.", ".k.", "kkk"],
  "2": ["kkk", "..k", "kkk", "k..", "kkk"],
  "3": ["kkk", "..k", "kkk", "..k", "kkk"],
  "4": ["k.k", "k.k", "kkk", "..k", "..k"],
  "5": ["kkk", "k..", "kkk", "..k", "kkk"],
  "6": ["kkk", "k..", "kkk", "k.k", "kkk"],
  "7": ["kkk", "..k", "..k", "..k", "..k"],
  "8": ["kkk", "k.k", "kkk", "k.k", "kkk"],
  "9": ["kkk", "k.k", "kkk", "..k", "kkk"]
};
