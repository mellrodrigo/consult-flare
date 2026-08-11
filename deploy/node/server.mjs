// Servidor Node.js do site RGMtech (landing + app Workflow).
// Uso em produção (Hostinger VPS / Node app):
//   NODE_ENV=production node server.mjs
// Variáveis de ambiente: veja .env.example
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import express from "express";

import { createApi } from "./api.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// Carrega .env (sem dependência externa) se existir.
const envFile = join(here, ".env");
if (existsSync(envFile)) {
  const { readFileSync } = await import("node:fs");
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const publicDir = resolve(here, process.env.PUBLIC_DIR ?? "./public");

const config = {
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
};

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression());

const { router } = createApi(config);
app.use("/api", router);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Assets com hash → cache longo; HTML → sempre revalidado.
app.use(
  "/assets",
  express.static(join(publicDir, "assets"), { immutable: true, maxAge: "1y" }),
);
app.use(express.static(publicDir, { extensions: ["html"], maxAge: "1h" }));

// Fallback do roteador do app (client-side routing).
app.use((_req, res) => res.sendFile(join(publicDir, "index.html")));

app.listen(PORT, HOST, () => {
  console.log(`RGMtech rodando em http://${HOST}:${PORT} (arquivos: ${publicDir})`);
});
