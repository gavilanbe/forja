// Códice: buscador, filtros (grupo muscular, día, equipamiento), favoritos,
// historial reciente y conocimiento general del manual. Todo offline: el
// contenido vive en el bundle y los datos personales en IndexedDB.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { DAYS } from "../data/routine";
import { CODEX, codexById } from "../data/codex";
import { KNOWLEDGE } from "../data/knowledge";
import { variantById } from "../data/variants";
import { useActiveProfile } from "../ui/hooks";
import { PixelFrame } from "../ui/Pixel";
import { PxSprite } from "../ui/px";
import { PAL_C } from "../ui/arcade/palette";
import { NAV_CODICE, G_STAR } from "../ui/arcade/icons";

/** Grupo muscular aproximado a partir del campo `musculos` del manual. */
const GROUPS = [
  { id: "pecho", label: "Pecho", match: /pecho|pectoral/i },
  { id: "espalda", label: "Espalda", match: /espalda|dorsal/i },
  { id: "hombro", label: "Hombro", match: /deltoide|hombro/i },
  { id: "brazos", label: "Brazos", match: /bíceps|tríceps|biceps|triceps/i },
  { id: "pierna", label: "Pierna", match: /cuádriceps|femoral|glúteo|gemelo|cadera|cuadriceps|gluteo/i },
  { id: "core", label: "Core", match: /core|abdomen|recto/i }
];

/** Equipamiento aproximado a partir del nombre del ejercicio. */
const EQUIPMENT = [
  { id: "maquina", label: "Máquina", match: /máquina|maquina|pec deck|hack|prensa|hip thrust/i },
  { id: "polea", label: "Polea", match: /polea|jalón|jalon|cuerda|crunch en polea/i },
  { id: "mancuernas", label: "Mancuernas", match: /mancuerna/i },
  { id: "smith", label: "Smith", match: /smith/i },
  { id: "corporal", label: "Peso corporal", match: /colgado|dominada/i }
];

export function Codex() {
  const profile = useActiveProfile();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [equip, setEquip] = useState("");
  const [onlyFavs, setOnlyFavs] = useState(false);

  const codexPrefs = useLiveQuery(
    async () =>
      profile ? await db.codexPrefs.where("profileId").equals(profile.id).toArray() : [],
    [profile?.id]
  );
  const recentByExercise = useLiveQuery(async () => {
    if (!profile) return new Map<string, { at: number; variantId?: string }>();
    const map = new Map<string, { at: number; variantId?: string }>();
    const sets = await db.setLogs.where("profileId").equals(profile.id).toArray();
    for (const s of sets) {
      if (s.skipped) continue;
      const cur = map.get(s.exerciseId);
      if (!cur || s.createdAt > cur.at) {
        map.set(s.exerciseId, { at: s.createdAt, variantId: s.variantId });
      }
    }
    return map;
  }, [profile?.id]);

  const favorites = useMemo(
    () => new Set((codexPrefs ?? []).filter((p) => p.favorite).map((p) => p.exerciseId)),
    [codexPrefs]
  );

  const dayOf = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const d of DAYS) {
      for (const e of d.entries) {
        m.set(e.exerciseId, [...(m.get(e.exerciseId) ?? []), d.id]);
      }
    }
    return m;
  }, []);

  const normalize = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtered = CODEX.filter((c) => {
    if (query && !normalize(c.nombre).includes(normalize(query))) return false;
    if (group && !GROUPS.find((g) => g.id === group)!.match.test(c.musculos)) return false;
    if (dayFilter && !(dayOf.get(c.id) ?? []).includes(dayFilter)) return false;
    if (equip && !EQUIPMENT.find((e) => e.id === equip)!.match.test(c.nombre)) return false;
    if (onlyFavs && !favorites.has(c.id)) return false;
    return true;
  });

  return (
    <main className="screen">
      <div className="row" style={{ marginBottom: 16 }}>
        <PxSprite frames={[NAV_CODICE]} palette={PAL_C} scale={2} />
        <h1 className="screen-title" style={{ marginBottom: 0 }}>
          Códice
        </h1>
      </div>

      {/* Buscador y filtros */}
      <div className="stack stack--tight" style={{ marginBottom: 16 }}>
        <input
          type="search"
          className="search-input"
          placeholder="Buscar ejercicio…"
          aria-label="Buscar ejercicio por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-grid">
          <label className="filter-item">
            <span className="filter-item__label">Grupo</span>
            <div className="select-frame">
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">Todos</option>
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="filter-item">
            <span className="filter-item__label">Día</span>
            <div className="select-frame">
              <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                <option value="">Todos</option>
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="filter-item">
            <span className="filter-item__label">Equipo</span>
            <div className="select-frame">
              <select value={equip} onChange={(e) => setEquip(e.target.value)}>
                <option value="">Todo</option>
                {EQUIPMENT.map((e2) => (
                  <option key={e2.id} value={e2.id}>{e2.label}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="filter-item">
            <span className="filter-item__label">Favoritos</span>
            <button
              type="button"
              className={`toggle${onlyFavs ? " toggle--on" : ""}`}
              role="switch"
              aria-checked={onlyFavs}
              onClick={() => setOnlyFavs(!onlyFavs)}
            >
              <span className="toggle__state">
                {onlyFavs ? "ACTIVADO" : "DESACTIVADO"}
              </span>
            </button>
          </label>
        </div>
      </div>

      <div className="stack">
        <PixelFrame tight as="section">
          <h2 className="px-label px-label--gold" style={{ marginBottom: 4 }}>
            Ejercicios ({filtered.length})
          </h2>
          <div>
            {filtered.map((c) => {
              const recent = recentByExercise?.get(c.id);
              const recentVariant = recent?.variantId
                ? variantById(recent.variantId)?.nombre
                : null;
              return (
                <Link key={c.id} to={`/codice/${c.id}`} className="codex-item">
                  <div className="grow">
                    <div className="codex-item__name">
                      {favorites.has(c.id) && (
                        <PxSprite frames={[G_STAR]} palette={PAL_C} scale={1} label="Favorito" />
                      )}{" "}
                      {c.nombre}
                    </div>
                    <div className="codex-item__meta">
                      {c.musculos}
                      {recentVariant ? ` · última variante: ${recentVariant}` : ""}
                    </div>
                  </div>
                  <span className="codex-item__arrow" aria-hidden="true">›</span>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="small dim">Nada coincide con esos filtros.</p>
            )}
          </div>
        </PixelFrame>

        {/* Conocimiento general del manual */}
        <PixelFrame tight as="section">
          <h2 className="px-label px-label--gold" style={{ marginBottom: 8 }}>
            Saber de la Forja — reglas del manual
          </h2>
          <div className="stack stack--tight">
            {KNOWLEDGE.map((k) => (
              <details key={k.id} className="fold">
                <summary className="fold__head">
                  <span>{k.titulo}</span>
                </summary>
                <div className="fold__body">
                  <ul className="knowledge-list">
                    {k.puntos.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </PixelFrame>
      </div>
    </main>
  );
}

void codexById;
