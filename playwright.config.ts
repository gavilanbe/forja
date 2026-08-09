// E2E contra la build de PRODUCCIÓN con base /forja/ (la misma que GitHub
// Pages): así cada ejecución valida también el criterio de build y el
// service worker real. El reloj de la app se fija por prueba con la clave
// localStorage `forja:now` (ver src/logic/clock.ts): nada depende del día
// real de ejecución.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5299/forja/",
    trace: "retain-on-failure",
    ...devices["Pixel 7"]
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 800 }
      }
    }
  ],
  webServer: {
    command:
      "VITE_BASE_PATH=/forja/ npm run build && VITE_BASE_PATH=/forja/ npx vite preview --port 5299 --strictPort",
    url: "http://localhost:5299/forja/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
