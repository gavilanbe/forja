// Gamificación segura: se premia el registro honesto, la sesión prevista
// completada y la progresión legítima. Nunca el volumen extra, el RIR 0
// sistemático ni entrenar en días de descanso.

export const XP = {
  seriePrevista: 10,
  misionCompletada: 60,
  misionAdaptada: 60,
  /** Terminar con trabajo hecho pero sin plan cumplido ni adaptación explícita. */
  misionParcial: 25,
  capituloCompletado: 150,
  hito: 25
} as const;

export interface LevelInfo {
  level: number;
  titulo: string;
  currentXp: number;
  nextLevelXp: number;
  progress: number; // 0..1 dentro del nivel actual
}

const TITULOS = [
  "Recluta de la Forja",
  "Aprendiz de fragua",
  "Portamartillos",
  "Forjador",
  "Temple de acero",
  "Herrero de guerra",
  "Maestro forjador",
  "Guardián del yunque",
  "Señor de las brasas",
  "Leyenda de la Forja"
];

/** Coste creciente: nivel n requiere 120·n XP adicionales. Puramente cosmético. */
export const levelFromXp = (xp: number): LevelInfo => {
  let level = 1;
  let floor = 0;
  while (xp >= floor + level * 120 && level < 99) {
    floor += level * 120;
    level += 1;
  }
  const span = level * 120;
  return {
    level,
    titulo: TITULOS[Math.min(level - 1, TITULOS.length - 1)],
    currentXp: xp - floor,
    nextLevelXp: span,
    progress: Math.min(1, (xp - floor) / span)
  };
};
