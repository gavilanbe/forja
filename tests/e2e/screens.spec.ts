// Capturas deterministas de revisión (360/390/430) + comprobación de
// overflow horizontal. Los PNG quedan en qa-screens/ (fuera de git).

import { expect, test, type Page } from "@playwright/test";
import { changeClock, completeOnboarding, logSet, setClock } from "./helpers";

const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 }
];

const assertNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "overflow horizontal").toBeLessThanOrEqual(0);
};

const shoot = async (page: Page, vp: string, name: string) => {
  await page.waitForTimeout(350);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `qa-screens/${name}-${vp}.png`, fullPage: true });
};

for (const vp of VIEWPORTS) {
  test(`capturas ${vp.name}×${vp.height}`, async ({ page, context }) => {
    test.slow();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await setClock(context, "2026-08-10"); // lunes, semana 1

    // Onboarding
    await page.goto("./", { waitUntil: "networkidle" });
    await shoot(page, vp.name, "00-onboarding");
    await completeOnboarding(page, "Nahuel");

    // Hoy con misión (lunes)
    await shoot(page, vp.name, "01-hoy-mision");

    // Misión activa: primera serie
    await page.getByRole("button", { name: /Empezar misión/i }).click();
    await page.getByText("Press inclinado convergente en máquina").waitFor();
    await shoot(page, vp.name, "02-mision-serie");

    // Descanso
    await logSet(page, "40");
    await page.getByRole("timer").waitFor();
    await shoot(page, vp.name, "03-descanso");
    await page.getByRole("button", { name: "Saltar" }).click();

    // Molestia
    await page.getByRole("button", { name: "Molestia / dolor" }).click();
    await shoot(page, vp.name, "04-molestia");
    await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();

    // Finalización
    await page.getByRole("button", { name: "Salir de la misión" }).click();
    await page.getByRole("button", { name: "Terminar misión ahora" }).click();
    await page.getByRole("button", { name: "Sellar la misión" }).click();
    // Espera el final de la secuencia de recompensa (sello + resto visible)
    await page.locator(".complete__rest--in").waitFor();
    await page.waitForTimeout(400);
    await shoot(page, vp.name, "05-finalizacion");
    await page.getByRole("button", { name: "Volver a la Forja" }).click();

    // Campaña (miércoles, con progreso real)
    await changeClock(page, "2026-08-12");
    await page.goto("./#/campana");
    await page.reload({ waitUntil: "networkidle" });
    await shoot(page, vp.name, "06-campana");

    // Progreso con datos
    await page.goto("./#/progreso");
    await page.getByText("Progresión de carga").waitFor();
    await shoot(page, vp.name, "07-progreso");

    // Hoy en descanso (domingo)
    await changeClock(page, "2026-08-16");
    await page.goto("./#/");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Día de recuperación").waitFor();
    await shoot(page, vp.name, "08-hoy-descanso");

    // Perfil
    await page.goto("./#/perfil");
    await page.getByText("Forjadores").waitFor();
    await shoot(page, vp.name, "09-perfil");
  });
}
