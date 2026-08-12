// Corrección de series: deshacer desde el descanso, editar y eliminar con
// confirmación, todo local-first y sin duplicar XP.

import { expect, test } from "@playwright/test";
import { boot, logSet } from "./helpers";

const startMission = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await expect(page.getByText("Press inclinado convergente en máquina")).toBeVisible();
};

test("DESHACER ÚLTIMA SERIE desde el descanso vuelve al estado correcto", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText(/serie 2/)).toBeVisible();

  // Acción rápida, separada de los controles principales del temporizador.
  await page.getByRole("button", { name: "DESHACER ÚLTIMA SERIE" }).click();

  // De vuelta a la serie 1, sin temporizador y con el formulario listo.
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.getByText(/Serie 1 de 4/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar serie" })).toBeVisible();

  // Reregistrar funciona con normalidad.
  await logSet(page, "42.5");
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("1 de 4 series guardadas")).toBeVisible();
});

test("editar una serie guardada desde el entrenamiento activo", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();

  await page.getByRole("button", { name: "Corregir serie 1" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator(".numctl__value").first().fill("45");
  await dialog.getByRole("button", { name: "Guardar corrección" }).click();
  await expect(page.getByText("45 kg × 8")).toBeVisible();
});

test("eliminar una serie exige confirmación y recalcula", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();
  await logSet(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("2 de 4 series guardadas")).toBeVisible();

  await page.getByRole("button", { name: "Corregir serie 2" }).click();
  const dialog = page.getByRole("dialog");
  // Primer toque: pide confirmación; segundo: elimina.
  await dialog.getByRole("button", { name: "Eliminar serie…" }).click();
  await dialog
    .getByRole("button", { name: "Confirmar: eliminar esta serie" })
    .click();
  await expect(page.getByText("1 de 4 series guardadas")).toBeVisible();
});

test("las correcciones sobreviven a recargar y reabrir sin conexión", async ({
  page,
  context
}) => {
  test.slow();
  await boot(page, context, "2026-08-10");
  // SW controlando la página para la reapertura offline.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await startMission(page);

  await logSet(page, "40");
  await page.getByRole("button", { name: "DESHACER ÚLTIMA SERIE" }).click();
  await logSet(page, "45");
  await expect(page.getByRole("timer")).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  // El temporizador se recupera y la serie corregida sigue ahí.
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("1 de 4 series guardadas")).toBeVisible();
  await expect(page.getByText("45 kg × 8")).toBeVisible();

  // Editar también funciona sin red.
  await page.getByRole("button", { name: "Corregir serie 1" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator(".numctl__value").first().fill("47.5");
  await dialog.getByRole("button", { name: "Guardar corrección" }).click();
  await expect(page.getByText("47.5 kg × 8")).toBeVisible();
  await context.setOffline(false);
});
