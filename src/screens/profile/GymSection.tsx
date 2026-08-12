// MI GIMNASIO: equipamiento real por ejercicio/variante y por perfil.
// Lo que se configura aquí se precarga en el entrenamiento (montaje,
// incremento real de los botones +/−, unidad, favorita, unilateral).

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { GymSetting, Profile } from "../../db/types";
import { CODEX, codexById } from "../../data/codex";
import { variantsOf } from "../../data/variants";
import { PixelButton, PixelFrame, PixelModal } from "../../ui/Pixel";
import { NumberField } from "../../ui/controls";
import { gymSettingId, saveGymSetting } from "../../logic/gym";

export function GymSection({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState<{
    exerciseId: string;
    variantId?: string;
  } | null>(null);
  const settings = useLiveQuery(
    async () => await db.gymSettings.where("profileId").equals(profile.id).toArray(),
    [profile.id]
  );

  if (!settings) return null;
  const byId = new Map(settings.map((s) => [s.id, s]));

  return (
    <PixelFrame as="section">
      <div className="field-label">
        <span>MI GIMNASIO</span>
        <span className="field-label__hint">equipamiento de {profile.name}</span>
      </div>
      <p className="small dim" style={{ marginBottom: 8 }}>
        Máquinas, asientos, agarres e incrementos reales. Se precargan en cada
        misión y ajustan los botones +/− al salto real de tu gimnasio.
      </p>
      <div className="gym-list">
        {CODEX.map((c) => {
          const main = byId.get(gymSettingId(profile.id, c.id));
          const configured =
            main ||
            variantsOf(c.id).some((v) => byId.has(gymSettingId(profile.id, c.id, v.id)));
          return (
            <button
              key={c.id}
              type="button"
              className="gym-list__row"
              onClick={() => setEditing({ exerciseId: c.id })}
            >
              <span className="grow">{c.nombre}</span>
              <span className={`small ${configured ? "" : "dim"}`}>
                {configured ? "configurado" : "sin configurar"}
              </span>
            </button>
          );
        })}
      </div>
      {editing && (
        <GymEditModal
          profile={profile}
          exerciseId={editing.exerciseId}
          variantId={editing.variantId}
          onPickVariant={(variantId) => setEditing({ ...editing, variantId })}
          onClose={() => setEditing(null)}
        />
      )}
    </PixelFrame>
  );
}

function GymEditModal({
  profile,
  exerciseId,
  variantId,
  onPickVariant,
  onClose
}: {
  profile: Profile;
  exerciseId: string;
  variantId?: string;
  onPickVariant: (v?: string) => void;
  onClose: () => void;
}) {
  const codex = codexById(exerciseId);
  const variants = variantsOf(exerciseId);
  const setting = useLiveQuery(
    async () => await db.gymSettings.get(gymSettingId(profile.id, exerciseId, variantId)),
    [profile.id, exerciseId, variantId]
  );
  const [saved, setSaved] = useState(false);

  const patch = async (p: Partial<GymSetting>) => {
    await saveGymSetting(profile.id, exerciseId, variantId, p);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const s = setting;

  return (
    <PixelModal
      open
      title={variantId ? variants.find((v) => v.id === variantId)?.nombre ?? "" : codex?.nombre ?? ""}
      onClose={onClose}
    >
      <div className="stack stack--tight">
        {variants.length > 0 && (
          <div className="select-frame">
            <select
              aria-label="Ejercicio o variante a configurar"
              value={variantId ?? ""}
              onChange={(e) => onPickVariant(e.target.value || undefined)}
            >
              <option value="">Ejercicio principal</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <TextRow label="Nombre de la máquina" value={s?.machineName ?? ""} onSave={(v) => patch({ machineName: v })} />
        <TextRow label="Posición del asiento" value={s?.seatPosition ?? ""} onSave={(v) => patch({ seatPosition: v })} />
        <TextRow label="Posición del respaldo" value={s?.backPosition ?? ""} onSave={(v) => patch({ backPosition: v })} />
        <TextRow label="Altura de polea" value={s?.pulleyHeight ?? ""} onSave={(v) => patch({ pulleyHeight: v })} />
        <TextRow label="Agarre o accesorio" value={s?.gripAccessory ?? ""} onSave={(v) => patch({ gripAccessory: v })} />
        <TextRow label="Notas de montaje" value={s?.setupNotes ?? ""} onSave={(v) => patch({ setupNotes: v })} />

        <NumberField
          label="Incremento mínimo disponible"
          hint="kg · ajusta los botones +/−"
          value={s?.minIncrementKg ?? null}
          step={0.25}
          decimals
          onChange={(v) => void patch({ minIncrementKg: v ?? undefined })}
        />
        <NumberField
          label="Peso de la barra"
          hint="kg · si aplica"
          value={s?.barWeightKg ?? null}
          step={0.5}
          decimals
          onChange={(v) => void patch({ barWeightKg: v ?? undefined })}
        />
        <TextRow
          label="Escala real de placas"
          value={(s?.plateScaleKg ?? []).join(", ")}
          placeholder="p. ej. 5, 10, 15, 20"
          onSave={(v) =>
            patch({
              plateScaleKg: v
                .split(",")
                .map((x) => Number(x.trim().replace(",", ".")))
                .filter((n) => Number.isFinite(n) && n > 0)
            })
          }
        />

        {variants.length > 0 && !variantId && (
          <label className="filter-item">
            <span className="filter-item__label">Variante favorita</span>
            <div className="select-frame">
              <select
                value={s?.favoriteVariantId ?? ""}
                onChange={(e) =>
                  void patch({ favoriteVariantId: e.target.value || undefined })
                }
              >
                <option value="">Ejercicio principal</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          </label>
        )}

        <div className="pref-row">
          <div>
            <div className="pref-row__label">Unidad</div>
            <div className="pref-row__hint">La base guarda siempre kg</div>
          </div>
          <div className="select-frame" style={{ minWidth: 90 }}>
            <select
              aria-label="Unidad de peso"
              value={s?.unit ?? "kg"}
              onChange={(e) => void patch({ unit: e.target.value as "kg" | "lb" })}
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
        <div className="pref-row">
          <div>
            <div className="pref-row__label">Registro por lado</div>
            <div className="pref-row__hint">Para unilaterales asimétricos</div>
          </div>
          <button
            type="button"
            className={`toggle${s?.perSideTracking ? " toggle--on" : ""}`}
            role="switch"
            aria-checked={s?.perSideTracking ?? false}
            onClick={() => void patch({ perSideTracking: !s?.perSideTracking })}
          >
            <span className="toggle__state">
              {s?.perSideTracking ? "ACTIVADO" : "DESACTIVADO"}
            </span>
          </button>
        </div>

        {saved && (
          <p className="small" style={{ color: "var(--done)" }} role="status">
            Guardado en este dispositivo.
          </p>
        )}
        <PixelButton tone="gold" block onClick={onClose}>
          Hecho
        </PixelButton>
      </div>
    </PixelModal>
  );
}

function TextRow({
  label,
  value,
  placeholder,
  onSave
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);
  return (
    <label className="filter-item">
      <span className="filter-item__label">{label}</span>
      <input
        type="text"
        className="text-input"
        value={dirty ? draft : value}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty) {
            onSave(draft.trim());
            setDirty(false);
          }
        }}
      />
    </label>
  );
}
