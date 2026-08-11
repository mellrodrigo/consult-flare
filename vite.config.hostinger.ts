// Build estático para hospedagem compartilhada (Hostinger).
// Uso: bun run build:hostinger  -> gera a pasta dist-hostinger/ para subir em public_html.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
    prerender: { enabled: false },
  },
  nitro: {
    preset: "static",
  },
});
