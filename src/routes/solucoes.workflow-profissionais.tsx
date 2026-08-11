import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ClipboardList, GitBranch, Users } from "lucide-react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

const title = "Workflow de Profissionais — Consultoria | RGMtech";
const description =
  "Solução RGMtech para orquestrar alocação, aprovações e entregas de equipes de consultoria em um único fluxo controlado.";

export const Route = createFileRoute("/solucoes/workflow-profissionais")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: WorkflowProfissionais,
});

const capabilities = [
  {
    icon: Users,
    title: "Cadastro e senioridade",
    text: "Perfil, skills, certificações e disponibilidade de cada consultor em um só lugar.",
  },
  {
    icon: GitBranch,
    title: "Fluxo de alocação",
    text: "Da demanda do cliente à alocação aprovada, com etapas e responsáveis definidos.",
  },
  {
    icon: ClipboardList,
    title: "Apontamento de horas",
    text: "Registro de horas por projeto, com validação do gestor e base para faturamento.",
  },
  {
    icon: CheckCircle2,
    title: "Aprovações e SLA",
    text: "Alçadas configuráveis, prazos monitorados e histórico completo de decisões.",
  },
];

const steps = [
  "Demanda registrada pelo comercial ou pelo cliente no portal",
  "Motor de match sugere profissionais por skill, custo e disponibilidade",
  "Gestor aprova a alocação e o contrato é vinculado ao projeto",
  "Horas apontadas alimentam faturamento e indicadores de margem",
];

function WorkflowProfissionais() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para a home
            </Link>

            <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              Solução
            </span>

            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] md:text-5xl">
              Workflow de Profissionais{" "}
              <span className="text-gradient-gold">para consultoria</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Um único fluxo para captar demanda, alocar o profissional certo, controlar
              horas e fechar o faturamento — sem planilhas paralelas e sem perder margem no
              caminho.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contato"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5"
              >
                Solicitar demonstração
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <h2 className="font-display text-3xl font-bold md:text-4xl">O que a solução cobre</h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {capabilities.map(({ icon: Icon, title: capTitle, text }) => (
              <article key={capTitle} className="bento-card p-7">
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-lg font-semibold">{capTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <h2 className="max-w-lg font-display text-3xl font-bold md:text-4xl">
              Como o fluxo funciona na prática
            </h2>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step} className="bg-background p-7">
                  <span className="font-display text-sm font-semibold text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
