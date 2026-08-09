// Códice: todos los ejercicios del manual, agrupados por día de rutina.

import { Link } from "react-router-dom";
import { DAYS } from "../data/routine";
import { codexById } from "../data/codex";
import { PixelFrame } from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { NAV_CODICE } from "../ui/arcade/icons";

export function Codex() {
  return (
    <main className="screen">
      <div className="row" style={{ marginBottom: 16 }}>
        <PxSprite frames={[NAV_CODICE]} palette={PAL_C} scale={2} />
        <h1 className="screen-title" style={{ marginBottom: 0 }}>
          Códice
        </h1>
      </div>
      <p className="small dim" style={{ marginBottom: 16 }}>
        La técnica del manual, siempre a mano: racional, colocación, ejecución,
        errores y alternativas de cada ejercicio.
      </p>
      <div className="stack">
        {DAYS.map((day) => (
          <PixelFrame key={day.id} tight as="section">
            <h2 className="px-label px-label--gold" style={{ marginBottom: 4 }}>
              {day.name}
            </h2>
            <div>
              {day.entries.map((e, i) => {
                const c = codexById(e.exerciseId);
                if (!c) return null;
                return (
                  <Link
                    key={`${e.exerciseId}-${i}`}
                    to={`/codice/${e.exerciseId}`}
                    className="codex-item"
                  >
                    <div className="grow">
                      <div className="codex-item__name">{c.nombre}</div>
                      <div className="codex-item__meta">
                        {e.sets}
                        {e.perSide ? " por lado" : ""} × {e.repMin}–{e.repMax} ·{" "}
                        {c.musculos}
                      </div>
                    </div>
                    <span className="codex-item__arrow" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                );
              })}
            </div>
          </PixelFrame>
        ))}
      </div>
    </main>
  );
}
