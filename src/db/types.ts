// Entidades persistidas en IndexedDB (fuente primaria de verdad).
// Todo registro mutable lleva UUID estable, profileId, createdAt, updatedAt,
// localVersion y syncStatus, según docs/ARCHITECTURE.md.

export type SyncStatus = "local" | "pendiente" | "sincronizando" | "sincronizado" | "error";

export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  localVersion: number;
  syncStatus: SyncStatus;
}

export interface Profile extends BaseRecord {
  name: string;
  avatarId: "nahuel" | "carlos";
  scheduleId: string;
  weeklyTarget: number;
  xp: number;
  /** Lunes de la semana 1 de la campaña, como dateKey (YYYY-MM-DD). */
  campaignStart: string;
}

export type SessionStatus = "activa" | "completada" | "adaptada" | "abandonada";

export interface Session extends BaseRecord {
  profileId: string;
  dayId: string;
  /** Fecha local YYYY-MM-DD */
  dateKey: string;
  /** Semana de campaña 1..6 (puede superar 6 si el bloque se alarga) */
  week: number;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
  currentExerciseIndex: number;
  /** true si la sesión ocurrió en un día no previsto por el horario */
  unscheduled?: boolean;
  /** Resumen fijado al completar */
  summary?: {
    workingSets: number;
    exercisesProgressed: number;
    avgRir: number | null;
    xpGained: number;
    hitos: string[];
  };
}

export type SetSource = "normal" | "alternativa" | "adaptada";

export interface SetLog extends BaseRecord {
  profileId: string;
  sessionId: string;
  exerciseId: string;
  dayId: string;
  /** 1-based dentro del ejercicio */
  setNumber: number;
  weightKg: number;
  reps: number;
  /** 0..4; 4 representa "4+" */
  rir: number;
  source: SetSource;
  /** Ejercicio alternativo usado, si aplica */
  altExerciseId?: string;
  /** true si la serie se omitió (reps=0) con motivo */
  skipped?: boolean;
  skipReason?: string;
}

export type DiscomfortAction = "continuar" | "adaptar" | "detener";

export interface DiscomfortNote extends BaseRecord {
  profileId: string;
  sessionId: string;
  exerciseId: string;
  /** 0..10 */
  level: number;
  action: DiscomfortAction;
  note?: string;
}

/** Nota breve y opcional ligada a un ejercicio de una sesión. */
export interface SessionNote extends BaseRecord {
  profileId: string;
  sessionId: string;
  /** "" cuando la nota es de la sesión completa. */
  exerciseId: string;
  text: string;
}

export type GameEventType =
  | "serie"
  | "mision-completada"
  | "mision-adaptada"
  | "capitulo-completado"
  | "hito";

export interface GameEvent extends BaseRecord {
  profileId: string;
  type: GameEventType;
  xp: number;
  label: string;
  sessionId?: string;
  exerciseId?: string;
}

export interface Prefs extends BaseRecord {
  profileId: string;
  sonido: boolean;
  vibracion: boolean;
  animacionReducida: "sistema" | "reducida" | "completa";
  /** Incremento de carga configurable (kg) para compuestos y aislamientos */
  incrementoCompuesto: number;
  incrementoAislamiento: number;
}

export interface SyncOp extends BaseRecord {
  profileId: string;
  entity: string;
  entityId: string;
  op: "put" | "delete";
  payload: unknown;
  attempts: number;
  lastError?: string;
}

export interface KvEntry {
  key: string;
  value: unknown;
}

/** Estado del temporizador de descanso, persistido con timestamp absoluto. */
export interface TimerState {
  sessionId: string;
  exerciseId: string;
  exerciseIndex: number;
  nextSetNumber: number;
  totalSec: number;
  /** Fin previsto (epoch ms). Al volver del segundo plano se recalcula contra el reloj real. */
  targetEndAt: number;
  /** Si está en pausa, milisegundos restantes congelados. */
  pausedRemainingMs: number | null;
}
