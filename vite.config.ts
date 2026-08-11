// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The site is hosted on Hostinger as a single Node.js app (hostinger-server.mjs),
// so the default build target is Nitro's `node-middleware` preset: it emits
// `.output/server/index.mjs` exporting a plain Node request handler, which
// hostinger-server.mjs mounts inside Express *after* the /api routes. The
// upstream default is cloudflare, which emits a Workers bundle Node cannot run;
// `node-server` would also work but it binds its own port on import.
// Override with NITRO_PRESET=... to build for another target.
const preset = process.env["NITRO_PRESET"] ?? "node-middleware";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: { preset },
});
