import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  tanstackStart: { server: { entry: "server" }, spa: { enabled: true }, prerender: { enabled: true, crawlLinks: true } },
  nitro: { config: { preset: "static" } },
});
