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

/** Completa el onboarding eligiendo un forjador (omitiendo el tutorial). */
export const completeOnboarding = async (
  page: Page,
  who: "Nahuel" | "Carlos" = "Nahuel"
) => {
  await page.getByRole("button", { name: new RegExp(`Avatar de ${who}`) }).click();
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
  who: "Nahuel" | "Carlos" = "Nahuel"
) => {
  await setClock(context, dateKey);
  await page.goto("./", { waitUntil: "networkidle" });
  await completeOnboarding(page, who);
};

/** Registra una serie válida (rellena el peso si hace falta) y entra al descanso. */
export const logSet = async (page: Page, weight = "40") => {
  const weightInput = page.locator(".numctl__value").first();
  if ((await weightInput.inputValue()) === "") await weightInput.fill(weight);
  await page.getByRole("button", { name: "Guardar serie" }).click();
};
