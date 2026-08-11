import { useState } from "react";
import { signIn, signUp, type AuthUser } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkflowLogin({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = mode === "login" ? await signIn(email, password) : await signUp(name, email, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-2xl font-bold">Workflow de Profissionais</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? "Entre para acessar o quadro de casos." : "Crie seu acesso à aplicação."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Não tem acesso? Criar conta" : "Já tenho conta — entrar"}
        </button>
      </div>
    </div>
  );
}
