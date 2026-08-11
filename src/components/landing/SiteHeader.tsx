import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

const links = [
  { label: "Serviços", hash: "servicos" },
  { label: "Método", hash: "metodo" },
  { label: "Resultados", hash: "resultados" },
  { label: "Contato", hash: "contato" },
];

const solutions = [
  {
    label: "Workflow de Profissionais",
    description: "Alocação, horas e aprovações para consultorias",
    to: "/solucoes/workflow-profissionais" as const,
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
            R
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            RGM<span className="text-gradient-gold">tech</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground"
            >
              Soluções
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>

            <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-soft)]">
                {solutions.map((solution) => (
                  <Link
                    key={solution.to}
                    to={solution.to}
                    className="block rounded-xl px-4 py-3 transition-colors hover:bg-accent"
                    activeProps={{ className: "bg-accent" }}
                  >
                    <span className="block font-display text-sm font-semibold text-foreground">
                      {solution.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {solution.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {links.map((link) => (
            <Link
              key={link.hash}
              to="/"
              hash={link.hash}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/"
          hash="contato"
          className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          Falar com especialista
        </Link>
      </div>
    </header>
  );
}
