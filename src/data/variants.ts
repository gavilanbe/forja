// Variantes de ejercicio como datos estructurados con ID estable.
// Cada variante conoce su ejercicio principal, tipo de carga, unidad y su
// relación con el Códice. El ID se deriva del nombre del manual de forma
// determinista (slug), lo que permite migrar los textos legados sin pérdida.

import { CODEX } from "./codex";
import type { LoadType } from "./load";

export interface VariantDef {
  /** ID estable, p. ej. "press-inclinado-smith-banco-20-30". */
  id: string;
  /** Ejercicio principal al que sustituye. */
  parentExerciseId: string;
  /** Nombre tal como aparece en el manual. */
  nombre: string;
  loadType: LoadType;
  unit: "kg" | "lb";
  /**
   * Entrada del Códice cuya técnica aplica. Si la variante coincide con otro
   * ejercicio del Códice se enlaza a él; si no, hereda la del principal.
   */
  codexId?: string;
}

/** Slug determinista: minúsculas, sin acentos, guiones. */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Cadenas del manual que son CONSEJOS de adaptación, no máquinas/variantes
 * seleccionables. Se muestran como consejo, nunca como variante con historial.
 */
const ADVICE_PREFIXES = ["si molesta", "ante dolor"];

export const isAdvice = (text: string): boolean => {
  const t = text.trim().toLowerCase();
  return ADVICE_PREFIXES.some((p) => t.startsWith(p));
};

/** Tipo de carga de variantes que no son carga externa clásica. */
const LOAD_OVERRIDES: Record<string, LoadType> = {
  [slugify("Dominada asistida con agarre neutro")]: "asistencia",
  [slugify("Dominada asistida")]: "asistencia",
  [slugify("Máquina de fondos asistida")]: "asistencia",
  [slugify("Pasos laterales con banda como alternativa de menor carga")]: "corporal",
  [slugify("Elevación de rodillas en silla romana")]: "corporal",
  [slugify("Reverse crunch en banco")]: "corporal",
  [slugify("Spanish squat isométrico si lo ha pautado un profesional")]: "corporal"
};

/** Variantes cuyo nombre coincide con otra entrada del Códice. */
const CODEX_LINKS: Record<string, string> = {
  [slugify("Press inclinado convergente en máquina")]: "press-inclinado-maquina",
  [slugify("Press inclinado con mancuernas")]: "press-inclinado-mancuernas",
  [slugify("Press inclinado en Smith")]: "press-banca-smith",
  [slugify("Press banca en Smith")]: "press-banca-smith",
  [slugify("Curl femoral tumbado")]: "curl-femoral-tumbado",
  [slugify("Curl femoral sentado")]: "curl-femoral-sentado",
  [slugify("Hack squat con pies algo más altos")]: "hack-squat",
  [slugify("Jalón neutro o unilateral")]: "jalon-neutro",
  [slugify("Hip thrust con barra")]: "hip-thrust-maquina",
  [slugify("Prensa horizontal")]: "prensa-45",
  [slugify("Extensión unilateral")]: "extension-cuadriceps",
  [slugify("Elevación lateral unilateral en polea")]: "elevacion-lateral-unilateral-polea",
  [slugify("Elevación lateral en máquina")]: "elevacion-lateral-polea-maquina",
  [slugify("Pec deck")]: "apertura-polea",
  [slugify("Extensión bilateral con cuerda")]: "extension-triceps-polea-cuerda",
  [slugify("Curl martillo con mancuernas")]: "curl-martillo-cuerda"
};

const buildRegistry = (): VariantDef[] => {
  const defs: VariantDef[] = [];
  const seen = new Set<string>();
  for (const entry of CODEX) {
    for (const alt of entry.alternativas) {
      if (isAdvice(alt)) continue;
      const slug = slugify(alt);
      // El mismo nombre bajo dos ejercicios padres produce variantes distintas
      // (historiales de carga NO comparables entre máquinas diferentes).
      const id = `${entry.id}--${slug}`;
      if (seen.has(id)) continue;
      seen.add(id);
      defs.push({
        id,
        parentExerciseId: entry.id,
        nombre: alt,
        loadType: LOAD_OVERRIDES[slug] ?? "externa",
        unit: "kg",
        codexId: CODEX_LINKS[slug]
      });
    }
  }
  return defs;
};

export const VARIANTS: VariantDef[] = buildRegistry();

const byId = new Map(VARIANTS.map((v) => [v.id, v]));

export const variantById = (id: string | undefined): VariantDef | undefined =>
  id ? byId.get(id) : undefined;

export const variantsOf = (exerciseId: string): VariantDef[] =>
  VARIANTS.filter((v) => v.parentExerciseId === exerciseId);

/** Consejos de adaptación (no variantes) de un ejercicio. */
export const adviceOf = (exerciseId: string): string[] =>
  CODEX.find((e) => e.id === exerciseId)?.alternativas.filter(isAdvice) ?? [];

/**
 * Migración: resuelve un texto legado de alternativa (altExerciseId de v2)
 * a su variantId estable. Devuelve undefined si no hay correspondencia.
 */
export const variantIdFromLegacyText = (
  exerciseId: string,
  legacyText: string | undefined
): string | undefined => {
  if (!legacyText) return undefined;
  const direct = byId.get(`${exerciseId}--${slugify(legacyText)}`);
  if (direct) return direct.id;
  // Búsqueda laxa por nombre dentro del mismo ejercicio padre.
  const loose = variantsOf(exerciseId).find(
    (v) => slugify(v.nombre) === slugify(legacyText)
  );
  return loose?.id;
};

/** Nombre para mostrar de una serie: variante si existe, si no el principal. */
export const variantDisplayName = (
  variantId: string | undefined,
  fallback: string
): string => variantById(variantId)?.nombre ?? fallback;
