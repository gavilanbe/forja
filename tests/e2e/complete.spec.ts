// Finalización: recompensa visual, misión adaptada en positivo y XP.

import { expect, test } from "@playwright/test";
import { boot, logSet } from "./helpers";

const finishNow = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: "Salir de la misión" }).click();
  await page.getByRole("button", { name: "Terminar misión ahora" }).click();
  await page.getByRole("button", { name: "Sellar la misión" }).click();
};

test("finalización normal: sello, camino semanal y XP", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();
  await finishNow(page);

  await expect(page.getByText("Misión completada")).toBeVisible();
  await expect(page.getByLabel("Sello de misión completada")).toBeVisible();
  await expect(page.getByText("series de trabajo")).toBeVisible();
  await expect(page.getByText("+60")).toBeVisible();
  // Camino semanal actualizado: el lunes queda forjado
  await expect(page.locator(".path__node--done")).toHaveCount(1);
  await page.getByRole("button", { name: "Volver a la Forja" }).click();
  await expect(page.getByText("Misión completada")).toBeVisible();
});

test("finalización adaptada: tono positivo, nunca premio inferior", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();

  // Molestia media → adaptar
  await page.getByRole("button", { name: "Molestia / dolor" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Seguir con menos carga o rango" })
    .click();
  await finishNow(page);

  await expect(page.getByText("Misión adaptada")).toBeVisible();
  await expect(page.getByLabel("Sello de misión adaptada")).toBeVisible();
  await expect(page.getByText(/Adaptar con cabeza también forja/)).toBeVisible();
  // La adaptada también da su XP de misión
  await expect(page.getByText("+60")).toBeVisible();
});

test("misión extra: +0 XP explicado en positivo", async ({ page, context }) => {
  await boot(page, context, "2026-08-10", "Carlos");
  // Miércoles: descanso de Carlos → unirse a la sesión de Nahuel no existe (X);
  // jueves sí: Empuje como día extra.
  await page.evaluate(() => localStorage.setItem("forja:now", "2026-08-13"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Unirse a Empuje con Nahuel/ }).click();
  await logSet(page, "30");
  await page.getByRole("button", { name: "Saltar" }).click();
  await finishNow(page);

  await expect(page.getByText("Misión extra")).toBeVisible();
  await expect(page.getByText("+0")).toBeVisible();
  await expect(page.getByText(/No da XP ni hacía falta para la Llama/)).toBeVisible();
});
