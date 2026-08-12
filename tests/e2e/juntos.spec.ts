// ENTRENAR JUNTOS: misma sesión canónica del día, datos totalmente
// independientes por forjador (series, cargas, descansos, XP), cambio de
// participante sin perder nada y perfil activo muy visible.

import { expect, test } from "@playwright/test";
import { boot, logSet } from "./helpers";

test("dos forjadores comparten la misión del lunes con registros independientes", async ({
  page,
  context
}) => {
  test.slow();
  // Lunes: Torso A para Nahuel y para Carlos → sesión canónica compartida.
  await boot(page, context, "2026-08-10");
  await page.getByRole("button", { name: /Empezar misión/i }).click();
  await expect(page.getByText("Press inclinado convergente en máquina")).toBeVisible();

  // La barra de participantes es visible y marca al activo.
  const bar = page.getByRole("group", { name: /Quién registra/ });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("button", { name: /Nahuel/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // Nahuel registra su serie a 60 kg y queda descansando.
  await logSet(page, "60");
  await expect(page.getByRole("timer")).toBeVisible();

  // Cambio a Carlos: SU pantalla, sin el descanso de Nahuel.
  await bar.getByRole("button", { name: /Carlos/ }).click();
  await expect(bar.getByRole("button", { name: /Carlos/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("timer")).toHaveCount(0);
  // Sin herencia de cargas de Nahuel: primera vez de Carlos.
  await expect(page.locator(".numctl__value").first()).toHaveValue("");

  // Carlos registra a 40 kg.
  await logSet(page, "40");
  await expect(page.getByRole("timer")).toBeVisible();

  // Vuelta a Nahuel: su descanso persiste y su lista es la suya (60 kg).
  await bar.getByRole("button", { name: /Nahuel/ }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByText("60 kg × 8")).toBeVisible();
  await expect(page.getByText("40 kg ×")).toHaveCount(0);

  // Y la lista de Carlos es la de Carlos (esperando a que cargue su fase).
  await bar.getByRole("button", { name: /Carlos/ }).click();
  await expect(bar.getByRole("button", { name: /Carlos/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page
    .locator('[role="timer"], .wk-setlist')
    .first()
    .waitFor({ timeout: 10_000 });
  const skipCarlos = page.getByRole("button", { name: "Saltar" });
  if (await skipCarlos.isVisible().catch(() => false)) await skipCarlos.click();
  await expect(page.getByText("40 kg × 8")).toBeVisible();
  await expect(page.getByText("60 kg ×")).toHaveCount(0);
});
