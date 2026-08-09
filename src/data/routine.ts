// Rutina estructurada según docs/ROUTINE.md y el manual de referencia.
// Fuente: Manual de hipertrofia — Nahuel y Carlos, v1.0 (agosto 2026).

import type { Schedule, WorkoutDay } from "./types";

export const ROUTINE_VERSION = "1.0.0";

const rir = (min: number, max = min) => ({ rir: { min, max } });

export const DAYS: WorkoutDay[] = [
  {
    id: "torso-a",
    name: "Torso A",
    focus: "Pecho y espalda con prioridad equilibrada; deltoide lateral y brazos al final",
    durationMin: 85,
    durationMax: 105,
    entries: [
      {
        exerciseId: "press-inclinado-maquina",
        sets: 4, repMin: 6, repMax: 10,
        rirPerSet: [rir(2), rir(2), rir(1), rir(1)],
        restMinSec: 180, restMaxSec: 180
      },
      {
        exerciseId: "remo-pecho-apoyado",
        sets: 3, repMin: 6, repMax: 10,
        rirPerSet: [rir(2), rir(1, 2), rir(1)],
        restMinSec: 150, restMaxSec: 180
      },
      {
        exerciseId: "press-horizontal-maquina",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1)],
        restMinSec: 120, restMaxSec: 150
      },
      {
        exerciseId: "jalon-neutro",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1, 2), rir(1)],
        restMinSec: 120, restMaxSec: 150
      },
      {
        exerciseId: "elevacion-lateral-unilateral-polea",
        sets: 5, perSide: "lado", repMin: 12, repMax: 20,
        rirPerSet: [rir(2), rir(1, 2), rir(1), rir(1), rir(0, 1)],
        restMinSec: 60, restMaxSec: 75,
        restNote: "tras ambos brazos"
      },
      {
        exerciseId: "curl-predicador-maquina",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "extension-triceps-cabeza-cuerda",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      }
    ]
  },
  {
    id: "pierna-a",
    name: "Pierna A",
    focus: "Cuádriceps con patrones estables; femoral, glúteo medio, gemelo y core",
    durationMin: 90,
    durationMax: 110,
    entries: [
      {
        exerciseId: "hack-squat",
        sets: 4, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(2), rir(1), rir(1)],
        restMinSec: 180, restMaxSec: 180
      },
      {
        exerciseId: "prensa-45",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1, 2), rir(1)],
        restMinSec: 150, restMaxSec: 150
      },
      {
        exerciseId: "extension-cuadriceps",
        sets: 3, repMin: 12, repMax: 18,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "curl-femoral-sentado",
        sets: 4, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(2), rir(1), rir(0, 1)],
        restMinSec: 120, restMaxSec: 120
      },
      {
        exerciseId: "abduccion-cadera",
        sets: 3, repMin: 12, repMax: 20,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 75, restMaxSec: 90
      },
      {
        exerciseId: "gemelo-pie",
        sets: 4, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "crunch-polea",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90
      }
    ]
  },
  {
    id: "empuje",
    name: "Empuje",
    focus: "Segundo estímulo de pecho; hombro y tríceps con énfasis de culturismo",
    durationMin: 80,
    durationMax: 100,
    entries: [
      {
        exerciseId: "press-banca-smith",
        sets: 4, repMin: 6, repMax: 10,
        rirPerSet: [rir(2), rir(2), rir(1), rir(1)],
        restMinSec: 180, restMaxSec: 180
      },
      {
        exerciseId: "press-inclinado-mancuernas",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1, 2), rir(1)],
        restMinSec: 150, restMaxSec: 150
      },
      {
        exerciseId: "apertura-polea",
        sets: 2, repMin: 12, repMax: 20,
        rirPerSet: [rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90
      },
      {
        exerciseId: "press-hombro-maquina",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1)],
        restMinSec: 120, restMaxSec: 150
      },
      {
        exerciseId: "elevacion-lateral-polea-maquina",
        sets: 5, repMin: 12, repMax: 20,
        rirPerSet: [rir(2), rir(1, 2), rir(1), rir(1), rir(0, 1)],
        restMinSec: 75, restMaxSec: 90
      },
      {
        exerciseId: "extension-triceps-polea-cuerda",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "extension-triceps-cabeza-unilateral",
        sets: 2, perSide: "brazo", repMin: 12, repMax: 15,
        rirPerSet: [rir(1), rir(0, 1)],
        restMinSec: 60, restMaxSec: 75,
        restNote: "tras ambos brazos"
      }
    ]
  },
  {
    id: "tiron",
    name: "Tirón",
    focus: "Dorsal y espalda alta; deltoide posterior y bíceps",
    durationMin: 75,
    durationMax: 95,
    entries: [
      {
        exerciseId: "jalon-pecho-medio",
        sets: 4, repMin: 6, repMax: 10,
        rirPerSet: [rir(2), rir(2), rir(1), rir(1)],
        restMinSec: 150, restMaxSec: 180
      },
      {
        exerciseId: "remo-unilateral-polea",
        sets: 3, perSide: "lado", repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1)],
        restMinSec: 90, restMaxSec: 90,
        restNote: "tras ambos lados"
      },
      {
        exerciseId: "remo-alto-pecho-apoyado",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 120, restMaxSec: 120
      },
      {
        exerciseId: "reverse-pec-deck",
        sets: 4, repMin: 12, repMax: 20,
        rirPerSet: [rir(2), rir(1), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90
      },
      {
        exerciseId: "curl-inclinado-mancuernas",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "curl-martillo-cuerda",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90
      }
    ]
  },
  {
    id: "pierna-b",
    name: "Pierna B",
    focus: "Femoral y glúteo; segundo estímulo de cuádriceps, gemelo y core",
    durationMin: 90,
    durationMax: 110,
    entries: [
      {
        exerciseId: "rumano-smith",
        sets: 4, repMin: 6, repMax: 10,
        rirPerSet: [rir(2), rir(2), rir(1), rir(1)],
        restMinSec: 180, restMaxSec: 180
      },
      {
        exerciseId: "hip-thrust-maquina",
        sets: 3, repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1)],
        restMinSec: 150, restMaxSec: 150
      },
      {
        exerciseId: "curl-femoral-tumbado",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 120, restMaxSec: 120
      },
      {
        exerciseId: "bulgara-smith",
        sets: 3, perSide: "pierna", repMin: 8, repMax: 12,
        rirPerSet: [rir(2), rir(1), rir(1)],
        restMinSec: 120, restMaxSec: 120,
        restNote: "tras ambas piernas"
      },
      {
        exerciseId: "extension-cuadriceps",
        sets: 2, repMin: 15, repMax: 20,
        rirPerSet: [rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90,
        note: "Usa menos carga que el Día 2: cierra el estímulo, no busques un récord."
      },
      {
        exerciseId: "gemelo-sentado",
        sets: 4, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 120
      },
      {
        exerciseId: "elevacion-rodillas-colgado",
        sets: 3, repMin: 10, repMax: 15,
        rirPerSet: [rir(2), rir(1), rir(0, 1)],
        restMinSec: 90, restMaxSec: 90
      }
    ]
  }
];

