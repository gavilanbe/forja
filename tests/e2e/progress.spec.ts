// Progreso: autoselección de ejercicio con datos y estado vacío con acción.

import { expect, test } from "@playwright/test";
import { boot, logSet } from "./helpers";

test("estado vacío: acción real para volver a la misión", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await page.goto("./#/progreso");
  await expect(page.getByText("Historial vacío")).toBeVisible();
  await page.getByRole("button", { name: "Ir a la misión de hoy" }).click();
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();
});

test("con datos: selecciona automáticamente el ejercicio usado más recientemente", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.getByRole("button", { name: "Salir de la misión" }).click();
  await page.getByRole("button", { name: "Terminar misión ahora" }).click();
  await page.getByRole("button", { name: "Sellar la misión" }).click();
  await page.getByRole("button", { name: "Volver a la Forja" }).click();

  await page.goto("./#/progreso");
  const select = page.getByLabel("Elegir ejercicio");
  await expect(select).toHaveValue("press-inclinado-maquina");
  // La opción seleccionada jamás está deshabilitada
  const disabled = await select
    .locator("option:checked")
    .first()
    .getAttribute("disabled");
  expect(disabled).toBeNull();
  await expect(page.getByText(/Esta semana/)).toBeVisible();

  // La selección sobrevive a salir y volver
  await page.goto("./#/");
  await page.goto("./#/progreso");
  await expect(select).toHaveValue("press-inclinado-maquina");
});
