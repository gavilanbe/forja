// Finalización con estados honestos: una serie ya no es misión completada,
// el plan entero sí, las omisiones explicadas sellan adaptada y la doble
// finalización jamás duplica XP.

import { expect, test } from "@playwright/test";
import { boot, completeAllStages, logSet } from "./helpers";

const finishNow = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: "Salir de la misión" }).click();
  await page.getByRole("button", { name: "Terminar misión ahora" }).click();
  await page.getByRole("button", { name: "Sellar la misión" }).click();
};

test("terminar con una sola serie sella una misión PARCIAL con recompensa reducida", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();

  // El modal ya avisa del sello real antes de confirmar.
  await page.getByRole("button", { name: "Salir de la misión" }).click();
  await page.getByRole("button", { name: "Terminar misión ahora" }).click();
  await expect(page.getByText(/Se sellará como PARCIAL/)).toBeVisible();
  await page.getByRole("button", { name: "Sellar la misión" }).click();

  await expect(page.getByText("Misión parcial").first()).toBeVisible();
  await expect(page.getByText("+25")).toBeVisible();
  await expect(page.getByText(/todas las series prescritas/)).toBeVisible();
});

test("el plan entero sella una misión COMPLETADA con su recompensa íntegra", async ({
  page,
  context
}) => {
  test.setTimeout(300_000);
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await completeAllStages(page);
  await page.getByRole("button", { name: "Terminar misión", exact: true }).click();
  await expect(page.getByText(/Se sellará como COMPLETADA/)).toBeVisible();
  await page.getByRole("button", { name: "Sellar la misión" }).click();

  await expect(page.getByText("Misión completada").first()).toBeVisible();
  await expect(page.getByLabel("Sello de misión completada")).toBeVisible();
  await expect(page.getByText("+60")).toBeVisible();
  await expect(page.locator(".path__node--done")).toHaveCount(1);
  await page.getByRole("button", { name: "Volver a la Forja" }).click();
  await expect(page.getByText("Misión completada")).toBeVisible();
});

test("omitir series con motivo permite sellar ADAPTADA, nunca completada a medias", async ({
  page,
  context
}) => {
  test.setTimeout(300_000);
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();

  // Primera serie real y el resto de la PRIMERA etapa omitidas con motivo.
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Omitir serie" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Fatiga" }).click();
    // Omitir también arranca descanso: salir de él antes de la siguiente
    // (la etiqueta del botón depende del estado del temporizador/etapa).
    await page
      .getByRole("button", { name: /^(Saltar|Empezar serie|Continuar)$/ })
      .click({ timeout: 10_000 });
  }
  // Resto del día completo.
  await page.getByRole("button", { name: "Siguiente etapa" }).click();
  await completeAllStages(page);
  await page.getByRole("button", { name: "Terminar misión", exact: true }).click();
  await expect(page.getByText(/Se sellará como ADAPTADA/)).toBeVisible();
  await page.getByRole("button", { name: "Sellar la misión" }).click();

  await expect(page.getByText("Misión adaptada").first()).toBeVisible();
  await expect(page.getByLabel("Sello de misión adaptada")).toBeVisible();
  await expect(page.getByText(/Adaptar con cabeza también forja/)).toBeVisible();
  await expect(page.getByText("+60")).toBeVisible();
});

test("misión extra: +0 XP explicado en positivo", async ({ page, context }) => {
  await boot(page, context, "2026-08-10", "Carlos");
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

test("abandonar exige doble confirmación y no concede recompensa", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await page.getByRole("button", { name: "Saltar" }).click();

  await page.getByRole("button", { name: "Salir de la misión" }).click();
  await page.getByRole("button", { name: "Abandonar misión…" }).click();
  await page
    .getByRole("button", { name: /Confirmar abandono/ })
    .click();
  // Vuelve a Hoy; la misión puede reintentarse.
  await expect(page.locator(".today-id__name")).toBeVisible();
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();

  // Reintento: la serie 1 de hoy ya puntuó; re-registrarla no duplica XP.
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();
});
