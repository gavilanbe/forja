// Renderizador de sprites: mapa de caracteres → SVG con rects enteros.
// shape-rendering: crispEdges mantiene el pixel perfecto a cualquier escala.

import { memo } from "react";
import { PALETTE, type SpriteMap } from "./sprites";

interface SpriteProps {
  map: SpriteMap;
  /** Tamaño de cada pixel en px CSS (entero). */
  scale?: number;
  /** Sustituciones de color por carácter, p. ej. { e: "#9AA7BD" }. */
  recolor?: Record<string, string>;
  label?: string;
  className?: string;
}

export const Sprite = memo(function Sprite({
  map,
  scale = 3,
  recolor,
  label,
  className
}: SpriteProps) {
  const h = map.length;
  const w = map[0]?.length ?? 0;
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < h; y++) {
    const row = map[y];
    let x = 0;
    while (x < w) {
      const ch = row[x];
      if (ch === "." || ch === " ") {
        x++;
        continue;
      }
      // agrupa píxeles contiguos del mismo color en un solo rect
      let run = 1;
      while (x + run < w && row[x + run] === ch) run++;
      const color = recolor?.[ch] ?? PALETTE[ch];
      if (color) {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={color} />
        );
      }
      x += run;
    }
  }
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      focusable="false"
    >
      {rects}
    </svg>
  );
});
