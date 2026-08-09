/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Base '/' en desarrollo; el workflow de Pages exporta VITE_BASE_PATH=/forja/
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"],
      manifest: {
        name: "FORJA — Campaña de hipertrofia",
        short_name: "FORJA",
        description:
          "Campaña RPG de 16 bits para el programa de hipertrofia de Nahuel y Carlos. Funciona sin conexión.",
        lang: "es",
        dir: "ltr",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        background_color: "#05070D",
        theme_color: "#0B0F1A",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Toda la shell (JS, CSS, fuentes, iconos, HTML) queda precacheada:
        // la app entera debe funcionar sin red tras la primera carga.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webmanifest}"],
        navigateFallback: base + "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false
      }
    })
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
