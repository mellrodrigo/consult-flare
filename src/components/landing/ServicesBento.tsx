import { Boxes, Cpu, LineChart, ShieldCheck, Workflow } from "lucide-react";

export function ServicesBento() {
  return (
    <section id="servicos" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Serviços que resolvem gargalos reais
        </h2>
        <p className="mt-4 text-muted-foreground">
          Nada de projeto genérico. Cada frente nasce de um diagnóstico da sua operação.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
        <article className="bento-card flex flex-col justify-between p-8 md:col-span-2 md:row-span-2">
          <Workflow className="h-9 w-9 text-gold" strokeWidth={1.5} />
          <div className="mt-16">
            <h3 className="font-display text-2xl font-semibold">
              Sistemas sob medida e integrações
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Plataformas internas, portais de cliente e integrações entre ERP, CRM e
              ferramentas legadas. Do levantamento de requisitos à sustentação contínua.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {["APIs", "ERP/CRM", "Migração de dados", "Sustentação"].map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border bg-accent px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="bento-card p-7">
          <Cpu className="h-7 w-7 text-gold" strokeWidth={1.5} />
          <h3 className="mt-6 font-display text-lg font-semibold">Automação de processos</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Rotinas manuais viram fluxos automáticos, com trilha de auditoria.
          </p>
        </article>

        <article className="bento-card p-7">
          <ShieldCheck className="h-7 w-7 text-gold" strokeWidth={1.5} />
          <h3 className="mt-6 font-display text-lg font-semibold">Segurança e governança</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Controle de acesso, LGPD e políticas de dados aplicadas na prática.
          </p>
        </article>

        <article className="bento-card p-7 md:col-span-2">
          <LineChart className="h-7 w-7 text-gold" strokeWidth={1.5} />
          <h3 className="mt-6 font-display text-lg font-semibold">
            Dados e indicadores de gestão
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Painéis conectados às fontes reais da operação, para decidir com número e não
            com achismo.
          </p>
        </article>

        <article className="bento-card p-7">
          <Boxes className="h-7 w-7 text-gold" strokeWidth={1.5} />
          <h3 className="mt-6 font-display text-lg font-semibold">Infraestrutura em nuvem</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ambientes escaláveis, com custo previsível e monitoramento ativo.
          </p>
        </article>
      </div>
    </section>
  );
}
