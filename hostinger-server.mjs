// Entry point para hospedagem Node.js (Hostinger Node app / VPS / Passenger).
//   node server.js
//
// Fluxo:
//   1. sobe o servidor Nitro gerado por `npm run build` (.output/server/index.mjs)
//      numa porta interna;
//   2. expõe uma única porta pública (PORT) com Express, servindo a API do
//      Workflow em /api (MySQL) e repassando o resto para o Nitro (SSR + assets).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import express from "express";

import { createApi } from "./deploy/node/api.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// Carrega .env (sem dependência externa) se existir.
const envFile = join(here, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const SSR_PORT = Number(process.env.SSR_PORT ?? PORT + 1);
const ssrEntry = resolve(here, ".output/server/index.mjs");

if (!existsSync(ssrEntry)) {
  console.error(
    `Build não encontrado em ${ssrEntry}.\nRode 'npm ci && npm run build' antes de iniciar o servidor.`,
  );
  process.exit(1);
}

// 1) Nitro (SSR + assets) numa porta interna.
const ssr = spawn(process.execPath, [ssrEntry], {
  cwd: here,
  stdio: "inherit",
  env: { ...process.env, PORT: String(SSR_PORT), NITRO_PORT: String(SSR_PORT), HOST: "127.0.0.1" },
});
ssr.on("exit", (code) => {
  console.error(`Servidor SSR encerrou (código ${code}).`);
  process.exit(code ?? 1);
});
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    ssr.kill(sig);
    process.exit(0);
  });
}

// 2) Porta pública: API + proxy para o SSR.
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression());

const { router } = createApi({
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "workflow",
  },
  uploadsDir: resolve(here, process.env.UPLOADS_DIR ?? "./uploads"),
  allowSignup: String(process.env.ALLOW_SIGNUP ?? "true") === "true",
  signupEmailDomain: process.env.SIGNUP_EMAIL_DOMAIN ?? "",
});
app.use("/api", router);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(async (req, res) => {
  try {
    const upstream = await fetch(`http://127.0.0.1:${SSR_PORT}${req.originalUrl}`, {
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${SSR_PORT}` },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      duplex: "half",
      redirect: "manual",
    });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(key)) {
        res.setHeader(key, value);
      }
    });
    if (upstream.body) {
      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(err);
    res.status(502).send("Servidor indisponível.");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`RGMtech rodando em http://${HOST}:${PORT} (SSR interno na porta ${SSR_PORT})`);
});
