import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { currentUser, signOut, type AuthUser } from "@/lib/api-client";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { WorkflowLogin } from "@/components/workflow/WorkflowLogin";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
import { NewCaseDialog } from "@/components/workflow/NewCaseDialog";
import { CaseDetail } from "@/components/workflow/CaseDetail";
import { Button } from "@/components/ui/button";
import { WORKFLOWS, type CaseType } from "@/lib/workflow";
import { getCase, listCases, type CaseRow, type FullCase } from "@/lib/workflow-api";


const title = "Workflow de Profissionais — Aplicação | RGMtech";
const description =
  "Aplicação RGMtech para gerenciar entrevistas, contratação, acessos e entrega de equipamento dos profissionais alocados.";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: WorkflowApp,
});

function WorkflowApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [track, setTrack] = useState<CaseType>("CONTRATACAO");
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selected, setSelected] = useState<FullCase | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setCases([]);
        setSelected(null);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setChecking(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadCases = useCallback(async (t: CaseType) => {
    try {
      setCases(await listCases(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar casos");
    }
  }, []);

  useEffect(() => {
    if (session) void loadCases(track);
  }, [session, track, loadCases]);

  async function openCase(id: string) {
    try {
      setSelected(await getCase(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao abrir caso");
    }
  }

  async function refresh() {
    await loadCases(track);
    if (selected) {
      try {
        setSelected(await getCase(selected.id));
      } catch {
        setSelected(null);
      }
    }
  }

  const counts = {
    active: cases.filter((c) => c.status === "active").length,
    done: cases.filter((c) => c.status === "done").length,
    rejected: cases.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {checking ? (
          <p className="px-6 py-20 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !session ? (
          <WorkflowLogin />
        ) : (
          <div className="mx-auto max-w-[100rem] px-6 py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold">Workflow de Profissionais</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entrevista, contratação, acessos e entrega de equipamento em um único fluxo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{session.user.email}</span>
                <Button variant="ghost" onClick={() => void supabase.auth.signOut()}>
                  Sair
                </Button>
                <Button onClick={() => setShowNew(true)}>+ Novo caso</Button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {(Object.keys(WORKFLOWS) as CaseType[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setTrack(k)}
                  className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                    track === k
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {WORKFLOWS[k].label} <span className="text-xs opacity-70">· {WORKFLOWS[k].sub}</span>
                </button>
              ))}
              <div className="ml-auto flex gap-4 text-sm text-muted-foreground">
                <span>{counts.active} em andamento</span>
                <span className="text-primary">{counts.done} concluídos</span>
                <span className="text-destructive">{counts.rejected} reprovados</span>
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-8">
              <WorkflowBoard type={track} cases={cases} onOpen={(id) => void openCase(id)} />
            </div>
          </div>
        )}
      </main>

      <SiteFooter />

      <NewCaseDialog
        open={showNew}
        onOpenChange={setShowNew}
        onCreated={async (created) => {
          setShowNew(false);
          setTrack(created.type);
          await loadCases(created.type);
          void openCase(created.id);
        }}
      />

      {selected && (
        <CaseDetail
          data={selected}
          onClose={() => {
            setSelected(null);
            void loadCases(track);
          }}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
