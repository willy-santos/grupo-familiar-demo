import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",

        workbox: {
          globPatterns: [
            "**/*.{js,css,html,wasm,png,svg,ico,webmanifest}",
          ],
          navigateFallback: undefined,
        },

        manifest: {
          name: "ADNA – Grupo Familiar",
          short_name: "ADNA",
          description: "Sistema de gestão para grupos familiares da ADNA.",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          scope: "/",
lang: "pt-BR",

          icons: [
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
  },

  tanstackStart: {
    server: { entry: "server" },
  },
});