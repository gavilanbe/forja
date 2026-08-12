// Ficha de ejercicio: contenido íntegro del manual + rendimiento reciente,
// favoritos, nota personal y variantes con su propio historial.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, now, touch } from "../db/db";
import { codexById } from "../data/codex";
import { DAYS } from "../data/routine";
import { variantById, variantsOf } from "../data/variants";
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
  const codexPref = useLiveQuery(
    async () =>
      profile && exerciseId
        ? await db.codexPrefs.get(`codex:${profile.id}:${exerciseId}`)
        : undefined,
    [profile?.id, exerciseId]
  );
  const [noteDraft, setNoteDraft] = useState("");
  useEffect(() => {
    setNoteDraft(codexPref?.personalNote ?? "");
  }, [codexPref?.personalNote]);

  const savePref = async (patch: { favorite?: boolean; personalNote?: string }) => {
    if (!profile || !exerciseId) return;
    const id = `codex:${profile.id}:${exerciseId}`;
    const existing = await db.codexPrefs.get(id);
    const t = now();
    await db.codexPrefs.put(
      existing
        ? touch({ ...existing, ...patch })
        : {
            id,
            createdAt: t,
            updatedAt: t,
            localVersion: 1,
            syncStatus: "local",
            profileId: profile.id,
            exerciseId,
            favorite: false,
            ...patch
          }
    );
  };

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
      <div className="row" style={{ alignItems: "flex-start" }}>
        <h1 className="wk-exname grow">{codex.nombre}</h1>
        <button
          type="button"
          className={`fav-btn${codexPref?.favorite ? " fav-btn--on" : ""}`}
          aria-pressed={codexPref?.favorite ?? false}
          aria-label={codexPref?.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          onClick={() => savePref({ favorite: !(codexPref?.favorite ?? false) })}
        >
          ★
        </button>
      </div>
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

        {variantsOf(codex.id).length > 0 && (
          <PixelFrame tight as="section">
            <div className="codex-section codex-section--alt">
              <h3>Variantes con historial propio</h3>
              <ul>
                {variantsOf(codex.id).map((v) => (
                  <li key={v.id}>{v.nombre}</li>
                ))}
              </ul>
            </div>
          </PixelFrame>
        )}

        <PixelFrame tight as="section">
          <div className="codex-section">
            <h3>Rendimiento reciente</h3>
            {recent && recent.length > 0 ? (
              <div className="wk-prev__sets">
                {recent.map((s) => (
                  <span key={s.id} className="wk-prev__set">
                    {s.weightKg} kg × {s.reps} @ RIR {s.rir}
                    {s.variantId
                      ? ` · ${variantById(s.variantId)?.nombre ?? "variante"}`
                      : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="small dim">Todavía sin registros en la campaña.</p>
            )}
          </div>
        </PixelFrame>

        <PixelFrame tight as="section">
          <div className="codex-section">
            <h3>Nota personal</h3>
            <textarea
              className="note-input"
              maxLength={300}
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Ajustes de máquina, sensaciones, recordatorios…"
              aria-label={`Nota personal de ${codex.nombre}`}
            />
            <PixelButton
              tone="gold"
              block
              onClick={() => savePref({ personalNote: noteDraft })}
            >
              Guardar nota
            </PixelButton>
          </div>
        </PixelFrame>
      </div>
    </main>
  );
}
