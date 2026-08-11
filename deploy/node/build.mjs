// Gera a pasta `dist-node/` pronta para rodar em Node.js (Hostinger VPS ou Node app).
//
//   npm run build:node
//   cd dist-node && npm install --omit=dev && node server.mjs
import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const OUT = join(root, "dist-node");
const PORT = 4322;

const ROUTES = ["/", "/solucoes/workflow-profissionais", "/workflow"];

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd: root, stdio: "inherit", ...opts });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error(`${cmd} saiu com código ${code}`))));
  });
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/`);
      if (r.ok) return;
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Servidor de build não respondeu.");
}

console.log("→ Buildando o app…");
await run("npx", ["vite", "build", "--config", "vite.config.hostinger.ts"], {
  env: { ...process.env, LOVABLE_SANDBOX: "", DEV_SERVER__PROJECT_PATH: "" },
});

console.log("→ Gerando o HTML de cada página…");
const server = spawn("node", [".output/server/index.mjs"], {
  cwd: root,
  stdio: "ignore",
  env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1" },
});

try {
  await waitForServer();

  await rm(OUT, { recursive: true, force: true });
  await mkdir(join(OUT, "public"), { recursive: true });
  await cp(join(root, ".output/public"), join(OUT, "public"), { recursive: true });

  for (const route of ROUTES) {
    const res = await fetch(`http://127.0.0.1:${PORT}${route}`);
    if (!res.ok) throw new Error(`Falha ao renderizar ${route}: ${res.status}`);
    const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
    const target = join(OUT, "public", file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await res.text(), "utf8");
    console.log(`   ✓ ${file}`);
  }

  // Servidor + API + banco
  await cp(join(here, "server.mjs"), join(OUT, "server.mjs"));
  await cp(join(here, "api.mjs"), join(OUT, "api.mjs"));
  await cp(join(here, "config.mjs"), join(OUT, "config.mjs"));
  await cp(join(here, "schema.sql"), join(OUT, "schema.sql"));
  await cp(join(here, "env.example"), join(OUT, ".env.example"));
  await cp(join(here, "ecosystem.config.cjs"), join(OUT, "ecosystem.config.cjs"));
  await mkdir(join(OUT, "uploads"), { recursive: true });

  const pkg = JSON.parse(await (await import("node:fs/promises")).readFile(join(root, "package.json"), "utf8"));
  const pick = (name) => pkg.dependencies[name];
  await writeFile(
    join(OUT, "package.json"),
    `${JSON.stringify(
      {
        name: "rgmtech-site",
        version: pkg.version,
        private: true,
        type: "module",
        engines: { node: ">=20" },
        scripts: { start: "node server.mjs" },
        dependencies: {
          compression: pick("compression"),
          express: pick("express"),
          multer: pick("multer"),
          mysql2: pick("mysql2"),
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `\n✅ Pronto: ${OUT}\n   Envie a pasta para o servidor, rode 'npm install --omit=dev' e inicie com 'node server.mjs' (ou PM2).`,
  );
} finally {
  server.kill("SIGTERM");
}
