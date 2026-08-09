// Entrenamiento activo: primera serie honesta, validación de peso,
// temporizador persistente, técnica, alternativas, molestia y nota.

import { expect, test } from "@playwright/test";
import { boot, logSet } from "./helpers";

const startMission = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await expect(page.getByText("Press inclinado convergente en máquina")).toBeVisible();
};

test("primera serie: peso vacío, reps al punto medio y 0 kg bloqueado", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);

  const weight = page.locator(".numctl__value").first();
  const reps = page.locator(".numctl__value").nth(1);
  await expect(weight).toHaveValue("");
  await expect(weight).toHaveAttribute("placeholder", "kg");
  await expect(reps).toHaveValue("8"); // punto medio de 6–10

  const save = page.getByRole("button", { name: "Guardar serie" });
  await expect(save).toBeDisabled();
  await expect(page.getByText("Introduce el peso para poder guardar.")).toBeVisible();

  // 0 kg tampoco vale en carga externa
  await weight.fill("0");
  await expect(save).toBeDisabled();
  await expect(page.getByText(/0 kg no es una carga válida/)).toBeVisible();

  await weight.fill("40");
  await expect(save).toBeEnabled();
});

test("registrar varias series arranca descansos y lista las series", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);

  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText(/serie 2/)).toBeVisible();
  await page.getByRole("button", { name: "Saltar" }).click();

  // La segunda serie hereda el peso de la primera
  await expect(page.locator(".numctl__value").first()).toHaveValue("40");
  await logSet(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("2 de 4 series guardadas")).toBeVisible();
  await expect(page.getByText("S1")).toBeVisible();
  await expect(page.getByText("S2")).toBeVisible();
});

test("+15 s y pausa del temporizador", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toContainText("3:00");
  await page.getByRole("button", { name: "+15 s" }).click();
  await expect(page.getByRole("timer")).toContainText("3:1");
  await page.getByRole("button", { name: "Pausa" }).click();
  await expect(page.getByRole("button", { name: "Reanudar" })).toBeVisible();
});

test("recarga durante la misión: sesión y temporizador se recuperan", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  // Vuelve directamente al descanso, con el tiempo calculado contra el reloj real
  await expect(page.getByRole("timer")).toBeVisible();
  const clock = await page.getByRole("timer").textContent();
  expect(clock).toMatch(/^[0-3]:\d\d$/);

  // Y la serie guardada sigue ahí
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("1 de 4 series guardadas")).toBeVisible();
});

test("técnica y alternativa por máquina ocupada", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);

  await page.getByRole("button", { name: "Técnica" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Colocación")).toBeVisible();
  // Escape cierra y el foco vuelve al disparador
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Máquina ocupada: alternativas" }).click();
  await page
    .getByRole("button", { name: /Press inclinado en Smith/ })
    .click();
  await expect(page.getByText(/Alternativa:/)).toBeVisible();
  await logSet(page, "35");
  await expect(page.getByRole("timer")).toBeVisible();
});

test("molestia alta ofrece detener; molestia media ofrece adaptar", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);

  await page.getByRole("button", { name: "Molestia / dolor" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Modifica: baja carga/)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Seguir con menos carga o rango" })
  ).toBeVisible();

  // Subir a 6: detener
  const plus = dialog.getByRole("button", { name: /Sumar 1 a Intensidad/ });
  await plus.click();
  await plus.click();
  await plus.click();
  await expect(dialog.getByText(/Detén el ejercicio/)).toBeVisible();
  await dialog.getByRole("button", { name: "Detener este ejercicio" }).click();
  await expect(page.getByText("Etapa superada")).toBeVisible();
});

test("nota opcional por ejercicio se guarda y reaparece", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await page.getByRole("button", { name: "Añadir nota" }).click();
  await page.locator(".note-input").fill("asiento en 4");
  await page.getByRole("button", { name: "Guardar nota" }).click();
  await expect(page.getByRole("button", { name: "Nota guardada · editar" })).toBeVisible();
  await page.getByRole("button", { name: "Nota guardada · editar" }).click();
  await expect(page.locator(".note-input")).toHaveValue("asiento en 4");
});

test("los modales atrapan el foco y tienen cierre visible", async ({ page, context }) => {
  await boot(page, context, "2026-08-10");
  await startMission(page);
  await page.getByRole("button", { name: "Omitir serie" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Cerrar" })).toBeVisible();

  // El Tab cicla dentro del modal
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement)
    );
    expect(inside).toBe(true);
  }
  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await expect(dialog).toHaveCount(0);
});
