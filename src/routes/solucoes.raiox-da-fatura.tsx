import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileSearch,
  PieChart,
  ScanSearch,
  TrendingDown,
} from "lucide-react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

const title = "Raio X da Fatura — Consultoria | RGMtech";
const description =
  "Solução RGMtech que dispara um raio-x completo das suas faturas: leitura automática, categorização de gastos e detecção de economias escondidas.";

export const Route = createFileRoute("/solucoes/raiox-da-fatura")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      {
        property: "og:url",
        content: "https://rgmtech.com.br/solucoes/raiox-da-fatura",
      },
      { property: "og:site_name", content: "RGMtech" },
      { property: "og:locale", content: "pt_BR" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://rgmtech.com.br/solucoes/raiox-da-fatura",
      },
    ],
  }),
  component: RaioxDaFatura,
});

const capabilities = [
  {
    icon: ScanSearch,
    title: "Leitura automática",
    text: "Importação e leitura de faturas em PDF, XML ou foto, sem digitação manual.",
  },
  {
    icon: PieChart,
    title: "Categorização inteligente",
    text: "Cada lançamento classificado por centro de custo, fornecedor e natureza do gasto.",
  },
  {
    icon: TrendingDown,
    title: "Detecção de economias",
    text: "Alertas de cobranças duplicadas, tarifas fora do padrão e itens renegociáveis.",
  },
  {
    icon: FileSearch,
    title: "Relatórios executivos",
    text: "Visão mensal consolidada com evolução de custos e recomendações práticas.",
  },
];

const steps = [
  "Você envia as faturas (PDF, XML ou foto) pelo portal",
  "O motor extrai e categoriza cada lançamento automaticamente",
  "O raio-x aponta desvios, duplicidades e oportunidades de economia",
  "Relatório executivo mensal acompanha a evolução dos custos",
];

function RaioxDaFatura() {
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
              Raio X da Fatura{" "}
              <span className="text-gradient-gold">para sua empresa</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Um diagnóstico completo das suas faturas: leitura automática dos
              lançamentos, categorização por centro de custo e detecção de
              cobranças indevidas — para você saber exatamente onde o dinheiro
              está indo e onde dá para economizar.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/"
                hash="contato"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5"
              >
                Solicitar demonstração
              </Link>
              <Link
                to="/"
                hash="servicos"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-gold/50"
              >
                Ver outros serviços
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            O que a solução cobre
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {capabilities.map(({ icon: Icon, title: capTitle, text }) => (
              <article key={capTitle} className="bento-card p-7">
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-lg font-semibold">
                  {capTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <h2 className="max-w-lg font-display text-3xl font-bold md:text-4xl">
              Como funciona na prática
            </h2>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step} className="bg-background p-7">
                  <span className="font-display text-sm font-semibold text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {step}
                  </p>
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
