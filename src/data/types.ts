// Tipos del dominio de rutina. La rutina se modela como datos editables
// (ver ROUTINE.md); nunca como texto incrustado en pantallas.

export interface RirRange {
  min: number;
  max: number;
}

export interface SetPrescription {
  /** RIR objetivo de esta serie, p. ej. {min:1,max:2} para "1-2" */
  rir: RirRange;
}

export interface ExercisePrescription {
  exerciseId: string;
  /** Número de series de trabajo. Si perSide, son series POR LADO. */
  sets: number;
  perSide?: "lado" | "brazo" | "pierna";
  repMin: number;
  repMax: number;
  /** Una entrada por serie, en orden. */
  rirPerSet: SetPrescription[];
  restMinSec: number;
  restMaxSec: number;
  /** P. ej. "tras ambos brazos" */
  restNote?: string;
  /** Nota de prescripción, p. ej. "usa menos carga que el Día 2" */
  note?: string;
}

export interface WorkoutDay {
  id: string;
  /** "Torso A", "Pierna A"… */
  name: string;
  /** Objetivo del día según el manual */
  focus: string;
  durationMin: number;
  durationMax: number;
  entries: ExercisePrescription[];
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = lunes … 6 = domingo

export interface Schedule {
  id: string;
  /** dayId por día de la semana; null = descanso/campamento */
  week: (string | null)[];
  weeklyTarget: number;
}

export interface CodexEntry {
  id: string;
  nombre: string;
  /** Grupos musculares principales */
  musculos: string;
  porQue: string;
  colocacion: string[];
  ejecucion: string[];
  errores: string[];
  alternativas: string[];
}
