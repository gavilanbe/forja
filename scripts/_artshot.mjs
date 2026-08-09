// Captura del laboratorio de direcciones: node scripts/_artshot.mjs out.png "dir=a&sec=sprites" [delay]
import { chromium } from "@playwright/test";
const [,, out, query, delay = "900"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(`http://localhost:5199/#/dev/art-directions?${query}`, { waitUntil: "networkidle" });
await page.waitForTimeout(Number(delay));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("ok");
