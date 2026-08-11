// A Hostinger instala as dependências com NODE_ENV=production, e nesse modo o
// `npm install` pula as devDependencies — o vite (que faz o build) fica de fora
// e `npm run build` quebra com "vite: not found".
//
// Este script roda antes do build: se o vite não estiver instalado, reinstala
// incluindo as devDependencies. Quando já está tudo no lugar (dev local, CI),
// ele não faz nada.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function hasBuildDeps() {
  try {
    require.resolve("vite/package.json");
    return true;
  } catch {
    return false;
  }
}

if (hasBuildDeps()) {
  process.exit(0);
}

console.log("→ devDependencies ausentes (NODE_ENV=production?). Instalando com --include=dev…");
const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["install", "--include=dev", "--no-audit", "--no-fund"],
  { stdio: "inherit", env: { ...process.env, NODE_ENV: "development" } },
);

if (result.status !== 0) {
  console.error("Falha ao instalar as devDependencies necessárias para o build.");
  process.exit(result.status ?? 1);
}

if (!hasBuildDeps()) {
  console.error("O vite continua ausente depois do install. Verifique o registro npm do servidor.");
  process.exit(1);
}
