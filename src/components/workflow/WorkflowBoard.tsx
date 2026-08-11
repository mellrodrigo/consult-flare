import { WORKFLOWS, type CaseType } from "@/lib/workflow";
import type { CaseRow } from "@/lib/workflow-api";

interface Props {
  type: CaseType;
  cases: CaseRow[];
  onOpen: (id: string) => void;
}

export function WorkflowBoard({ type, cases, onOpen }: Props) {
  const columns = [
    ...WORKFLOWS[type].stages.map((s) => ({ key: s.key, label: s.label, hint: s.hint, kind: "" })),
    { key: "concluido", label: "Concluído", hint: "Casos finalizados com sucesso.", kind: "done" },
    { key: "reprovado", label: "Reprovado", hint: "Casos encerrados por reprovação.", kind: "rejected" },
  ];

  const byStage: Record<string, CaseRow[]> = {};
  for (const col of columns) byStage[col.key] = [];
  for (const c of cases) byStage[c.current_stage]?.push(c);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {columns.map((col) => (
        <div
          key={col.key}
          className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-surface/60 ${
            col.kind === "done"
              ? "border-primary/40"
              : col.kind === "rejected"
                ? "border-destructive/40"
                : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-2 border-b border-border/70 px-4 py-3" title={col.hint}>
            <span className="font-display text-sm font-semibold leading-snug">{col.label}</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
              {byStage[col.key]?.length ?? 0}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            {(byStage[col.key] ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-gold/50"
              >
                <div className="font-display text-sm font-semibold">{c.cand_name || c.title || "Sem nome"}</div>
                {c.role && <div className="mt-0.5 text-xs text-muted-foreground">{c.role}</div>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.area && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-foreground">{c.area}</span>
                  )}
                  {c.manager && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      Gestor: {c.manager}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {(byStage[col.key]?.length ?? 0) === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">—</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
