// API do Workflow de Profissionais — Node.js + MySQL.
//
// Dois formatos de URL, equivalentes:
//   /api/index.php?route=auth/login   (contrato antigo, usado por src/lib/api-client.ts)
//   /api/auth/login                   (rota por caminho)
//
// Autenticação: cookie de sessão httpOnly (padrão) ou `Authorization: Bearer`.
// Todas as rotas exigem sessão, exceto `health` e `auth/login` (e `auth/signup`
// enquanto não existir nenhum usuário — o primeiro acesso).
import { randomBytes, randomUUID, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import express from "express";
import multer from "multer";
import mysql from "mysql2/promise";

const scrypt = promisify(_scrypt);

export function createApi(config) {
  const uploadsDir = resolve(config.uploadsDir);
  const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "Z",
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  const router = express.Router();
  router.use(express.json({ limit: "1mb" }));

  const q = async (sql, args = []) => {
    const [rows] = await pool.query(sql, args);
    return rows;
  };
  const one = async (sql, args = []) => (await q(sql, args))[0] ?? null;

  async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const key = /** @type {Buffer} */ (await scrypt(password, salt, 64));
    return `scrypt$${salt}$${key.toString("hex")}`;
  }

  async function verifyPassword(password, stored) {
    const [scheme, salt, hex] = String(stored).split("$");
    if (scheme !== "scrypt" || !salt || !hex) return false;
    const key = /** @type {Buffer} */ (await scrypt(password, salt, 64));
    const expected = Buffer.from(hex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  }

  const COOKIE = config.cookieName ?? "rgm_session";
  const SESSION_DAYS = Number(config.sessionDays ?? 30);

  function bearer(req) {
    const h = req.headers.authorization ?? "";
    return h.toLowerCase().startsWith("bearer ") ? h.slice(7) : null;
  }

  function cookies(req) {
    const out = {};
    for (const part of String(req.headers.cookie ?? "").split(";")) {
      const i = part.indexOf("=");
      if (i < 1) continue;
      const key = part.slice(0, i).trim();
      const raw = part.slice(i + 1).trim();
      try {
        out[key] = decodeURIComponent(raw);
      } catch {
        out[key] = raw;
      }
    }
    return out;
  }

  /** Token da sessão: cookie httpOnly (preferido) ou header Authorization. */
  function sessionToken(req) {
    return cookies(req)[COOKIE] || bearer(req);
  }

  function setSessionCookie(res, token) {
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: Boolean(config.secureCookies),
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  function clearSessionCookie(res) {
    res.clearCookie(COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: Boolean(config.secureCookies),
      path: "/",
    });
  }

  async function currentUser(req) {
    // Memoriza no request: dispatch e os handlers pedem o usuário mais de uma vez.
    if ("_user" in req) return req._user;
    const token = sessionToken(req);
    req._user = token
      ? await one(
          `SELECT u.id, u.name, u.email FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > NOW()`,
          [token],
        )
      : null;
    return req._user;
  }

  async function createSession(userId) {
    const token = randomBytes(32).toString("hex");
    await q(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL ? DAY))",
      [token, userId, SESSION_DAYS],
    );
    return token;
  }

  const userCount = async () => Number((await one("SELECT COUNT(*) AS n FROM users"))?.n ?? 0);

  /**
   * Primeiro acesso: cria o usuário de ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_NAME.
   * Só age quando não existe nenhum usuário — reiniciar o servidor nunca
   * sobrescreve nem recria a conta.
   */
  async function ensureAdminUser() {
    const username = String(config.admin?.username ?? "")
      .trim()
      .toLowerCase();
    const password = String(config.admin?.password ?? "");
    if (!username || !password) {
      return { created: false, reason: "ADMIN_USERNAME/ADMIN_PASSWORD ausentes" };
    }
    if ((await userCount()) > 0) {
      return { created: false, reason: "já existem usuários cadastrados" };
    }
    const id = randomUUID();
    await q("INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)", [
      id,
      String(config.admin?.name ?? "").trim() || username,
      username,
      await hashPassword(password),
    ]);
    return { created: true, username };
  }

  const CASE_FIELDS = [
    "title",
    "cand_name",
    "cand_email",
    "cand_phone",
    "cand_linkedin",
    "role",
    "manager",
    "area",
    "notes",
  ];
  const INTERVIEW_FIELDS = ["kind", "scheduled_at", "location", "interviewer", "result", "notes"];

  class HttpError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }

  const handler = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

  async function requireUser(req) {
    const user = await currentUser(req);
    if (!user) throw new HttpError("Não autenticado.", 401);
    return user;
  }

  const nullable = (v) => (v === undefined || v === null || v === "" ? null : v);

  const routes = {
    // Pública: serve para checar se o Node está no ar e se falta o primeiro acesso.
    "GET health": async () => {
      const version = config.version ?? "0.0.0";
      try {
        return { ok: true, version, setup_required: (await userCount()) === 0 };
      } catch (err) {
        console.error("[workflow-api] health: banco indisponível —", err.message);
        return { ok: false, version, setup_required: null };
      }
    },

    "POST auth/signup": async (req, res) => {
      if (!config.allowSignup) throw new HttpError("Cadastro desativado. Peça acesso ao administrador.", 403);
      const name = String(req.body?.name ?? "").trim();
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError("E-mail inválido.");
      if (password.length < 8) throw new HttpError("A senha precisa ter ao menos 8 caracteres.");
      if (config.signupEmailDomain && !email.endsWith(`@${config.signupEmailDomain}`)) {
        throw new HttpError(`O cadastro é restrito a e-mails @${config.signupEmailDomain}.`);
      }
      if (await one("SELECT id FROM users WHERE email = ?", [email])) {
        throw new HttpError("Já existe uma conta com este e-mail.");
      }
      const id = randomUUID();
      await q("INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)", [
        id,
        name || email,
        email,
        await hashPassword(password),
      ]);
      const token = await createSession(id);
      setSessionCookie(res, token);
      return { token, user: { id, name: name || email, email } };
    },

    "POST auth/login": async (req, res) => {
      // Aceita `email` (formulário atual) ou `username` (ADMIN_USERNAME).
      const login = String(req.body?.email ?? req.body?.username ?? "")
        .trim()
        .toLowerCase();
      const password = String(req.body?.password ?? "");
      const user = await one("SELECT id, name, email, password_hash FROM users WHERE email = ?", [
        login,
      ]);
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        throw new HttpError("E-mail ou senha inválidos.", 401);
      }
      const token = await createSession(user.id);
      setSessionCookie(res, token);
      return { token, user: { id: user.id, name: user.name, email: user.email } };
    },

    "POST auth/logout": async (req, res) => {
      const token = sessionToken(req);
      if (token) await q("DELETE FROM sessions WHERE token = ?", [token]);
      clearSessionCookie(res);
      return { ok: true };
    },

    "GET auth/me": async (req) => ({ user: await currentUser(req) }),

    "GET cases": async (req) => {
      await requireUser(req);
      return {
        data: await q("SELECT * FROM cases WHERE type = ? ORDER BY updated_at DESC", [
          String(req.query.type ?? ""),
        ]),
      };
    },

    "GET case": async (req) => {
      await requireUser(req);
      const id = String(req.query.id ?? "");
      const row = await one("SELECT * FROM cases WHERE id = ?", [id]);
      if (!row) throw new HttpError("Caso não encontrado.", 404);
      return {
        data: {
          ...row,
          history: await q("SELECT * FROM stage_history WHERE case_id = ? ORDER BY created_at ASC", [id]),
          interviews: await q("SELECT * FROM interviews WHERE case_id = ? ORDER BY scheduled_at ASC", [id]),
          attachments: await q("SELECT * FROM attachments WHERE case_id = ? ORDER BY created_at DESC", [id]),
        },
      };
    },

    "POST cases": async (req) => {
      const user = await requireUser(req);
      const body = req.body ?? {};
      const id = randomUUID();
      const values = {
        id,
        type: String(body.type ?? ""),
        title: String(body.title ?? body.cand_name ?? "Novo caso"),
        current_stage: String(body.current_stage ?? ""),
        status: "active",
        created_by: user.id,
      };
      for (const f of CASE_FIELDS) {
        if (f !== "title" && f in body) values[f] = nullable(body[f]);
      }
      const cols = Object.keys(values);
      await q(
        `INSERT INTO cases (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        Object.values(values),
      );
      await q(
        "INSERT INTO stage_history (id, case_id, from_stage, to_stage, outcome, note, author) VALUES (?,?,NULL,?,?,?,?)",
        [randomUUID(), id, values.current_stage, "created", "Caso criado", user.id],
      );
      return { data: await one("SELECT * FROM cases WHERE id = ?", [id]) };
    },

    "PATCH case": async (req) => {
      await requireUser(req);
      const body = req.body ?? {};
      const fields = CASE_FIELDS.filter((f) => f in body);
      if (!fields.length) return { ok: true };
      await q(
        `UPDATE cases SET ${fields.map((f) => `${f} = ?`).join(",")} WHERE id = ?`,
        [...fields.map((f) => nullable(body[f])), String(req.query.id ?? "")],
      );
      return { ok: true };
    },

    "DELETE case": async (req) => {
      await requireUser(req);
      const id = String(req.query.id ?? "");
      await q("DELETE FROM cases WHERE id = ?", [id]);
      await rm(join(uploadsDir, id), { recursive: true, force: true });
      return { ok: true };
    },

    "POST case/advance": async (req) => {
      const user = await requireUser(req);
      const id = String(req.query.id ?? "");
      const body = req.body ?? {};
      const row = await one("SELECT current_stage FROM cases WHERE id = ?", [id]);
      if (!row) throw new HttpError("Caso não encontrado.", 404);
      await q("UPDATE cases SET current_stage = ?, status = ? WHERE id = ?", [
        String(body.to_stage ?? ""),
        String(body.status ?? "active"),
        id,
      ]);
      await q(
        "INSERT INTO stage_history (id, case_id, from_stage, to_stage, outcome, note, author) VALUES (?,?,?,?,?,?,?)",
        [
          randomUUID(),
          id,
          row.current_stage,
          String(body.to_stage ?? ""),
          String(body.outcome ?? "set"),
          nullable(body.note),
          user.id,
        ],
      );
      return { ok: true };
    },

    "POST interviews": async (req) => {
      await requireUser(req);
      const body = req.body ?? {};
      await q(
        "INSERT INTO interviews (id, case_id, kind, scheduled_at, location, interviewer, result, notes) VALUES (?,?,?,?,?,?,?,?)",
        [
          randomUUID(),
          String(req.query.id ?? ""),
          nullable(body.kind),
          nullable(body.scheduled_at)?.replace("T", " ") ?? null,
          nullable(body.location),
          nullable(body.interviewer),
          String(body.result ?? "pending"),
          nullable(body.notes),
        ],
      );
      return { ok: true };
    },

    "PATCH interview": async (req) => {
      await requireUser(req);
      const body = req.body ?? {};
      const fields = INTERVIEW_FIELDS.filter((f) => f in body);
      if (!fields.length) return { ok: true };
      await q(
        `UPDATE interviews SET ${fields.map((f) => `${f} = ?`).join(",")} WHERE id = ?`,
        [
          ...fields.map((f) =>
            f === "scheduled_at" ? (nullable(body[f])?.replace("T", " ") ?? null) : nullable(body[f]),
          ),
          String(req.query.id ?? ""),
        ],
      );
      return { ok: true };
    },

    "DELETE interview": async (req) => {
      await requireUser(req);
      await q("DELETE FROM interviews WHERE id = ?", [String(req.query.id ?? "")]);
      return { ok: true };
    },

    "DELETE attachment": async (req) => {
      await requireUser(req);
      const id = String(req.query.id ?? "");
      const att = await one("SELECT * FROM attachments WHERE id = ?", [id]);
      if (att) {
        await unlink(join(uploadsDir, att.storage_path)).catch(() => {});
        await q("DELETE FROM attachments WHERE id = ?", [id]);
      }
      return { ok: true };
    },
  };

  // Upload de anexos (multipart) — tratado antes do roteador JSON.
  const uploadHandler = handler(async (req, res) => {
    await requireUser(req);
    if (!req.file) throw new HttpError("Nenhum arquivo enviado.");
    const caseId = String(req.query.id ?? "");
    const original = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    const safe = original.replace(/[^\w.\-]+/gu, "_") || "arquivo";
    const rel = `${caseId}/${randomUUID()}-${safe}`;
    const dest = join(uploadsDir, rel);
    await mkdir(dirname(dest), { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, req.file.buffer);
    await q(
      "INSERT INTO attachments (id, case_id, kind, original_name, storage_path, mime, size) VALUES (?,?,?,?,?,?,?)",
      [
        randomUUID(),
        caseId,
        String(req.body?.kind ?? "other"),
        original,
        rel,
        req.file.mimetype || null,
        req.file.size,
      ],
    );
    res.json({ ok: true });
  });

  const downloadHandler = handler(async (req, res) => {
    await requireUser(req);
    const att = await one("SELECT * FROM attachments WHERE id = ?", [String(req.query.id ?? "")]);
    if (!att) throw new HttpError("Arquivo não encontrado.", 404);
    const path = join(uploadsDir, att.storage_path);
    const info = await stat(path).catch(() => null);
    if (!info) throw new HttpError("Arquivo não encontrado no servidor.", 404);
    res.setHeader("Content-Type", att.mime || "application/octet-stream");
    res.setHeader("Content-Length", String(info.size));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(att.original_name)}`,
    );
    createReadStream(path).pipe(res);
  });

  // Rotas liberadas sem sessão. `auth/signup` entra na lista só enquanto não
  // existir nenhum usuário (primeiro acesso) — ver o gate abaixo.
  const PUBLIC = new Set(["GET health", "POST auth/login"]);

  /** Aceita `?route=auth/login` (contrato antigo) e `/api/auth/login` (por caminho). */
  function resolveRoute(req) {
    const fromQuery = String(req.query.route ?? "").trim();
    return (fromQuery || req.path).replace(/^\/+|\/+$/g, "");
  }

  const dispatch = handler(async (req, res) => {
    const route = resolveRoute(req);
    const key = `${req.method} ${route}`;

    if (!PUBLIC.has(key)) {
      // Cadastro é livre enquanto o sistema está vazio; depois exige sessão.
      if (key !== "POST auth/signup" || (await userCount()) > 0) await requireUser(req);
    }

    if (key === "POST attachments") return void (await new Promise((ok, err) =>
      upload.single("file")(req, res, (e) => (e ? err(e) : ok(undefined))),
    ).then(() => uploadHandler(req, res, (e) => { throw e; })));
    if (key === "GET attachment") return void downloadHandler(req, res, (e) => { throw e; });
    const fn = routes[key];
    if (!fn) throw new HttpError("Rota não encontrada.", 404);
    res.json(await fn(req, res));
  });

  // Um único ponto de entrada: cobre `/api`, `/api/index.php` (versão PHP) e
  // `/api/<rota>`. Precisa vir depois de tudo e antes do tratador de erros.
  router.use(dispatch);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  router.use((err, _req, res, _next) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error("[workflow-api]", err);
    res.status(status).json({ error: status === 500 ? "Erro interno no servidor." : err.message });
  });

  return { router, pool, uploadsDir, ensureAdminUser };
}
