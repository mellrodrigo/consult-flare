// A Hostinger instala as dependências com NODE_ENV=production, e nesse modo o
// `npm install` pula as devDependencies — o vite e os plugins que fazem o build
// ficam de fora e `npm run build` quebra.
//
// Este script roda antes do build: se qualquer devDependency declarada estiver
// faltando, reinstala tudo com --include=dev. Quando já está tudo no lugar
// (dev local, CI), ele não faz nada.
//
// Checar só o `vite` não basta: ele costuma entrar como dependência transitiva
// e passar no teste enquanto o `@lovable.dev/vite-tanstack-config` — importado
// pelo vite.config.ts — continua ausente.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const devDeps = Object.keys(pkg.devDependencies ?? {});

// Presença no disco em vez de require.resolve: pacotes com `exports` restrito
// (e os @types/*) não são resolvíveis por especificador, mas têm package.json.
const missing = () =>
  devDeps.filter((name) => !existsSync(join(root, "node_modules", name, "package.json")));

const before = missing();
if (before.length === 0) {
  process.exit(0);
}

console.log(
  `→ ${before.length} devDependencies ausentes (NODE_ENV=production?): ${before.slice(0, 5).join(", ")}` +
    `${before.length > 5 ? ", …" : ""}`,
);
console.log("→ Reinstalando com --include=dev…");

const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["install", "--include=dev", "--no-audit", "--no-fund"],
  { stdio: "inherit", cwd: root, env: { ...process.env, NODE_ENV: "development" } },
);

if (result.status !== 0) {
  console.error("Falha ao instalar as devDependencies necessárias para o build.");
  process.exit(result.status ?? 1);
}

const after = missing();
if (after.length > 0) {
  console.error(`Ainda faltam devDependencies depois do install: ${after.join(", ")}`);
  process.exit(1);
}
