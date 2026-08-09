// Ficha de ejercicio: contenido íntegro del manual + rendimiento reciente.

import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { codexById } from "../data/codex";
import { DAYS } from "../data/routine";
import { useActiveProfile } from "../ui/hooks";
import { PixelButton, PixelFrame } from "../ui/Pixel";

export function CodexDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const profile = useActiveProfile();
  const codex = exerciseId ? codexById(exerciseId) : undefined;

  const recent = useLiveQuery(
    async () =>
      profile && exerciseId
        ? (
            await db.setLogs
              .where("[profileId+exerciseId]")
              .equals([profile.id, exerciseId])
              .and((s) => !s.skipped && s.reps > 0)
              .sortBy("createdAt")
          ).slice(-6)
        : [],
    [profile?.id, exerciseId]
  );

  if (!codex) {
    return (
      <main className="screen">
        <div className="inline-alert inline-alert--danger" role="alert">
          Este ejercicio no está en el códice.
        </div>
        <div style={{ marginTop: 16 }}>
          <PixelButton tone="gold" block onClick={() => navigate("/codice")}>
            Volver al códice
          </PixelButton>
        </div>
      </main>
    );
  }

  const usedIn = DAYS.filter((d) =>
    d.entries.some((e) => e.exerciseId === codex.id)
  );

  return (
    <main className="screen">
      <Link to="/codice" className="px-label" style={{ display: "inline-block", marginBottom: 12 }}>
        ‹ Códice
      </Link>
      <h1 className="wk-exname">{codex.nombre}</h1>
      <p className="small dim" style={{ marginBottom: 8 }}>
        {codex.musculos}
      </p>
      <p className="small dim" style={{ marginBottom: 16 }}>
        Aparece en: {usedIn.map((d) => d.name).join(" y ")}
      </p>

      <div className="stack">
        <PixelFrame tight as="section">
          <div className="codex-section">
            <h3>Por qué está en la rutina</h3>
            <p className="small">{codex.porQue}</p>
          </div>
        </PixelFrame>

        <PixelFrame tight as="section">
          <div className="codex-section">
            <h3>Colocación</h3>
            <ul>
              {codex.colocacion.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="codex-section">
            <h3>Ejecución</h3>
            <ul>
              {codex.ejecucion.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </PixelFrame>

        <PixelFrame tight as="section">
          <div className="codex-section codex-section--errores">
            <h3>Errores frecuentes</h3>
            <ul>
              {codex.errores.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="codex-section codex-section--alt">
            <h3>Alternativas</h3>
            <ul>
              {codex.alternativas.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </PixelFrame>

        <PixelFrame tight as="section">
          <div className="codex-section">
            <h3>Rendimiento reciente</h3>
            {recent && recent.length > 0 ? (
              <div className="wk-prev__sets">
                {recent.map((s) => (
                  <span key={s.id} className="wk-prev__set">
                    {s.weightKg} kg × {s.reps} @ RIR {s.rir}
                  </span>
                ))}
              </div>
            ) : (
              <p className="small dim">Todavía sin registros en la campaña.</p>
            )}
          </div>
        </PixelFrame>
      </div>
    </main>
  );
}
