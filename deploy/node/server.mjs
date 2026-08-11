// Servidor Node.js do site RGMtech (landing + app Workflow).
// Uso em produção (Hostinger VPS / Node app):
//   NODE_ENV=production node server.mjs
// Variáveis de ambiente: veja .env.example
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import express from "express";

import { createApi } from "./api.mjs";
import { buildConfig, loadEnv, readVersion } from "./config.mjs";

const here = dirname(fileURLToPath(import.meta.url));

loadEnv(here);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const publicDir = resolve(here, process.env.PUBLIC_DIR ?? "./public");

const config = buildConfig(here, { version: readVersion(join(here, "package.json")) });

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression());

// A API vem antes de qualquer arquivo estático: se o `express.static` viesse
// primeiro, ele responderia HTML para /api/... e o login quebraria.
const { router, ensureAdminUser } = createApi(config);
app.use("/api", router);

// Assets com hash → cache longo; HTML → sempre revalidado.
app.use(
  "/assets",
  express.static(join(publicDir, "assets"), { immutable: true, maxAge: "1y" }),
);
app.use(express.static(publicDir, { extensions: ["html"], maxAge: "1h" }));

// Fallback do roteador do app (client-side routing). Nunca captura /api porque
// o router acima já respondeu (inclusive 404 em JSON).
app.use((_req, res) => res.sendFile(join(publicDir, "index.html")));

const admin = await ensureAdminUser().catch((err) => ({ created: false, reason: err.message }));
console.log(
  admin.created
    ? `Usuário inicial criado: ${admin.username}`
    : `Primeiro acesso não criado (${admin.reason}).`,
);

app.listen(PORT, HOST, () => {
  console.log(`RGMtech rodando em http://${HOST}:${PORT} (arquivos: ${publicDir})`);
});
