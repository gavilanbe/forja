// Comparador de direcciones artísticas. SOLO desarrollo: la ruta se registra
// únicamente con import.meta.env.DEV. No toca pantallas ni lógica de
// producción; todo vive bajo src/devart/.

import { useSearchParams } from "react-router-dom";
import { DIRECTION_A } from "./a/direction";
import { DIRECTION_B } from "./b/direction";
import { DIRECTION_C } from "./c/direction";
import { SLICE_SCREENS, type ArtDirection, type SliceScreen } from "./types";
import "./devart.css";

const DIRECTIONS: ArtDirection[] = [DIRECTION_A, DIRECTION_B, DIRECTION_C];

type Section = "biblia" | "sprites" | "motion" | "datos" | "slice";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "biblia", label: "Art bible" },
  { id: "sprites", label: "Sprites" },
  { id: "motion", label: "Motion lab" },
  { id: "datos", label: "Data-viz" },
  { id: "slice", label: "Vertical slice" }
];

export function ArtDirections() {
  const [params, setParams] = useSearchParams();
  const dirId = (params.get("dir") ?? "a") as ArtDirection["id"];
  const section = (params.get("sec") ?? "biblia") as Section;
  const screen = (params.get("screen") ?? "hoy") as SliceScreen;
  const dir = DIRECTIONS.find((d) => d.id === dirId) ?? DIRECTIONS[0];

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  return (
    <div className="devart">
      <header className="devart__bar">
        <span className="devart__logo">FORJA · direcciones</span>
        <nav className="devart__dirs" aria-label="Dirección artística">
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`devart__dirbtn devart__dirbtn--${d.id}${
                d.id === dir.id ? " devart__dirbtn--on" : ""
              }`}
              aria-pressed={d.id === dir.id}
              onClick={() => setParam({ dir: d.id })}
            >
              <b>{d.id.toUpperCase()}</b> {d.nombre}
            </button>
          ))}
        </nav>
        <nav className="devart__secs" aria-label="Sección">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`devart__secbtn${s.id === section ? " devart__secbtn--on" : ""}`}
              aria-pressed={s.id === section}
              onClick={() => setParam({ sec: s.id })}
            >
              {s.label}
            </button>
          ))}
          {section === "slice" && (
            <span className="devart__screens">
              {SLICE_SCREENS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`devart__screenbtn${s.id === screen ? " devart__screenbtn--on" : ""}`}
                  aria-pressed={s.id === screen}
                  onClick={() => setParam({ screen: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </span>
          )}
        </nav>
      </header>

      <div className={`devart__stage ${dir.rootClass}`} data-dir={dir.id}>
        <p className="devart__claim">{dir.claim}</p>
        {section === "biblia" && <dir.Bible />}
        {section === "sprites" && <dir.Sprites />}
        {section === "motion" && <dir.MotionLab />}
        {section === "datos" && <dir.DataLab />}
        {section === "slice" && <dir.Slice screen={screen} />}
      </div>
    </div>
  );
}
