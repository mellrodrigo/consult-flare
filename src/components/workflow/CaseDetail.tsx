import { useState } from "react";
import { Download, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStageLabel, getStages } from "@/lib/workflow";
import {
  advance,
  attachmentUrl,
  createInterview,
  deleteAttachment,
  deleteCase,
  deleteInterview,
  updateCase,
  updateInterview,
  uploadAttachments,
  type AttachmentRow,
  type CaseFields,
  type FullCase,
  type InterviewRow,
} from "@/lib/workflow-api";

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR");
}

interface Props {
  data: FullCase;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function CaseDetail({ data, onClose, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stages = getStages(data.type);
  const curIndex = stages.findIndex((s) => s.key === data.current_stage);
  const curStage = stages[curIndex];
  const terminal = data.status !== "active";
  const statusLabel = data.status === "done" ? "Concluído" : "Reprovado";

  const lastRealStage = [...data.history]
    .reverse()
    .map((h) => h.from_stage)
    .find((s) => s && stages.some((st) => st.key === s));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      try {
        await onChanged();
      } catch {
        /* caso pode ter sido removido */
      }
      setBusy(false);
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border p-6">
          <span
            className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${
              data.type === "NTT" ? "bg-accent text-foreground" : "bg-gold/15 text-gold"
            }`}
          >
            {data.type === "NTT" ? "Profissional NTT" : "Contratação"}
          </span>
          <SheetTitle className="font-display text-xl">{data.cand_name || data.title}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {data.role}
            {data.area ? ` · ${data.area}` : ""}
          </p>
          <p className="mt-2 text-sm">
            Etapa atual:{" "}
            <strong className={terminal ? (data.status === "done" ? "text-primary" : "text-destructive") : "text-gold"}>
              {getStageLabel(data.type, data.current_stage)}
            </strong>
            {terminal && <span className="ml-2 text-xs text-muted-foreground">({statusLabel})</span>}
          </p>
        </SheetHeader>

        {error && <p className="border-b border-border bg-destructive/10 px-6 py-3 text-sm text-destructive">{error}</p>}

        <Tabs defaultValue="etapas" className="flex-1 p-6">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="etapas">Etapas</TabsTrigger>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="entrevistas">Entrevistas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="etapas" className="mt-6">
            <StepsTab
              data={data}
              curIndex={curIndex}
              isDecision={Boolean(curStage?.isDecision)}
              terminal={terminal}
              busy={busy}
              run={run}
              lastRealStage={lastRealStage ?? null}
            />
          </TabsContent>
          <TabsContent value="dados" className="mt-6">
            <DataTab data={data} busy={busy} run={run} />
          </TabsContent>
          <TabsContent value="arquivos" className="mt-6">
            <FilesTab data={data} busy={busy} run={run} />
          </TabsContent>
          <TabsContent value="entrevistas" className="mt-6">
            <InterviewsTab data={data} busy={busy} run={run} />
          </TabsContent>
          <TabsContent value="historico" className="mt-6">
            <ul className="space-y-3">
              {data.history.map((h) => (
                <li key={h.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="font-medium">
                    {h.from_stage ? getStageLabel(data.type, h.from_stage) : "Início"} →{" "}
                    {getStageLabel(data.type, h.to_stage)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {fmt(h.created_at)}
                    {h.outcome ? ` · ${h.outcome}` : ""}
                  </div>
                  {h.note && <p className="mt-2 text-sm text-muted-foreground">{h.note}</p>}
                </li>
              ))}
              {data.history.length === 0 && <li className="text-sm text-muted-foreground">Sem histórico.</li>}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border p-6">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => {
              if (confirm("Excluir este caso e todos os dados associados?")) {
                void run(async () => {
                  await deleteCase(data.id);
                  onClose();
                });
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir caso
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepsTab({
  data,
  curIndex,
  isDecision,
  terminal,
  busy,
  run,
  lastRealStage,
}: {
  data: FullCase;
  curIndex: number;
  isDecision: boolean;
  terminal: boolean;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  lastRealStage: string | null;
}) {
  const [note, setNote] = useState("");
  const stages = getStages(data.type);
  const displayIndex = curIndex >= 0 ? curIndex : stages.findIndex((s) => s.key === lastRealStage);

  return (
    <div className="space-y-6">
      <ol className="space-y-2">
        {stages.map((s, i) => (
          <li key={s.key} className="flex items-start gap-3 text-sm" title={s.hint}>
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                i < displayIndex ? "bg-primary" : i === displayIndex ? "bg-gold" : "bg-border"
              }`}
            />
            <span className={i === displayIndex ? "font-medium text-foreground" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {!terminal ? (
        <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
          <Label>Observação (opcional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota sobre esta transição" />
          <div className="flex flex-wrap gap-2">
            {isDecision ? (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await advance(data, { outcome: "approved", note });
                      setNote("");
                    })
                  }
                >
                  Aprovar e avançar
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await advance(data, { outcome: "rejected", note });
                      setNote("");
                    })
                  }
                >
                  Reprovar (encerra)
                </Button>
              </>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await advance(data, { outcome: "advance", note });
                    setNote("");
                  })
                }
              >
                Avançar para próxima etapa →
              </Button>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <Label>Mover para etapa específica</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value=""
              disabled={busy}
              onChange={(e) => {
                const value = e.target.value;
                if (value) void run(() => advance(data, { toStage: value, note }));
              }}
            >
              <option value="">Selecionar…</option>
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-sm text-muted-foreground">
            Reabrir devolve o caso à etapa em que estava antes de ser encerrado.
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() =>
                advance(data, {
                  toStage: lastRealStage || stages[0]!.key,
                  note: "Caso reaberto",
                }),
              )
            }
          >
            Reabrir caso
          </Button>
        </div>
      )}
    </div>
  );
}

