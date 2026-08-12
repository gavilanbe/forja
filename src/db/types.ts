// Entidades persistidas en IndexedDB (fuente primaria de verdad).
// Todo registro mutable lleva UUID estable, profileId, createdAt, updatedAt,
// localVersion y syncStatus, según docs/ARCHITECTURE.md.
//
// Regla de oro de la gamificación (v3): la XP es un LIBRO MAYOR. Cada
// recompensa es un GameEvent con un dedupeKey único por perfil; profile.xp
// se deriva siempre de la suma de eventos. Nada concede XP dos veces.

export type SyncStatus = "local" | "pendiente" | "sincronizando" | "sincronizado" | "error";

export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  localVersion: number;
  syncStatus: SyncStatus;
}

// ── Apariencia y accesibilidad por perfil ───────────────────────────────────

export interface Appearance {
  skinTone: string;
  hair: string;
  outfit: string;
  armor: string;
  aura: string;
  frame: string;
  namePlate: string;
  theme: string;
}

export interface AccessibilityPrefs {
  /** Tamaño base del texto: normal | grande | enorme */
  textSize: "normal" | "grande" | "enorme";
  highContrast: boolean;
}

export interface Profile extends BaseRecord {
  name: string;
  avatarId: "nahuel" | "carlos";
  scheduleId: string;
  weeklyTarget: number;
  /** XP derivada del libro mayor de gameEvents. Nunca se muta a mano. */
  xp: number;
  /** Lunes de la semana 1 de la campaña ACTIVA (espejo de campaigns). */
  campaignStart: string;
  appearance?: Appearance;
  accessibility?: AccessibilityPrefs;
}

// ── Campañas como entidades ─────────────────────────────────────────────────

export type CampaignStatus = "activa" | "archivada";

export interface Campaign extends BaseRecord {
  profileId: string;
  /** Lunes (dateKey) de la semana 1. */
  startKey: string;
  /**
   * Fecha real de incorporación (dateKey). Los días de la campaña anteriores
   * a esta fecha nunca se marcan como misiones perdidas y no cuentan para el
   * objetivo efectivo de esa semana.
   */
  joinedKey: string;
  routineVersion: string;
  scheduleId: string;
  weeklyTarget: number;
  weeksTotal: number;
  status: CampaignStatus;
  /** Momento de archivado, si status === "archivada". */
  endedAt?: number;
}

// ── Sesiones ────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "activa"
  | "completada"
  | "adaptada"
  | "parcial"
  | "abandonada";

/** Qué se omitió o modificó en una sesión adaptada/parcial, y por qué. */
export interface Adaptation {
  exerciseId: string;
  tipo: "serie-omitida" | "ejercicio-detenido" | "variante" | "carga-reducida" | "otro";
  detalle: string;
}

export interface SessionSummary {
  workingSets: number;
  /** Series prescritas totales del día (según el snapshot). */
  prescribedSets: number;
  exercisesProgressed: number;
  avgRir: number | null;
  xpGained: number;
  hitos: string[];
  adaptaciones: Adaptation[];
}

export interface Session extends BaseRecord {
  profileId: string;
  campaignId?: string;
  dayId: string;
  /** Fecha local YYYY-MM-DD */
  dateKey: string;
  /** Semana de campaña 1..N (puede superar N si el bloque se alarga) */
  week: number;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
  currentExerciseIndex: number;
  /** true si la sesión ocurrió en un día no previsto por el horario */
  unscheduled?: boolean;
  /**
   * Copia inmutable de la prescripción con la que se realizó la sesión.
   * Editar la rutina después no reescribe la historia.
   */
  prescriptionSnapshot?: {
    dayName: string;
    routineVersion: string;
    entries: import("../data/types").ExercisePrescription[];
  };
  /** Resumen fijado al sellar la sesión */
  summary?: SessionSummary;
}

// ── Series ──────────────────────────────────────────────────────────────────

export type SetSource = "normal" | "alternativa" | "adaptada";

export interface SetLog extends BaseRecord {
  profileId: string;
  sessionId: string;
  campaignId?: string;
  exerciseId: string;
  /** Variante realmente utilizada; ausente = ejercicio principal. */
  variantId?: string;
  dayId: string;
  /** 1-based dentro del ejercicio */
  setNumber: number;
  weightKg: number;
  reps: number;
  /** 0..4; 4 representa "4+" */
  rir: number;
  source: SetSource;
  /** Lado, si el ejercicio se registra por lado: izq/der. */
  side?: "izq" | "der";
  /** Ejercicio alternativo usado (texto legado, se conserva). */
  altExerciseId?: string;
  /** true si la serie se omitió (reps=0) con motivo */
  skipped?: boolean;
  skipReason?: string;
}

// ── Molestias e incidencias ─────────────────────────────────────────────────

export type DiscomfortAction = "continuar" | "adaptar" | "detener";

/** Ciclo de vida de una incidencia: activa → en seguimiento → resuelta. */
export type IncidentStatus = "activa" | "seguimiento" | "resuelta";

