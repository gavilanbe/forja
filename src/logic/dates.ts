// Fechas locales. La semana de FORJA empieza en lunes (índice 0)
// para alinearse con el horario del manual.

export const dateKeyOf = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** 0 = lunes … 6 = domingo */
export const weekdayIndex = (d: Date): number => (d.getDay() + 6) % 7;

/** Lunes de la semana de `d`, a medianoche local. */
export const mondayOf = (d: Date): Date => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - weekdayIndex(m));
  return m;
};

export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Semana de campaña (1-based) para una fecha, dada la fecha de inicio (lunes). */
export const campaignWeekOf = (campaignStart: string, d: Date): number => {
  const start = parseDateKey(campaignStart);
  const diffDays = Math.floor(
    (mondayOf(d).getTime() - start.getTime()) / 86_400_000
  );
  return Math.floor(diffDays / 7) + 1;
};

/** dateKey del lunes de la semana `week` (1-based) de la campaña. */
export const weekStartKey = (campaignStart: string, week: number): string =>
  dateKeyOf(addDays(parseDateKey(campaignStart), (week - 1) * 7));

export const WEEKDAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
export const WEEKDAY_LONG = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo"
];

export const formatDateShort = (d: Date): string =>
  `${WEEKDAY_LONG[weekdayIndex(d)]} ${d.getDate()}`;
