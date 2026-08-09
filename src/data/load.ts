// Tipo de carga por ejercicio. Decide qué significa "0 kg" al registrar:
// en carga externa es un olvido (se bloquea); en peso corporal es la carga
// real (lastre opcional); en asistencia el número resta ayuda de la máquina.

export type LoadType = "externa" | "corporal" | "asistencia";

const EXCEPTIONS: Record<string, LoadType> = {
  "elevacion-rodillas-colgado": "corporal"
};

export const loadTypeOf = (exerciseId: string): LoadType =>
  EXCEPTIONS[exerciseId] ?? "externa";

/** ¿Es válido guardar este peso para este ejercicio? */
export const weightValid = (exerciseId: string, weightKg: number | null): boolean => {
  if (weightKg === null || Number.isNaN(weightKg)) return false;
  if (weightKg < 0) return false;
  if (weightKg === 0 && loadTypeOf(exerciseId) === "externa") return false;
  return true;
};

/** Punto medio del rango de repeticiones, para primeras sesiones sin historial. */
export const midReps = (repMin: number, repMax: number): number =>
  Math.round((repMin + repMax) / 2);
