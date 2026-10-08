import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [{ label: "Serviços", hash: "servicos" }, { label: "Método", hash: "metodo" }, { label: "Contato", hash: "contato" }];
type Solution = { label: string; description: string; to: "/solucoes/workflow-profissionais" | "/solucoes/saloes-de-beleza"; href?: never } | { label: string; description: string; href: string; to?: never };
const solutions: Solution[] = [
  { label: "Salões de beleza", description: "Agenda, clientes e gestão sob medida", to: "/solucoes/saloes-de-beleza" },
  { label: "Workflow de Profissionais", description: "Contratação e acompanhamento de profissionais", to: "/solucoes/workflow-profissionais" },
  { label: "Raio X da Fatura", description: "Visão de gastos, parcelas e planejamento", href: "/raio-x-fatura.html" },
];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionLinks = (mobile = false) => solutions.map(solution => {
    const content = <><span className="block text-sm font-semibold">{solution.label}</span><span className="mt-1 block text-xs text-muted-foreground">{solution.description}</span></>;
    const className = "block rounded-md px-4 py-3 transition-colors hover:bg-accent";
    return solution.to ? <Link key={solution.label} to={solution.to} className={className} onClick={() => { setOpen(false); setSolutionsOpen(false); }}>{content}</Link> : <a key={solution.label} href={solution.href} className={className} onClick={() => mobile && setOpen(false)}>{content}</a>;
  });
  return <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6">
      <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="RGMtech — início"><img src="/logo-rgmtech.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" /><span className="font-display text-xl font-semibold">RGM<span className="text-gradient-gold">tech</span></span></Link>
      <nav aria-label="Menu principal" className="hidden items-center gap-6 lg:flex">
        <div className="relative"><Button variant="ghost" onClick={() => setSolutionsOpen(!solutionsOpen)} aria-expanded={solutionsOpen} className="text-muted-foreground">Soluções <ChevronDown className={solutionsOpen ? "rotate-180" : ""} /></Button>{solutionsOpen && <><div className="fixed inset-0 top-20" onClick={() => setSolutionsOpen(false)} /><div className="absolute left-0 top-full z-10 mt-3 w-80 rounded-lg border border-border bg-surface p-2 shadow-[var(--shadow-soft)]">{solutionLinks()}</div></>}</div>
        {links.map(link => <Link key={link.hash} to="/" hash={link.hash} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>)}
      </nav>
      <div className="flex items-center gap-2"><Button asChild variant="ghost" className="hidden text-muted-foreground xl:inline-flex"><Link to="/workflow">Entrar</Link></Button><Button asChild variant="outline" className="hidden border-gold/40 text-gold sm:inline-flex"><Link to="/" hash="contato">Vamos conversar <ArrowUpRight /></Link></Button><Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div>
    </div>
    {open && <nav aria-label="Menu de navegação" className="max-h-[calc(100dvh-5rem)] overflow-auto border-t border-border px-6 pb-6 lg:hidden"><p className="px-4 pb-2 pt-5 text-xs font-semibold uppercase text-gold">Soluções</p>{solutionLinks(true)}<div className="mt-3 border-t border-border pt-3">{links.map(link => <Link key={link.hash} to="/" hash={link.hash} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm">{link.label}</Link>)}<Link to="/workflow" className="block px-4 py-3 text-sm text-gold" onClick={() => setOpen(false)}>Entrar na aplicação</Link></div></nav>}
  </header>;
}
