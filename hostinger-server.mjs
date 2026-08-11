// Entry point único do site rgmtech.com.br (Hostinger "Node.js app", VPS ou Passenger).
//
//   npm install && npm run build && npm start
//
// Um processo Node serve tudo na mesma porta:
//   1. /api/*  → API do Workflow (Express + MySQL), registrada PRIMEIRO;
//   2. assets  → arquivos estáticos gerados em .output/public;
//   3. resto   → SSR do TanStack Start (Nitro, preset `node-middleware`).
//
// A ordem importa: se o estático ou o SSR viessem antes da API, /api/* cairia na
// página 404 do frontend e o login responderia HTML em vez de JSON.
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import compression from "compression";
import express from "express";

import { createApi } from "./deploy/node/api.mjs";
import { buildConfig, loadEnv, readVersion } from "./deploy/node/config.mjs";

const here = dirname(fileURLToPath(import.meta.url));

loadEnv(here);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const outputDir = resolve(here, ".output");
const ssrEntry = join(outputDir, "server/index.mjs");
const publicDir = join(outputDir, "public");

if (!existsSync(ssrEntry)) {
  console.error(
    `Build não encontrado em ${ssrEntry}.\nRode 'npm install && npm run build' antes de iniciar.`,
  );
  process.exit(1);
}

const config = buildConfig(here, { version: readVersion(join(here, "package.json")) });

const app = express();
app.disable("x-powered-by");
// Atrás do proxy da Hostinger: preserva o IP real e faz req.secure refletir o
// HTTPS externo (necessário para o cookie de sessão com Secure).
app.set("trust proxy", 1);
app.use(compression());

// 1) API — antes de tudo.
const { router, ensureAdminUser } = createApi(config);
app.use("/api", router);

// 2) Assets do build. `index: false` para que "/" continue indo para o SSR.
if (existsSync(publicDir)) {
  app.use(
    express.static(publicDir, {
      index: false,
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        // Arquivos com hash no nome podem ser cacheados para sempre.
        if (/\/(_build|assets)\//.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
}

// 3) SSR do TanStack Start. O preset `node-middleware` exporta `middleware`,
// um handler Node comum — nenhum processo ou porta extra.
const ssr = await import(pathToFileURL(ssrEntry).href);
const ssrHandler = ssr.middleware ?? ssr.handler ?? ssr.default;
if (typeof ssrHandler !== "function") {
  console.error(
    `O build em ${ssrEntry} não exporta um handler Node.\n` +
      `Refaça o build com o preset node-middleware (NITRO_PRESET=node-middleware npm run build).`,
  );
  process.exit(1);
}
app.use(ssrHandler);

// Primeiro acesso via ADMIN_USERNAME/ADMIN_PASSWORD (só quando não há usuários).
// Falha de banco aqui não derruba o site: a landing continua no ar e
// /api/health informa o problema.
const admin = await ensureAdminUser().catch((err) => ({ created: false, reason: err.message }));
console.log(
  admin.created
    ? `Usuário inicial criado: ${admin.username}`
    : `Primeiro acesso não criado (${admin.reason}).`,
);

app.listen(PORT, HOST, () => {
  console.log(`RGMtech rodando em http://${HOST}:${PORT}`);
});
