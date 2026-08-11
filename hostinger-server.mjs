// Entry point do site rgmtech.com.br para hospedagem COM Node.js
// (VPS ou plano com "Node.js app"). A hospedagem compartilhada da Hostinger só
// roda PHP e não usa este arquivo — lá o caminho é `npm run build:hostinger`.
//
//   npm install && npm run build:server && npm start
//
// Um processo Node serve tudo na mesma porta:
//   1. /api/*  → API do Workflow (Express + MySQL), registrada PRIMEIRO;
//   2. assets  → arquivos estáticos gerados em .output/public;
//   3. resto   → SSR do TanStack Start (Nitro, preset `node-middleware`;
//                o preset `node-server` também é aceito, via proxy interno).
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
    `Build não encontrado em ${ssrEntry}.\nRode 'npm install && npm run build:server' antes de iniciar.`,
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

// 3) SSR do TanStack Start.
// Aceita os dois presets do Nitro:
//   - `node-middleware`: exporta `middleware`, um handler Node comum (ideal);
//   - `node-server`: sobe o próprio servidor HTTP ao ser importado. Nesse caso
//     importamos com uma porta interna (via NITRO_PORT) e fazemos proxy — sem
//     isso o import brigaria pela mesma porta do Express e o app cairia (503).
async function mountSsr() {
  const mod = await import(pathToFileURL(ssrEntry).href).catch((err) => {
    console.error("Falha ao carregar o SSR:", err);
    return null;
  });
  const direct =
    mod &&
    (mod.middleware ?? mod.handler ?? (typeof mod.default === "function" ? mod.default : null));
  if (typeof direct === "function") {
    app.use(direct);
    return;
  }
  // Preset node-server: já subiu em INTERNAL_PORT no import acima.
  app.use(async (req, res, next) => {
    try {
      const target = `http://127.0.0.1:${INTERNAL_PORT}${req.originalUrl}`;
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      const hasBody = !["GET", "HEAD"].includes(req.method);
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? req : undefined,
        duplex: hasBody ? "half" : undefined,
        redirect: "manual",
      });
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!["content-encoding", "content-length", "transfer-encoding"].includes(key)) {
          res.setHeader(key, value);
        }
      });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (err) {
      next(err);
    }
  });
}

// Porta interna do SSR quando o build usa o preset node-server.
const INTERNAL_PORT = Number(process.env.SSR_INTERNAL_PORT ?? PORT + 1);
process.env.NITRO_PORT = String(INTERNAL_PORT);
process.env.NITRO_HOST = "127.0.0.1";

await mountSsr();

// Sobe o servidor ANTES de qualquer acesso ao banco: se o MySQL estiver lento
// ou fora do ar, a porta precisa abrir mesmo assim (senão a Hostinger dá 503).
app.listen(PORT, HOST, () => {
  console.log(`RGMtech rodando em http://${HOST}:${PORT}`);
});

// Primeiro acesso via ADMIN_USERNAME/ADMIN_PASSWORD (só quando não há usuários).
ensureAdminUser()
  .catch((err) => ({ created: false, reason: err.message }))
  .then((admin) =>
    console.log(
      admin.created
        ? `Usuário inicial criado: ${admin.username}`
        : `Primeiro acesso não criado (${admin.reason}).`,
    ),
  );
