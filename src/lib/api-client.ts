// Cliente HTTP do backend PHP/MySQL hospedado na Hostinger.
// Em produção, a API fica em https://seudominio.com.br/api/ (mesma origem do site).
// Para apontar para outro host, defina VITE_API_BASE_URL no build.

const BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined)?.replace(/\/$/, "") ?? "/api";
const TOKEN_KEY = "rgm.workflow.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(route: string, params: Record<string, string> = {}): string {
  const qs = new URLSearchParams({ route, ...params });
  return `${BASE}/index.php?${qs.toString()}`;
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }
  const data = payload as { error?: string } | null;
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return payload as T;
}

export async function api<T>(
  route: string,
  options: { method?: string; params?: Record<string, string>; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(apiUrl(route, options.params ?? {}), {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  return handle<T>(res);
}

export async function apiUpload<T>(
  route: string,
  params: Record<string, string>,
  form: FormData,
): Promise<T> {
  const token = getToken();
  const res = await fetch(apiUrl(route, params), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  return handle<T>(res);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const out = await api<{ token: string; user: AuthUser }>("auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(out.token);
  return out.user;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const out = await api<{ token: string; user: AuthUser }>("auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
  setToken(out.token);
  return out.user;
}

export async function signOut(): Promise<void> {
  try {
    await api("auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function currentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const out = await api<{ user: AuthUser | null }>("auth/me");
    if (!out.user) setToken(null);
    return out.user;
  } catch {
    setToken(null);
    return null;
  }
}
