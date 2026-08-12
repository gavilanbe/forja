// Editor de rutinas. Las plantillas del manual son INTOCABLES: editar crea
// una copia personalizada por perfil. Los cambios solo afectan a sesiones
// futuras (cada sesión guarda su snapshot al empezar).

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { CustomRoutine, Profile } from "../../db/types";
import type { ExercisePrescription, WorkoutDay } from "../../data/types";
import { dayById } from "../../data/routine";
import { codexById, CODEX } from "../../data/codex";
import { variantsOf } from "../../data/variants";
import { PixelButton, PixelFrame, PixelModal, StatusChip } from "../../ui/Pixel";
import { NumberField } from "../../ui/controls";
import {
  addEntry,
  dayDiffersFromTemplate,
  forkTemplate,
  getCustomRoutine,
  removeEntry,
  reorderEntries,
  restoreDay,
  restoreTemplate,
  saveCustomRoutine,
  updateEntry
} from "../../logic/routines";

export function RoutineEditor({ profile }: { profile: Profile }) {
  const custom = useLiveQuery(
    async () => (await getCustomRoutine(profile.id)) ?? null,
    [profile.id]
  );
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  if (custom === undefined) return null;

  return (
    <PixelFrame as="section">
      <div className="field-label">
        <span>Rutina</span>
        <span className="field-label__hint">
          {custom ? "personalizada" : "plantilla del manual (protegida)"}
        </span>
      </div>

      {!custom ? (
        <div className="stack stack--tight">
          <p className="small dim">
            La rutina original de {profile.name} permanece como plantilla
            protegida. Duplicarla crea una versión editable: reordenar,
            cambiar series, rangos, RIR, descansos o ejercicios.
          </p>
          <PixelButton tone="gold" block onClick={() => void forkTemplate(profile)}>
            Duplicar plantilla para personalizar
          </PixelButton>
        </div>
      ) : (
        <div className="stack stack--tight">
          <p className="small dim">
            Los cambios afectan solo a misiones FUTURAS: cada sesión guarda una
            copia de la prescripción con la que se hizo.
            {profile.avatarId === "carlos" &&
              " Carlos sigue replicando las sesiones compartidas del manual, sin compensaciones inventadas."}
          </p>
          {custom.days.map((day) => (
            <div key={day.id} className="routine-day-row">
              <button
                type="button"
                className="gym-list__row grow"
                onClick={() => setDayOpen(day.id)}
              >
                <span className="grow">{day.name}</span>
                {dayDiffersFromTemplate(day) ? (
                  <StatusChip tone="warn" dot>editado</StatusChip>
                ) : (
                  <span className="small dim">plantilla</span>
                )}
              </button>
            </div>
          ))}
          {confirmRestore ? (
            <PixelButton
              tone="danger"
              block
              onClick={async () => {
                await restoreTemplate(profile.id);
                setConfirmRestore(false);
              }}
            >
              Confirmar: volver a la plantilla original
            </PixelButton>
          ) : (
            <PixelButton tone="ghost" block onClick={() => setConfirmRestore(true)}>
              Restaurar plantilla original…
            </PixelButton>
          )}
        </div>
      )}

      {custom && dayOpen && (
        <DayEditModal
          profile={profile}
          routine={custom}
          dayId={dayOpen}
          onClose={() => setDayOpen(null)}
        />
      )}
    </PixelFrame>
  );
}

