// Gera a pasta `dist-hostinger/` pronta para subir no public_html da Hostinger.
//
//   node deploy/hostinger/build.mjs
//
// O que ele faz:
//  1. builda o app com o preset Node (vite.config.hostinger.ts)
//  2. sobe o servidor gerado localmente e salva o HTML renderizado de cada rota
//  3. copia os assets estáticos, o .htaccess e a API PHP
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const OUT = join(root, "dist-hostinger");
const PORT = 4321;

// Rotas que viram arquivos HTML. Rotas dinâmicas caem no fallback do .htaccess.
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

console.log("→ Subindo servidor temporário para gerar o HTML…");
const server = spawn("node", [".output/server/index.mjs"], {
  cwd: root,
  stdio: "ignore",
  env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1" },
});

try {
  await waitForServer();

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(join(root, ".output/public"), OUT, { recursive: true });

  for (const route of ROUTES) {
    const res = await fetch(`http://127.0.0.1:${PORT}${route}`);
    if (!res.ok) throw new Error(`Falha ao renderizar ${route}: ${res.status}`);
    const html = await res.text();
    const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
    const target = join(OUT, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
    console.log(`   ✓ ${file}`);
  }

  // .htaccess (SPA fallback + headers) e API PHP
  await writeFile(join(OUT, ".htaccess"), await readFile(join(here, "htaccess.txt"), "utf8"), "utf8");
  await cp(join(here, "api"), join(OUT, "api"), { recursive: true });
  await mkdir(join(OUT, "api/uploads"), { recursive: true });
  await writeFile(join(OUT, "api/uploads/.htaccess"), "Require all denied\n", "utf8");

  console.log(`\n✅ Pronto: ${OUT}\n   Suba TODO o conteúdo dessa pasta para o public_html na Hostinger.`);
} finally {
  server.kill("SIGTERM");
}
