// Entry point do site rgmtech.com.br para hospedagem COM Node.js
// (VPS ou plano com "Node.js app"). A hospedagem compartilhada da Hostinger só
// roda PHP e não usa este arquivo — lá o caminho é `npm run build:hostinger`.
//
//   npm install && npm run build:server && npm start
//
// Um processo Node serve tudo na mesma porta:
//   1. /api/*  → API do Workflow (Express + MySQL), registrada PRIMEIRO;
//   2. assets  → arquivos estáticos gerados em .output/public;
//   3. resto   → SSR do TanStack Start, carregado no mesmo processo.
//
// A ordem importa: se o estático ou o SSR viessem antes da API, /api/* cairia na
// página 404 do frontend e o login responderia HTML em vez de JSON.
import { existsSync } from "node:fs";
import { Readable } from "node:stream";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import compression from "compression";
import express from "express";

import { createApi } from "./deploy/node/api.mjs";
import { buildConfig, loadEnv, readVersion } from "./deploy/node/config.mjs";

const here = dirname(fileURLToPath(import.meta.url));

loadEnv(here);

// PORT pode ser número ou socket (Passenger); só converte quando for numérico.
const rawPort = process.env.PORT ?? "3000";
const PORT = /^\d+$/.test(rawPort) ? Number(rawPort) : rawPort;
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

// 3) SSR do TanStack Start — sempre no MESMO processo, sem porta interna.
// A Hostinger exige que listen() aconteça em até 3 segundos, então a porta abre
// primeiro e o SSR é carregado logo em seguida. Formatos aceitos do build:
//   - `middleware` (preset node-middleware, gerado por `npm run build:server`);
//   - `default.fetch` (build padrão `npm run build`, handler fetch Web);
//   - função default / `handler`.
let ssrHandler = null;
let ssrError = null;
let resolveSsrReady;
const ssrReady = new Promise((r) => (resolveSsrReady = r));

function fetchToNode(fetchFn) {
  return async (req, res, next) => {
    try {
      const proto = req.headers["x-forwarded-proto"]?.split(",")[0] || (req.secure ? "https" : "http");
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) for (const v of value) headers.append(key, v);
        else headers.set(key, String(value));
      }
      const hasBody = !["GET", "HEAD"].includes(req.method);
      const request = new Request(`${proto}://${host}${req.originalUrl}`, {
        method: req.method,
        headers,
        body: hasBody ? Readable.toWeb(req) : undefined,
        duplex: hasBody ? "half" : undefined,
      });
      const ctx = { waitUntil: (p) => Promise.resolve(p).catch(() => {}), passThroughOnException() {} };
      const response = await fetchFn(request, process.env, ctx);
      if (!response) return next();
      res.status(response.status);
      const cookies = response.headers.getSetCookie?.() ?? [];
      response.headers.forEach((value, key) => {
        if (key === "set-cookie" || key === "content-length" || key === "content-encoding") return;
        res.setHeader(key, value);
      });
      if (cookies.length) res.setHeader("set-cookie", cookies);
      if (!response.body || req.method === "HEAD") return res.end();
      Readable.fromWeb(response.body).on("error", next).pipe(res);
    } catch (err) {
      next(err);
    }
  };
}

async function loadSsr() {
  try {
    const mod = await import(pathToFileURL(ssrEntry).href);
    const def = mod.default;
    if (typeof mod.middleware === "function") return mod.middleware;
    if (def && typeof def.fetch === "function") return fetchToNode(def.fetch.bind(def));
    if (typeof mod.handler === "function") return mod.handler;
    if (typeof def === "function") return def;
    throw new Error("Formato do build SSR não reconhecido. Rode 'npm run build:server'.");
  } catch (err) {
    console.error("Falha ao carregar o SSR:", err);
    ssrError = err;
    return null;
  }
}

app.use(async (req, res, next) => {
  if (!ssrHandler && !ssrError) await ssrReady;
  if (!ssrHandler) {
    res.status(503).type("text/plain").send("Site iniciando ou com erro no build. Veja os logs.");
    return;
  }
  ssrHandler(req, res, next);
});

// Abre a porta IMEDIATAMENTE (antes do SSR e do banco).
const onListen = () => console.log(`RGMtech rodando em ${typeof PORT === "number" ? `http://${HOST}:${PORT}` : PORT}`);
if (typeof PORT === "number") app.listen(PORT, HOST, onListen);
else app.listen(PORT, onListen);

loadSsr().then((handler) => {
  ssrHandler = handler;
  if (handler) console.log("SSR carregado.");
  resolveSsrReady();
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
