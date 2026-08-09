// Reloj inyectable. Toda la app pregunta la fecha aquí, nunca a `new Date()`
// directamente, para que las pruebas E2E y las capturas puedan fijar un día
// concreto (lunes, domingo, prólogo, post-campaña) de forma determinista.
//
// La anulación vive en localStorage bajo `forja:now` como "YYYY-MM-DD" o
// "YYYY-MM-DDTHH:mm". Sin esa clave, el reloj es el del dispositivo.

const OVERRIDE_KEY = "forja:now";

const readOverride = (): Date | null => {
  try {
    const raw =
      typeof localStorage !== "undefined" ? localStorage.getItem(OVERRIDE_KEY) : null;
    if (!raw) return null;
    const [datePart, timePart] = raw.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return null;
    let hh = 12;
    let mm = 0;
    if (timePart) {
      const [h, min] = timePart.split(":").map(Number);
      if (Number.isFinite(h)) hh = h;
      if (Number.isFinite(min)) mm = min;
    }
    const date = new Date(y, m - 1, d, hh, mm, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/** Fecha "actual" de la app; respeta la anulación de pruebas si existe. */
export const forjaNow = (): Date => readOverride() ?? new Date();

/** ¿Hay una fecha forzada activa? (solo pruebas/QA) */
export const clockOverridden = (): boolean => readOverride() !== null;
