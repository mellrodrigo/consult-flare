import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORKFLOWS, type CaseType } from "@/lib/workflow";
import { createCase, type CaseFields, type CaseRow } from "@/lib/workflow-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: CaseRow) => void;
}

const empty: CaseFields = {
  cand_name: "",
  cand_email: "",
  cand_phone: "",
  cand_linkedin: "",
  role: "",
  manager: "",
  area: "",
  notes: "",
};

export function NewCaseDialog({ open, onOpenChange, onCreated }: Props) {
  const [type, setType] = useState<CaseType>("CONTRATACAO");
  const [form, setForm] = useState<CaseFields>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof CaseFields) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await createCase({ ...form, type, title: form.cand_name || "Novo caso" });
      setForm(empty);
      setType("CONTRATACAO");
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar caso");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Novo caso</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label>Trilha</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(WORKFLOWS) as CaseType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    type === k ? "border-gold bg-accent" : "border-border hover:border-gold/40"
                  }`}
                >
                  <span className="block font-display font-semibold">{WORKFLOWS[k].label}</span>
                  <span className="block text-xs text-muted-foreground">{WORKFLOWS[k].sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input value={form.cand_name ?? ""} onChange={set("cand_name")} required />
            </Field>
            <Field label="Cargo / Função">
              <Input value={form.role ?? ""} onChange={set("role")} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.cand_email ?? ""} onChange={set("cand_email")} />
            </Field>
            <Field label="Telefone">
              <Input value={form.cand_phone ?? ""} onChange={set("cand_phone")} />
            </Field>
            <Field label="LinkedIn">
              <Input value={form.cand_linkedin ?? ""} onChange={set("cand_linkedin")} />
            </Field>
            <Field label="Área (cliente)">
              <Input value={form.area ?? ""} onChange={set("area")} />
            </Field>
            <Field label="Gestor (cliente)">
              <Input value={form.manager ?? ""} onChange={set("manager")} />
            </Field>
          </div>

          <Field label="Observações">
            <Textarea rows={3} value={form.notes ?? ""} onChange={set("notes")} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Criando…" : "Criar caso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
