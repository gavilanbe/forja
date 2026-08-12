// Utilidades E2E: reloj determinista y arranque con onboarding resuelto.

import type { BrowserContext, Page } from "@playwright/test";

export const setClock = async (context: BrowserContext, dateKey: string) => {
  await context.addInitScript((n) => {
    if (!localStorage.getItem("forja:now")) localStorage.setItem("forja:now", n);
  }, dateKey);
};

export const changeClock = async (page: Page, dateKey: string) => {
  await page.evaluate((n) => localStorage.setItem("forja:now", n), dateKey);
};

/** Completa el onboarding eligiendo forjador y fecha (omitiendo el tutorial). */
export const completeOnboarding = async (
  page: Page,
  who: "Nahuel" | "Carlos" = "Nahuel",
  start: "hoy" | "lunes" = "hoy"
) => {
  await page.getByRole("button", { name: new RegExp(`Avatar de ${who}`) }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  // Paso de fecha de inicio: hoy / próximo lunes / manual.
  await page
    .getByRole("radio", {
      name: start === "hoy" ? /Empezar hoy/ : /Empezar el próximo lunes/
    })
    .click();
  await page.getByRole("button", { name: "Omitir el tutorial" }).click();
  // Espera a que Hoy renderice: garantiza que el flag de onboarding y el
  // perfil activo ya están escritos en IndexedDB antes de cualquier reload.
  await page.locator(".today-id__name").waitFor();
};

/** Arranque estándar: reloj fijado, primera carga y onboarding hecho. */
export const boot = async (
  page: Page,
  context: BrowserContext,
  dateKey: string,
  who: "Nahuel" | "Carlos" = "Nahuel",
  start: "hoy" | "lunes" = "hoy"
) => {
  await setClock(context, dateKey);
  await page.goto("./", { waitUntil: "networkidle" });
  await completeOnboarding(page, who, start);
};

/** Registra una serie válida (rellena el peso si hace falta) y entra al descanso. */
export const logSet = async (page: Page, weight = "40") => {
  const weightInput = page.locator(".numctl__value").first();
  if ((await weightInput.inputValue()) === "") await weightInput.fill(weight);
  await page.getByRole("button", { name: "Guardar serie" }).click();
};

/**
 * Completa TODAS las series prescritas de la misión activa, etapa a etapa,
 * hasta dejar visible el botón «Terminar misión» de la última etapa.
 */
export const completeAllStages = async (page: Page, weight = "40") => {
  // Los botones cambian de etiqueta en caliente (Saltar → Empezar serie
  // cuando el temporizador llega a cero): cada clic tolera la transición y
  // el bucle simplemente reintenta con el estado real de la pantalla.
  const tryClick = async (locator: ReturnType<Page["getByRole"]>) => {
    try {
      await locator.click({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  };
  for (let guard = 0; guard < 200; guard++) {
    const save = page.getByRole("button", { name: "Guardar serie" });
    const restPrimary = page.getByRole("button", {
      name: /^(Saltar|Empezar serie|Continuar)$/
    });
    const next = page.getByRole("button", { name: "Siguiente etapa" });
    const finish = page.getByRole("button", { name: "Terminar misión", exact: true });
    if (await finish.isVisible().catch(() => false)) return;
    if (await next.isVisible().catch(() => false)) {
      if (await tryClick(next)) continue;
    }
    if (await restPrimary.isVisible().catch(() => false)) {
      if (await tryClick(restPrimary)) continue;
    }
    if (await save.isVisible().catch(() => false)) {
      const weightInput = page.locator(".numctl__value").first();
      try {
        // Timeouts cortos: si la fase cambia entre la comprobación y la
        // lectura, se reintenta con el estado real (sin heredar el timeout
        // global del test, que congelaría el bucle).
        if ((await weightInput.inputValue({ timeout: 1000 })) === "") {
          await weightInput.fill(weight, { timeout: 1000 });
        }
      } catch {
        continue;
      }
      await tryClick(save);
      continue;
    }
    await page.waitForTimeout(150);
  }
  throw new Error("completeAllStages: la misión no llegó a la última etapa");
};
