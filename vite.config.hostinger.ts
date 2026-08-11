// Build 100% estático (SPA) para hospedagem compartilhada Hostinger.
// Uso: bunx vite build --config vite.config.hostinger.ts
// Resultado: dist/client/ -> conteúdo para o public_html.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
    prerender: { enabled: true, crawlLinks: true },
  },
});
