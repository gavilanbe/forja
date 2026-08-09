// Estados de Hoy y Campaña con fechas deterministas: día programado,
// descanso, prólogo, bloque forjado y coherencia de la llama.

import { expect, test } from "@playwright/test";
import { boot, changeClock } from "./helpers";

test("día programado: el CTA de misión es visible en el primer viewport 360×800", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10"); // lunes, semana 1
  const cta = page.getByRole("button", { name: /Empezar misión/i });
  await expect(cta).toBeVisible();
  await expect(cta).toBeInViewport();
  await expect(page.getByText("Capítulo 1 · El primer fuego")).toBeVisible();
  // Sin chip permanente "Local"
  await expect(page.getByText(/^Local$/)).toHaveCount(0);
});

test("día de descanso: campamento sin CTA de misión y sin días perdidos falsos", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await changeClock(page, "2026-08-16"); // domingo de la semana 1
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Día de recuperación")).toBeVisible();
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toHaveCount(0);
  await expect(page.getByText(/El descanso nunca la apaga/)).toBeVisible();
});

test("prólogo: sin capítulo activo, llama apagada y coherencia con Campaña", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-14"); // viernes: la campaña empieza el lunes 17
  await expect(page.getByText("La forja aún está fría")).toBeVisible();
  await expect(page.getByText(/se enciende el lunes 17/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toHaveCount(0);
  // Nada de "capítulo 1 de 6" activo ni llama encendida
  await expect(page.getByText("Capítulo 1 de 6")).toHaveCount(0);
  await expect(page.getByLabel("Llama: apagada")).toBeVisible();
  // El camino no marca días previos como perdidos
  await expect(page.locator(".path__node--missed")).toHaveCount(0);

  await page.goto("./#/campana");
  await expect(page.getByText("Prólogo: la llama espera el inicio")).toBeVisible();
  await expect(page.getByText("Se abre el lunes 17.", { exact: true })).toBeVisible();
});

test("después de la semana 6: bloque forjado en Hoy y checkpoint en Campaña", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await changeClock(page, "2026-09-24"); // jueves posterior al fin (10 ago + 6 semanas)
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Seis capítulos al yunque")).toBeVisible();
  // La rutina sigue: jueves = Empuje
  await expect(page.getByRole("button", { name: /Entrenar Empuje/ })).toBeVisible();

  await page.goto("./#/campana");
  await expect(page.getByText("Checkpoint del bloque")).toBeVisible();
  const nueva = page.getByRole("button", { name: "Empezar nueva campaña" });
  await expect(nueva).toBeVisible();

  // No se reinicia sin confirmación
  await nueva.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Todavía no" }).click();
  await expect(page.getByText("Checkpoint del bloque")).toBeVisible();

  // Con confirmación sí: la campaña vuelve al prólogo (empieza el lunes 28)
  await nueva.click();
  await page.getByRole("button", { name: "Forjar un nuevo bloque" }).click();
  await expect(page.getByText("Prólogo: la llama espera el inicio")).toBeVisible();
});

test("la llama se pone al rojo al cumplir el objetivo semanal (Carlos, 3 misiones)", async ({
  page,
  context
}) => {
  test.slow();
  await boot(page, context, "2026-08-10", "Carlos");
  // Lunes, martes y viernes de Carlos
  for (const day of ["2026-08-10", "2026-08-11", "2026-08-14"]) {
    await changeClock(page, day);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Empezar misión/i }).click();
    await page.locator(".numctl__value").first().fill("30");
    await page.getByRole("button", { name: "Guardar serie" }).click();
    await page.getByRole("button", { name: "Saltar" }).click();
    await page.getByRole("button", { name: "Salir de la misión" }).click();
    await page.getByRole("button", { name: "Terminar misión ahora" }).click();
    await page.getByRole("button", { name: "Sellar la misión" }).click();
    await page.getByRole("button", { name: "Volver a la Forja" }).click();
  }
  await expect(page.getByText(/3 de 3 misiones esta semana/)).toBeVisible();
  await expect(page.getByLabel("Llama: roja")).toBeVisible();
});
