// Gráfica pixel: línea escalonada con puntos cuadrados, ejes nítidos y
// paleta del proyecto. No es un dashboard genérico: pertenece al juego.

interface Point {
  label: string;
  value: number;
  sub?: string;
}

export function PixelChart({
  points,
  unit,
  color = "var(--ember)",
  height = 150
}: {
  points: Point[];
  unit: string;
  color?: string;
  height?: number;
}) {
  if (points.length === 0) return null;
  const w = Math.max(300, points.length * 56);
  const padL = 34;
  const padR = 10;
  const padT = 14;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const values = points.map((p) => p.value);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const span = Math.max(1, rawMax - rawMin);
  const max = rawMax + span * 0.15;
  const min = Math.max(0, rawMin - span * 0.15);
  const xs = (i: number) =>
    Math.round(
      padL + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1))
    );
  const ys = (v: number) =>
    Math.round(padT + innerH - ((v - min) / (max - min)) * innerH);

  // Línea escalonada: horizontal hasta el siguiente x, luego vertical.
  let d = `M ${xs(0)} ${ys(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H ${xs(i)} V ${ys(points[i].value)}`;
  }

  const gridLines = 3;

  return (
    <div className="pxchart">
      <svg
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Progresión: ${points
          .map((p) => `${p.label} ${p.value} ${unit}`)
          .join(", ")}`}
      >
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const v = min + ((max - min) * i) / gridLines;
          const prev = min + ((max - min) * (i - 1)) / gridLines;
          if (i > 0 && Math.round(v) === Math.round(prev)) return null;
          const y = ys(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#232c40" strokeWidth="1" />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="11"
                fill="#9aa7bd"
                fontFamily="var(--font-sans)"
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        <path d={d} fill="none" stroke={color} strokeWidth="2" />
        {points.map((p, i) => (
          <g key={i}>
            <rect x={xs(i) - 3} y={ys(p.value) - 3} width="6" height="6" fill={color} />
            <text
              x={xs(i)}
              y={height - 20}
              textAnchor="middle"
              fontSize="11"
              fill="#9aa7bd"
              fontFamily="var(--font-sans)"
            >
              {p.label}
            </text>
            {p.sub && (
              <text
                x={xs(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#f4e7c5"
                fontFamily="var(--font-sans)"
              >
                {p.sub}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
