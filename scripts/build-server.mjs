// Build do caminho Node.js (VPS / plano com Node app), usado por
// `npm run build:server` e servido por `hostinger-server.mjs`.
//
// NÃO é o build da hospedagem compartilhada — essa só roda PHP e usa
// `npm run build:hostinger`. Veja deploy/node/README.md.
//
// Gera `.output/` com o preset Nitro `node-middleware`, que exporta um handler
// Node montável dentro do Express (em vez de abrir a própria porta).
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  ["node", ["scripts/ensure-build-deps.mjs"]],
  ["npx", ["vite", "build", "--config", "vite.config.hostinger.ts"]],
];

for (const [cmd, args] of steps) {
  const result = spawnSync(process.platform === "win32" ? `${cmd}.cmd` : cmd, args, {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NITRO_PRESET: "node-middleware" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
