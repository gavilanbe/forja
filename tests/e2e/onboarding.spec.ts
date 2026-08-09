// Primer inicio: selección de perfil, tutorial opcional y cambio de forjador.

import { expect, test } from "@playwright/test";
import { boot, completeOnboarding, setClock } from "./helpers";

test("primer inicio: elegir perfil y omitir tutorial lleva a Hoy", async ({
  page,
  context
}) => {
  await setClock(context, "2026-08-10");
  await page.goto("./", { waitUntil: "networkidle" });

  await expect(page.getByText("¿Quién entrena?")).toBeVisible();
  const continuar = page.getByRole("button", { name: "Continuar" });
  await expect(continuar).toBeDisabled();

  await completeOnboarding(page, "Nahuel");
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();
  await expect(page.getByText("Torso A").first()).toBeVisible();
});

test("tutorial de una pantalla: se puede ver y cerrar", async ({ page, context }) => {
  await setClock(context, "2026-08-10");
  await page.goto("./", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Avatar de Carlos/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Llama semanal")).toBeVisible();
  await page.getByRole("button", { name: "A la fragua" }).click();
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();
});

test("el onboarding no reaparece tras recargar", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("¿Quién entrena?")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();
});

test("cambio Nahuel → Carlos desde Perfil (sin sesión activa)", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10", "Nahuel");
  await page.goto("./#/perfil");
  await page.getByRole("button", { name: /Avatar de Carlos/ }).click();
  await expect(page.getByText(/Carlos entrena Torso A/)).toBeVisible();
  await page.goto("./#/");
  await expect(page.locator(".today-id__name")).toHaveText("Carlos");
  // Objetivo semanal de Carlos: 3
  await expect(page.getByText("0 de 3 misiones esta semana")).toBeVisible();
});
