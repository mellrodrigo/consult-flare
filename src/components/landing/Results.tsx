import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Scissors, GitBranch, FileSearch } from "lucide-react";

const solutions = [
  { icon: Scissors, title: "Salões de beleza", text: "Sistemas sob medida para conectar agenda, clientes, equipe e gestão.", to: "/solucoes/saloes-de-beleza" as const },
  { icon: GitBranch, title: "Workflow de Profissionais", text: "Organização dos processos de contratação e acompanhamento de profissionais.", to: "/solucoes/workflow-profissionais" as const },
  { icon: FileSearch, title: "Raio X da Fatura", text: "Uma visão dos gastos e das parcelas para planejar os próximos meses.", href: "/raio-x-fatura.html" },
];
export function Results() {
  return <section id="solucoes" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
    <div className="mb-9 flex flex-col justify-between gap-3 md:flex-row md:items-end"><h2 className="text-3xl font-bold md:text-4xl">Soluções com propósito.</h2><p className="max-w-sm text-sm text-muted-foreground">Tecnologia aplicada aos desafios de quem faz o negócio acontecer.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{solutions.map(({ icon: Icon, title, text, ...destination }) => {
      const content = <><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-gold" /><ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p></>;
      const className = "bento-card group block p-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
      return 'to' in destination ? <Link key={title} to={destination.to} className={className}>{content}</Link> : <a key={title} href={destination.href} className={className}>{content}</a>;
    })}</div>
  </section>;
}
