import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json" with { type: "json" };

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  test: { exclude: ["e2e/**", "node_modules/**", "dist/**"] },
  base,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-router")) return "vendor-router";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("spellExpansion")) return "data-spells";
          if (id.includes("subclassExpansion")) return "data-subclasses";
          if (id.includes("itemExpansion")) return "data-items";
          if (id.includes("/src/core/")) return "app-core";
          if (id.includes("/src/shared/")) return "app-shared";
          if (id.includes("/src/features/homebrew/homebrewStorage") || id.includes("/src/core/homebrew/")) return "app-homebrew-core";
          if (id.includes("/src/features/campaigns/campaignStorage") || id.includes("/src/features/campaigns/campaignTemplates") || id.includes("/src/features/campaigns/campaignTypes")) return "app-campaign-core";
          if (id.includes("/src/features/backup/")) return "app-backup-core";
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Everything for D&D",
        short_name: "E4 D&D",
        description:
          "D&D character builder, homebrew manager and play mode companion.",
        theme_color: "#0b1020",
        background_color: "#070b16",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,webmanifest}"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});