export const dayById = (id: string): WorkoutDay | undefined =>
  DAYS.find((d) => d.id === id);

// Semana: índice 0 = lunes … 6 = domingo. null = campamento (descanso).
export const SCHEDULES: Schedule[] = [
  {
    id: "nahuel-5",
    week: ["torso-a", "pierna-a", null, "empuje", "tiron", "pierna-b", null],
    weeklyTarget: 5
  },
  {
    id: "carlos-3",
    week: ["torso-a", "pierna-a", null, null, "tiron", null, null],
    weeklyTarget: 3
  }
];

export const scheduleById = (id: string): Schedule =>
  SCHEDULES.find((s) => s.id === id) ?? SCHEDULES[0];

export const CAMPAIGN_WEEKS = 6;

/** Nombres de capítulo de la campaña (semana 1..6). */
export const CHAPTERS = [
  { week: 1, title: "El primer fuego", detail: "Semana conservadora: calibrar cargas y técnica" },
  { week: 2, title: "Acero templado", detail: "Progresión: sumar repeticiones dentro del rango" },
  { week: 3, title: "El martillo cae", detail: "Progresión: primeras subidas de carga" },
  { week: 4, title: "Brasas vivas", detail: "Progresión: consolidar cargas nuevas" },
  { week: 5, title: "Forja profunda", detail: "Progresión: última semana de carga del bloque" },
  { week: 6, title: "La prueba del temple", detail: "Checkpoint: evaluación honesta, sin máximos obligatorios" }
];
