// Personalización visual: nombre, apariencia y galería de cosméticos.
// Los cosméticos se desbloquean por progreso legítimo (idempotente vía
// unlocks) y JAMÁS tocan entrenamientos, prescripciones ni sugerencias.

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, touch } from "../../db/db";
import type { Appearance, Profile } from "../../db/types";
import { PixelButton, PixelFrame, PixelModal, StatusChip } from "../../ui/Pixel";
import {
  COSMETICS,
  DEFAULT_APPEARANCE,
  cosmeticProgress,
  cosmeticStateOf,
  meetsRule,
  syncUnlocks,
  type CosmeticItem,
  type CosmeticSlot
} from "../../logic/cosmetics";

const SLOT_LABEL: Record<CosmeticSlot, string> = {
  skinTone: "Tono de piel",
  hair: "Pelo",
  outfit: "Ropa",
  armor: "Armadura y accesorios",
  aura: "Aura",
  frame: "Marco",
  namePlate: "Placa de nombre",
  theme: "Tema de color"
};

export function CosmeticsSection({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  useEffect(() => setNameDraft(profile.name), [profile.name]);

  const unlocks = useLiveQuery(
    async () => await db.unlocks.where("profileId").equals(profile.id).toArray(),
    [profile.id]
  );
  const progress = useLiveQuery(
    async () => await cosmeticProgress(profile),
    [profile.id, profile.xp]
  );

  // Sincronización idempotente al abrir Perfil: nunca duplica desbloqueos.
  useEffect(() => {
    void syncUnlocks(profile);
  }, [profile.id, profile.xp]);

  if (!unlocks || !progress) return null;

  const appearance: Appearance = { ...DEFAULT_APPEARANCE, ...profile.appearance };
  const unlockedIds = new Set(unlocks.map((u) => u.itemId));

  const saveName = async () => {
    const clean = nameDraft.trim();
    if (!clean || clean === profile.name) return;
    const fresh = await db.profiles.get(profile.id);
    if (fresh) await db.profiles.put(touch({ ...fresh, name: clean }));
  };

  const equip = async (item: CosmeticItem) => {
    const fresh = await db.profiles.get(profile.id);
    if (!fresh) return;
    await db.profiles.put(
      touch({
        ...fresh,
        appearance: { ...DEFAULT_APPEARANCE, ...fresh.appearance, [item.slot]: item.id }
      })
    );
  };

  return (
    <PixelFrame as="section">
      <div className="field-label">
        <span>Apariencia y cosméticos</span>
        <span className="field-label__hint">
          {unlocks.length + COSMETICS.filter((c) => !c.rule).length} disponibles
        </span>
      </div>
      <div className="stack stack--tight">
        <label className="filter-item">
          <span className="filter-item__label">Nombre del forjador</span>
          <input
            type="text"
            className="text-input"
            maxLength={20}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => void saveName()}
          />
        </label>
        <PixelButton tone="gold" block onClick={() => setOpen(true)}>
          Abrir galería de cosméticos
        </PixelButton>
        <p className="small dim">
          Se desbloquean con misiones del plan, capítulos, hitos honestos y
          campañas completas. Nunca por volumen extra, dolor o fallo. No
          cambian nada del entrenamiento.
        </p>
      </div>

      <PixelModal open={open} title="Galería de la Forja" onClose={() => setOpen(false)}>
        <div className="stack stack--tight">
          {(Object.keys(SLOT_LABEL) as CosmeticSlot[]).map((slot) => (
            <div key={slot}>
              <div className="field-label">
                <span>{SLOT_LABEL[slot]}</span>
              </div>
              <div className="cosmetic-grid">
                {COSMETICS.filter((c) => c.slot === slot).map((item) => {
                  const state = cosmeticStateOf(item, unlockedIds, appearance);
                  const meets = meetsRule(item.rule, progress);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`cosmetic-card cosmetic-card--${state}`}
                      disabled={state === "bloqueado"}
                      aria-label={`${item.nombre}: ${
                        state === "equipado"
                          ? "equipado"
                          : state === "disponible"
                            ? "disponible, tocar para equipar"
                            : `bloqueado, requiere ${item.requisito}`
                      }`}
                      onClick={() => state === "disponible" && void equip(item)}
                    >
                      <b>{item.nombre}</b>
                      <span className="small">
                        {state === "equipado" ? (
                          <StatusChip tone="done" dot>Equipado</StatusChip>
                        ) : state === "disponible" ? (
                          "Tocar para equipar"
                        ) : (
                          `🔒 ${item.requisito}`
                        )}
                      </span>
                      {state === "bloqueado" && meets && (
                        <span className="small dim">se desbloqueará al sincronizar</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="small dim">
            Progreso: {progress.misiones} misiones · {progress.capitulos} capítulos ·{" "}
            {progress.hitos} hitos · {progress.campanas} campañas · nivel {progress.level}
          </p>
          <PixelButton tone="gold" block onClick={() => setOpen(false)}>
            Cerrar galería
          </PixelButton>
        </div>
      </PixelModal>
    </PixelFrame>
  );
}
