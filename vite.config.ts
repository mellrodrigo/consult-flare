import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  tanstackStart: { spa: { enabled: true }, prerender: { enabled: true, crawlLinks: true } },
  nitro: { config: { preset: "static" } },
});