export interface DiscomfortNote extends BaseRecord {
  profileId: string;
  sessionId: string;
  exerciseId: string;
  variantId?: string;
  /** 0..10 */
  level: number;
  action: DiscomfortAction;
  note?: string;
  /** Estado de la incidencia; las notas antiguas migran según su historial. */
  incidentStatus?: IncidentStatus;
}

/** Nota breve y opcional ligada a un ejercicio de una sesión. */
export interface SessionNote extends BaseRecord {
  profileId: string;
  sessionId: string;
  /** "" cuando la nota es de la sesión completa. */
  exerciseId: string;
  text: string;
}

// ── Eventos de juego (libro mayor de XP) ────────────────────────────────────

export type GameEventType =
  | "serie"
  | "mision-completada"
  | "mision-adaptada"
  | "mision-parcial"
  | "capitulo-completado"
  | "hito"
  | "cosmetico";

export interface GameEvent extends BaseRecord {
  profileId: string;
  campaignId?: string;
  type: GameEventType;
  xp: number;
  label: string;
  /**
   * Identidad lógica de la recompensa. Índice único por perfil: la misma
   * recompensa jamás se concede dos veces (doble toque, recarga, reinicio).
   */
  dedupeKey: string;
  sessionId?: string;
  exerciseId?: string;
}

// ── Preferencias ────────────────────────────────────────────────────────────

export interface Prefs extends BaseRecord {
  profileId: string;
  sonido: boolean;
  vibracion: boolean;
  animacionReducida: "sistema" | "reducida" | "completa";
  /** Incremento de carga configurable (kg) para compuestos y aislamientos */
  incrementoCompuesto: number;
  incrementoAislamiento: number;
  /** Mantener la pantalla encendida durante el descanso (Wake Lock). */
  wakeLock?: boolean;
  /** Notificación local al terminar el descanso (si hay permiso). */
  notificacionDescanso?: boolean;
  /** Modo compacto de registro para el gimnasio. */
  modoCompacto?: boolean;
  /** Último recordatorio de copia de seguridad mostrado (epoch ms). */
  backupReminderAt?: number;
}

// ── MI GIMNASIO: equipamiento real por ejercicio/variante ───────────────────

export type WeightUnit = "kg" | "lb";

export interface GymSetting extends BaseRecord {
  profileId: string;
  exerciseId: string;
  /** Ausente = configuración del ejercicio principal. */
  variantId?: string;
  machineName?: string;
  seatPosition?: string;
  backPosition?: string;
  pulleyHeight?: string;
  gripAccessory?: string;
  /** Incremento mínimo real de la máquina/mancuernas (kg). */
  minIncrementKg?: number;
  /** Peso de la barra si aplica (kg). */
  barWeightKg?: number;
  /** Escala real de placas, p. ej. [5, 10, 15, 20...] (kg). */
  plateScaleKg?: number[];
  favoriteVariantId?: string;
  setupNotes?: string;
  unit?: WeightUnit;
  /** Registrar cada lado por separado en unilaterales. */
  perSideTracking?: boolean;
}

// ── Rutinas personalizadas ──────────────────────────────────────────────────

export interface CustomRoutine extends BaseRecord {
  profileId: string;
  /** Plantilla de origen (protegida), p. ej. "nahuel-5". */
  baseScheduleId: string;
  name: string;
  /** Días editados; los no presentes usan la plantilla. */
  days: import("../data/types").WorkoutDay[];
  /** Horario semanal editado (dayId | null por día, lunes=0). */
  week: (string | null)[];
  weeklyTarget: number;
  active: boolean;
}

// ── Calendario: excepciones semanales ───────────────────────────────────────

export type CalendarOverrideType =
  | "mover"      // misión movida a otro día de la misma semana
  | "ausencia"   // viaje, enfermedad u otra ausencia justificada
  | "descarga"   // semana de descarga (volumen reducido a propósito)
  | "posponer";  // la semana entera se pospone

export interface CalendarOverride extends BaseRecord {
  profileId: string;
  campaignId: string;
  /** Lunes (dateKey) de la semana afectada. */
  weekStartKey: string;
  type: CalendarOverrideType;
  /** mover: día original (0..6) y destino (0..6) del dayId. */
  fromWeekday?: number;
  toWeekday?: number;
  dayId?: string;
  /** ausencia: días concretos (0..6) que no cuentan para el objetivo. */
  weekdays?: number[];
  /** descarga: factor de series planificadas (p. ej. 0.5). */
  volumeFactor?: number;
  reason?: string;
}

// ── Códice: datos del usuario por ejercicio ─────────────────────────────────

export interface CodexPref extends BaseRecord {
  profileId: string;
  exerciseId: string;
  favorite: boolean;
  personalNote?: string;
}

// ── Cosméticos desbloqueados ────────────────────────────────────────────────

export interface Unlock extends BaseRecord {
  profileId: string;
  itemId: string;
  /** Identidad del desbloqueo; único por perfil. */
  dedupeKey: string;
}

// ── Sincronización y varios ─────────────────────────────────────────────────

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
