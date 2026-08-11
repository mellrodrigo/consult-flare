// Configuração compartilhada entre o servidor da raiz (hostinger-server.mjs) e o
// pacote gerado em dist-node/ (server.mjs). Um único lugar para ler o .env e
// montar o objeto de configuração da API — evita que os dois sirvam a API com
// opções diferentes.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Carrega um .env simples (KEY=valor) sem depender de pacote externo. */
export function loadEnv(dir) {
  const envFile = join(dir, ".env");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const bool = (value, fallback) =>
  value === undefined ? fallback : ["1", "true", "yes", "on"].includes(String(value).toLowerCase());

/**
 * Monta a configuração da API a partir das variáveis de ambiente.
 * @param {string} dir diretório base para resolver caminhos relativos (uploads).
 */
export function buildConfig(dir, { version = "0.0.0" } = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    version,
    db: {
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "workflow",
    },
    uploadsDir: resolve(dir, process.env.UPLOADS_DIR ?? "./uploads"),
    allowSignup: bool(process.env.ALLOW_SIGNUP, true),
    signupEmailDomain: process.env.SIGNUP_EMAIL_DOMAIN ?? "",
    cookieName: process.env.SESSION_COOKIE ?? "rgm_session",
    // Secure só em produção: em HTTP local o navegador descartaria o cookie.
    secureCookies: bool(process.env.SESSION_COOKIE_SECURE, isProduction),
    sessionDays: Number(process.env.SESSION_DAYS ?? 30),
    // Primeiro acesso: só age quando a tabela `users` está vazia.
    admin: {
      username: process.env.ADMIN_USERNAME ?? "",
      password: process.env.ADMIN_PASSWORD ?? "",
      name: process.env.ADMIN_NAME ?? "",
    },
  };
}

/** Lê a versão declarada no package.json indicado (silencioso em caso de erro). */
export function readVersion(packageJsonPath) {
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}