function DayEditModal({
  profile,
  routine,
  dayId,
  onClose
}: {
  profile: Profile;
  routine: CustomRoutine;
  dayId: string;
  onClose: () => void;
}) {
  const day = routine.days.find((d) => d.id === dayId)!;
  const template = dayById(dayId);
  const [preview, setPreview] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const saveDay = async (next: WorkoutDay) => {
    const days = routine.days.map((d) => (d.id === dayId ? next : d));
    await saveCustomRoutine({ ...routine, days });
  };

  return (
    <PixelModal open title={`${day.name} — editar`} onClose={onClose}>
      <div className="stack stack--tight">
        <div className="row">
          <PixelButton tone={preview ? "gold" : "ghost"} sans onClick={() => setPreview(!preview)}>
            {preview ? "Ocultar previsualización" : "Previsualizar cambios"}
          </PixelButton>
        </div>

        {preview && template && (
          <div className="panel">
            <div className="panel__kicker"><span>Plantilla → personalizada</span></div>
            <ul className="small" style={{ listStyle: "none", display: "grid", gap: 4 }}>
              {day.entries.map((e, i) => {
                const t = template.entries.find((x) => x.exerciseId === e.exerciseId);
                const changed =
                  !t ||
                  t.sets !== e.sets ||
                  t.repMin !== e.repMin ||
                  t.repMax !== e.repMax ||
                  t.restMaxSec !== e.restMaxSec ||
                  template.entries.indexOf(t) !== i;
                return (
                  <li key={`${e.exerciseId}-${i}`}>
                    {changed ? "◆ " : "· "}
                    {codexById(e.exerciseId)?.nombre ?? e.exerciseId} — {e.sets} ×{" "}
                    {e.repMin}–{e.repMax}
                    {!t && " (añadido)"}
                  </li>
                );
              })}
              {template.entries
                .filter((t) => !day.entries.some((e) => e.exerciseId === t.exerciseId))
                .map((t) => (
                  <li key={t.exerciseId} className="dim">
                    ✕ {codexById(t.exerciseId)?.nombre} (quitado)
                  </li>
                ))}
            </ul>
          </div>
        )}

        {day.entries.map((entry, i) => (
          <EntryEditor
            key={`${entry.exerciseId}-${i}`}
            entry={entry}
            index={i}
            total={day.entries.length}
            onMove={(dir) => void saveDay(reorderEntries(day, i, i + dir))}
            onPatch={(p) => void saveDay(updateEntry(day, i, p))}
            onRemove={() => void saveDay(removeEntry(day, i))}
          />
        ))}

        <PixelButton tone="ghost" block onClick={() => setAddOpen(true)}>
          Añadir ejercicio
        </PixelButton>
        <PixelButton
          tone="ghost"
          sans
          block
          onClick={async () => {
            await restoreDay(profile.id, dayId);
          }}
        >
          Restaurar este día a la plantilla
        </PixelButton>
        <PixelButton tone="gold" block onClick={onClose}>
          Hecho
        </PixelButton>

        {addOpen && (
          <div className="panel">
            <div className="panel__kicker"><span>Añadir ejercicio</span></div>
            <div className="stack stack--tight">
              {CODEX.filter(
                (c) => !day.entries.some((e) => e.exerciseId === c.id)
              ).map((c) => (
                <PixelButton
                  key={c.id}
                  tone="ghost"
                  sans
                  block
                  onClick={async () => {
                    const entry: ExercisePrescription = {
                      exerciseId: c.id,
                      sets: 3,
                      repMin: 8,
                      repMax: 12,
                      rirPerSet: [
                        { rir: { min: 2, max: 2 } },
                        { rir: { min: 1, max: 2 } },
                        { rir: { min: 1, max: 1 } }
                      ],
                      restMinSec: 90,
                      restMaxSec: 120
                    };
                    await saveDay(addEntry(day, entry));
                    setAddOpen(false);
                  }}
                >
                  {c.nombre}
                </PixelButton>
              ))}
            </div>
          </div>
        )}
      </div>
    </PixelModal>
  );
}

function EntryEditor({
  entry,
  index,
  total,
  onMove,
  onPatch,
  onRemove
}: {
  entry: ExercisePrescription;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onPatch: (p: Partial<ExercisePrescription>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const variants = variantsOf(entry.exerciseId);
  const name = codexById(entry.exerciseId)?.nombre ?? entry.exerciseId;

  return (
    <div className="routine-entry">
      <div className="routine-entry__head">
        <button
          type="button"
          className="routine-entry__title grow"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <b>{index + 1}. {name}</b>
          <span className="small dim">
            {" "}{entry.sets} × {entry.repMin}–{entry.repMax}
          </span>
        </button>
        <div className="routine-entry__movers">
          <button
            type="button"
            className="mini-btn"
            aria-label={`Subir ${name}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="mini-btn"
            aria-label={`Bajar ${name}`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
        </div>
      </div>
      {open && (
        <div className="stack stack--tight" style={{ marginTop: 8 }}>
          {variants.length > 0 && (
            <label className="filter-item">
              <span className="filter-item__label">Cambiar por variante</span>
              <div className="select-frame">
                <select
                  value=""
                  onChange={(e) => {
                    const v = variants.find((x) => x.id === e.target.value);
                    if (v?.codexId) onPatch({ exerciseId: v.codexId });
                  }}
                >
                  <option value="">— elegir —</option>
                  {variants
                    .filter((v) => v.codexId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                </select>
              </div>
            </label>
          )}
          <NumberField
            label="Series"
            value={entry.sets}
            step={1}
            min={1}
            max={8}
            onChange={(v) => v && onPatch({ sets: v })}
          />
          <NumberField
            label="Repeticiones mínimas"
            value={entry.repMin}
            step={1}
            min={1}
            max={30}
            onChange={(v) => v && onPatch({ repMin: Math.min(v, entry.repMax) })}
          />
          <NumberField
            label="Repeticiones máximas"
            value={entry.repMax}
            step={1}
            min={1}
            max={30}
            onChange={(v) => v && onPatch({ repMax: Math.max(v, entry.repMin) })}
          />
          <NumberField
            label="RIR objetivo (primera serie)"
            hint="las siguientes bajan solas"
            value={entry.rirPerSet[0]?.rir.max ?? 2}
            step={1}
            min={0}
            max={4}
            onChange={(v) => {
              if (v === null) return;
              const rirPerSet = entry.rirPerSet.map((_r, i) => ({
                rir: {
                  min: Math.max(0, v - (i >= entry.rirPerSet.length - 1 ? 1 : 0)),
                  max: Math.max(0, v - (i > 0 ? 1 : 0))
                }
              }));
              onPatch({ rirPerSet });
            }}
          />
          <NumberField
            label="Descanso"
            hint="segundos"
            value={entry.restMaxSec}
            step={15}
            min={30}
            max={300}
            onChange={(v) =>
              v && onPatch({ restMaxSec: v, restMinSec: Math.min(entry.restMinSec, v) })
            }
          />
          {confirmRemove ? (
            <PixelButton tone="danger" block onClick={onRemove}>
              Confirmar: quitar {name}
            </PixelButton>
          ) : (
            <PixelButton tone="danger" sans block onClick={() => setConfirmRemove(true)}>
              Quitar ejercicio…
            </PixelButton>
          )}
        </div>
      )}
    </div>
  );
}
