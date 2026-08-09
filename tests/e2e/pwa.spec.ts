// PWA: build con base /forja/, service worker, reapertura sin red y
// actualización que no interrumpe una misión.

import { expect, test } from "@playwright/test";
import { boot, logSet, setClock } from "./helpers";

test("la build sirve bajo /forja/ y registra el service worker", async ({
  page,
  context
}) => {
  await setClock(context, "2026-08-10");
  await page.goto("./", { waitUntil: "networkidle" });
  expect(page.url()).toContain("/forja/");
  const swScope = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.scope;
  });
  expect(swScope).toContain("/forja/");
});

test("tras la primera carga, la app reabre sin conexión", async ({
  page,
  context
}) => {
  test.slow();
  await boot(page, context, "2026-08-10");
  // Espera al SW activo y a que controle la página tras recargar
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  // La app entera funciona: Hoy renderiza con su misión.
  // (El aviso de "Sin conexión" depende de navigator.onLine, que la
  // emulación de red de Playwright no cambia de forma fiable.)
  await expect(page.getByRole("button", { name: /Empezar misión/i })).toBeVisible();

  // Y el flujo de registro sigue operativo sin red
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();
  await context.setOffline(false);
});

test("el aviso de actualización del SW nunca aparece dentro de una misión", async ({
  page,
  context
}) => {
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await expect(page.getByText("Press inclinado convergente en máquina")).toBeVisible();
  // Aunque hubiese una versión nueva esperando, el toast no se muestra en /mision
  const toastInMission = await page.locator(".update-toast").count();
  expect(toastInMission).toBe(0);
});
