// Build estático para hospedagem compartilhada Hostinger (Apache + PHP, sem Node).
// Gera HTML pronto de cada página + assets. Uso: node deploy/hostinger/build.mjs
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
});
