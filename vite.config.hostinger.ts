// Build estático para hospedagem compartilhada (Hostinger).
// Uso: bun run build:hostinger  -> gera a pasta dist-hostinger/ para subir em public_html.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    spa: { enabled: true },
    prerender: { enabled: true, crawlLinks: true },
  },
  nitro: {
    preset: "static",
  },
});
