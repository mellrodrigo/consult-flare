// Build estático para hospedagem compartilhada Hostinger (Apache + PHP, sem Node).
// Gera HTML pronto de cada página + assets. Uso: node deploy/hostinger/build.mjs
//
// O padrão é `node-server`: os scripts de build sobem `.output/server/index.mjs`
// numa porta local para pré-renderizar o HTML de cada rota, e para isso o build
// precisa gerar um servidor que escuta sozinho.
// `npm run build:server` sobrescreve com NITRO_PRESET=node-middleware, que
// exporta um handler montável no Express (caminho Node/VPS).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const preset = process.env["NITRO_PRESET"] ?? "node-server";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset },
});
