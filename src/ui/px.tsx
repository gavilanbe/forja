// Motor común de los laboratorios de dirección artística (SOLO desarrollo).
// Sprites como mapas de caracteres → canvas escalado sin suavizado.
// Animación por pasos discretos (nunca tweens) y reduced motion que salta
// directamente al fotograma final. Nada de esto entra en producción.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";

export type Frame = string[];
export type Palette = Record<string, string>;

// ── Utilidades de composición de fotogramas ────────────────────────────────

/** Copia profunda de un fotograma. */
export const clone = (f: Frame): Frame => [...f];

/** Superpone `patch` sobre `base` en (x,y); "." y " " son transparentes. */
export const overlay = (base: Frame, patch: Frame, x: number, y: number): Frame => {
  const out = base.map((row) => row.split(""));
  patch.forEach((prow, py) => {
    for (let px = 0; px < prow.length; px++) {
      const ch = prow[px];
      if (ch === "." || ch === " ") continue;
      const ty = y + py;
      const tx = x + px;
      if (ty < 0 || ty >= out.length || tx < 0 || tx >= out[ty].length) continue;
      out[ty][tx] = ch;
    }
  });
  return out.map((r) => r.join(""));
};

/** Desplaza el contenido `dy` filas (positivo = abajo) rellenando con ".". */
export const shiftY = (f: Frame, dy: number): Frame => {
  const w = f[0]?.length ?? 0;
  const empty = ".".repeat(w);
  const out = f.map(() => empty);
  f.forEach((row, y) => {
    const ty = y + dy;
    if (ty >= 0 && ty < out.length) out[ty] = row;
  });
  return out;
};

export const shiftX = (f: Frame, dx: number): Frame =>
  f.map((row) => {
    const w = row.length;
    if (dx > 0) return (".".repeat(dx) + row).slice(0, w);
    return (row + ".".repeat(-dx)).slice(-w);
  });

/** Espejo horizontal. */
export const mirrorX = (f: Frame): Frame => f.map((r) => [...r].reverse().join(""));

/** Sustituye caracteres (recolor estructural). */
export const remap = (f: Frame, table: Record<string, string>): Frame =>
  f.map((row) => [...row].map((ch) => table[ch] ?? ch).join(""));

/** Borra una zona rectangular. */
export const erase = (f: Frame, x: number, y: number, w: number, h: number): Frame =>
  f.map((row, ry) => {
    if (ry < y || ry >= y + h) return row;
    const cells = row.split("");
    for (let i = x; i < Math.min(x + w, cells.length); i++) cells[i] = ".";
    return cells.join("");
  });

// ── Reduced motion ─────────────────────────────────────────────────────────

export const prefersReduced = (): boolean => {
  // La preferencia de la app (Perfil) manda sobre la del sistema.
  if (typeof document !== "undefined") {
    const m = document.documentElement.dataset.motion;
    if (m === "reducida") return true;
    if (m === "completa") return false;
  }
  return (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

// ── Renderizado en canvas ──────────────────────────────────────────────────

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  palette: Palette,
  scale: number
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  frame.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || ch === " ") {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const color = palette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, run * scale, scale);
      }
      x += run;
    }
  });
};

/**
 * Sprite animado sobre canvas. `fps` en fotogramas/segundo; con reduced
 * motion se pinta SOLO el último fotograma (estado final), salvo `holdFirst`.
 */
export function PxSprite({
  frames,
  palette,
  scale = 4,
  fps = 6,
  playing = true,
  loop = true,
  holdFirst = false,
  label,
  className,
  onDone
}: {
  frames: Frame[];
  palette: Palette;
  scale?: number;
  fps?: number;
  playing?: boolean;
  loop?: boolean;
  /** Con reduced motion, quedarse en el primer fotograma en vez del último. */
  holdFirst?: boolean;
  label?: string;
  className?: string;
  onDone?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = (frames[0]?.[0]?.length ?? 0) * scale;
  const h = (frames[0]?.length ?? 0) * scale;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const reduced = prefersReduced();
    if (reduced || !playing || frames.length === 1) {
      const idx = reduced && !holdFirst ? frames.length - 1 : 0;
      drawFrame(ctx, frames[playing || reduced ? idx : 0], palette, scale);
      if (reduced) onDoneRef.current?.();
      return;
    }

    let i = 0;
    drawFrame(ctx, frames[0], palette, scale);
    const id = setInterval(() => {
      i += 1;
      if (i >= frames.length) {
        if (loop) i = 0;
        else {
          clearInterval(id);
          onDoneRef.current?.();
          return;
        }
      }
      drawFrame(ctx, frames[i], palette, scale);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [frames, palette, scale, fps, playing, loop, holdFirst]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{ width: w, height: h, imageRendering: "pixelated" }}
      role={label ? "img" : "presentation"}
      aria-label={label}
      className={className}
    />
  );
}

// ── Timeline de escenas del motion lab ─────────────────────────────────────

export interface TimelineStep {
  /** ms desde el inicio */
  at: number;
  do: () => void;
}

/**
 * Ejecuta una escena por pasos. Con reduced motion aplica TODOS los pasos
 * inmediatamente (estado final sin animación).
 */
export const runTimeline = (steps: TimelineStep[], onEnd?: () => void): (() => void) => {
  if (prefersReduced()) {
    steps.forEach((s) => s.do());
    onEnd?.();
    return () => {};
  }
  const ids = steps.map((s) => setTimeout(s.do, s.at));
  const last = Math.max(0, ...steps.map((s) => s.at));
  const endId = setTimeout(() => onEnd?.(), last + 60);
  return () => {
    ids.forEach(clearTimeout);
    clearTimeout(endId);
  };
};

// ── Contexto de dirección (paleta activa) ──────────────────────────────────

const PaletteCtx = createContext<Palette>({});
export const PaletteProvider = ({
  palette,
  children
}: {
  palette: Palette;
  children: ReactNode;
}) => <PaletteCtx.Provider value={palette}>{children}</PaletteCtx.Provider>;
export const usePalette = () => useContext(PaletteCtx);

/** Sprite que toma la paleta del contexto de dirección. */
export function Spr(props: Omit<Parameters<typeof PxSprite>[0], "palette">) {
  const palette = usePalette();
  return <PxSprite {...props} palette={palette} />;
}

// ── Reproductor de escena reutilizable (motion lab) ────────────────────────

export function useScene() {
  const [nonce, setNonce] = useState(0);
  const [running, setRunning] = useState(false);
  const stopRef = useRef<() => void>(() => {});
  const play = (steps: TimelineStep[]) => {
    stopRef.current();
    setNonce((n) => n + 1);
    setRunning(true);
    stopRef.current = runTimeline(steps, () => setRunning(false));
  };
  useEffect(() => () => stopRef.current(), []);
  return { nonce, running, play };
}

// ── Utilidad: repetir fotograma ────────────────────────────────────────────

export const times = <T,>(n: number, fn: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => fn(i));
