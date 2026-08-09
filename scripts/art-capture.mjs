// Capturas 390×844 y grabaciones webm del laboratorio de direcciones.
// Uso: node scripts/art-capture.mjs [a|b|c]   (sin argumento: las tres)
// Salida: design/art-directions/{a-monumental,b-codice,c-arcade}/

import { chromium } from "@playwright/test";
import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://localhost:5199/#/dev/art-directions";
const OUT = {
  a: "design/art-directions/a-monumental",
  b: "design/art-directions/b-codice",
  c: "design/art-directions/c-arcade"
};
const SLICES = ["hoy", "registro", "descanso", "campana", "progreso", "final"];
const VIEW = { width: 390, height: 844 };

const dirs = process.argv[2] ? [process.argv[2]] : ["a", "b", "c"];
const browser = await chromium.launch();

for (const d of dirs) {
  const out = OUT[d];
  mkdirSync(out, { recursive: true });

  // ── Capturas estáticas ───────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const shoot = async (query, name, delay = 1100) => {
    await page.goto(`${BASE}?${query}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(delay);
    await page.screenshot({ path: join(out, `${name}.png`) });
    await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
  };
  await shoot(`dir=${d}&sec=biblia`, "01-art-bible");
  await shoot(`dir=${d}&sec=sprites`, "02-sprites");
  await shoot(`dir=${d}&sec=datos`, "03-data-viz");
  for (let i = 0; i < SLICES.length; i++) {
    await shoot(`dir=${d}&sec=slice&screen=${SLICES[i]}`, `04-slice-${i + 1}-${SLICES[i]}`);
  }
  await ctx.close();

  // ── Grabaciones del motion lab ───────────────────────────────────────────
  // Una grabación corta por secuencia: se pulsa su botón y se deja terminar.
  const vidTmp = join(out, "_video-tmp");
  for (let scene = 0; scene < 7; scene++) {
    rmSync(vidTmp, { recursive: true, force: true });
    const vctx = await browser.newContext({
      viewport: VIEW,
      recordVideo: { dir: vidTmp, size: VIEW }
    });
    const vpage = await vctx.newPage();
    await vpage.goto(`${BASE}?dir=${d}&sec=motion`, { waitUntil: "networkidle" });
    await vpage.waitForTimeout(600);
    const buttons = vpage.getByRole("button", { name: /Reproducir|Repetir/ });
    const btn = buttons.nth(scene);
    await btn.scrollIntoViewIfNeeded();
    await vpage.waitForTimeout(350);
    await btn.click();
    await vpage.waitForTimeout(2600);
    await vctx.close();
    const files = readdirSync(vidTmp).filter((f) => f.endsWith(".webm"));
    if (files[0]) {
      renameSync(join(vidTmp, files[0]), join(out, `motion-${scene + 1}.webm`));
    }
  }
  rmSync(vidTmp, { recursive: true, force: true });
  console.log(`dirección ${d}: capturas y vídeos en ${out}`);
}

await browser.close();