function DataTab({
  data,
  busy,
  run,
}: {
  data: FullCase;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState<CaseFields>({
    cand_name: data.cand_name ?? "",
    cand_email: data.cand_email ?? "",
    cand_phone: data.cand_phone ?? "",
    cand_linkedin: data.cand_linkedin ?? "",
    role: data.role ?? "",
    manager: data.manager ?? "",
    area: data.area ?? "",
    notes: data.notes ?? "",
  });
  const set = (k: keyof CaseFields) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Nome">
          <Input value={form.cand_name ?? ""} onChange={set("cand_name")} />
        </Row>
        <Row label="Cargo / Função">
          <Input value={form.role ?? ""} onChange={set("role")} />
        </Row>
        <Row label="Email">
          <Input value={form.cand_email ?? ""} onChange={set("cand_email")} />
        </Row>
        <Row label="Telefone">
          <Input value={form.cand_phone ?? ""} onChange={set("cand_phone")} />
        </Row>
        <Row label="LinkedIn">
          <Input value={form.cand_linkedin ?? ""} onChange={set("cand_linkedin")} />
        </Row>
        <Row label="Área (cliente)">
          <Input value={form.area ?? ""} onChange={set("area")} />
        </Row>
        <Row label="Gestor (cliente)">
          <Input value={form.manager ?? ""} onChange={set("manager")} />
        </Row>
      </div>
      <Row label="Observações">
        <Textarea rows={4} value={form.notes ?? ""} onChange={set("notes")} />
      </Row>
      <Button disabled={busy} onClick={() => run(() => updateCase(data.id, form))}>
        Salvar dados
      </Button>
    </div>
  );
}

function FilesTab({
  data,
  busy,
  run,
}: {
  data: FullCase;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [kind, setKind] = useState("cv");
  const [files, setFiles] = useState<FileList | null>(null);

  async function download(att: AttachmentRow) {
    const url = await attachmentUrl(att.storage_path);
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
        <Label>Tipo do arquivo</Label>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="cv">Currículo (CV)</option>
          <option value="carta_oferta">Carta oferta</option>
          <option value="maquina">Dados da máquina</option>
          <option value="chamado">Comprovante de chamado</option>
          <option value="other">Outro</option>
        </select>
        <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        <Button
          disabled={busy || !files?.length}
          onClick={() =>
            run(async () => {
              if (files?.length) await uploadAttachments(data.id, files, kind);
              setFiles(null);
            })
          }
        >
          Enviar arquivo(s)
        </Button>
      </div>

      <ul className="space-y-2">
        {data.attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{a.original_name}</div>
              <div className="text-xs text-muted-foreground">
                {a.kind} · {fmt(a.created_at)}
                {a.size ? ` · ${Math.round(a.size / 1024)} KB` : ""}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="icon" variant="ghost" onClick={() => void download(a)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" disabled={busy} onClick={() => run(() => deleteAttachment(a))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {data.attachments.length === 0 && <li className="text-sm text-muted-foreground">Nenhum arquivo enviado.</li>}
      </ul>
    </div>
  );
}

function InterviewsTab({
  data,
  busy,
  run,
}: {
  data: FullCase;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    kind: "candidato",
    scheduled_at: "",
    interviewer: "",
    location: "",
    notes: "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Tipo">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.kind}
              onChange={set("kind")}
            >
              <option value="candidato">Entrevista de candidato</option>
              <option value="serasa">Entrevista com o cliente</option>
              <option value="ntt">Entrevista interna</option>
            </select>
          </Row>
          <Row label="Data e hora">
            <Input type="datetime-local" value={form.scheduled_at} onChange={set("scheduled_at")} />
          </Row>
          <Row label="Entrevistador">
            <Input value={form.interviewer} onChange={set("interviewer")} />
          </Row>
          <Row label="Local / link">
            <Input value={form.location} onChange={set("location")} />
          </Row>
        </div>
        <Row label="Notas">
          <Textarea rows={2} value={form.notes} onChange={set("notes")} />
        </Row>
        <Button
          disabled={busy}
          onClick={() =>
            run(async () => {
              await createInterview(data.id, {
                ...form,
                scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
              });
              setForm({ kind: "candidato", scheduled_at: "", interviewer: "", location: "", notes: "" });
            })
          }
        >
          Agendar entrevista
        </Button>
      </div>

      <ul className="space-y-2">
        {data.interviews.map((i: InterviewRow) => (
          <li key={i.id} className="rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{fmt(i.scheduled_at)}</div>
                <div className="text-xs text-muted-foreground">
                  {i.kind} {i.interviewer ? `· ${i.interviewer}` : ""} {i.location ? `· ${i.location}` : ""}
                </div>
                {i.notes && <p className="mt-2 text-sm text-muted-foreground">{i.notes}</p>}
              </div>
              <Button size="icon" variant="ghost" disabled={busy} onClick={() => run(() => deleteInterview(i.id))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <select
              className="mt-3 h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={i.result}
              disabled={busy}
              onChange={(e) => run(() => updateInterview(i.id, { result: e.target.value }))}
            >
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
            </select>
          </li>
        ))}
        {data.interviews.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma entrevista agendada.</li>}
      </ul>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
