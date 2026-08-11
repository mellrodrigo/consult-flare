const metrics = [
  { value: "+120", label: "projetos entregues" },
  { value: "38%", label: "redução média de custo operacional" },
  { value: "15 anos", label: "de experiência em TI corporativa" },
  { value: "4,9/5", label: "satisfação dos clientes ativos" },
];

export function Results() {
  return (
    <section id="resultados" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento-card grid grid-cols-2 gap-px bg-border p-0 md:col-span-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-surface p-8">
              <p className="font-display text-3xl font-bold text-gold md:text-4xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        <figure className="bento-card flex flex-col justify-between p-8">
          <blockquote className="font-display text-lg leading-snug">
            “A RGMtech assumiu um sistema legado que ninguém queria tocar e, em três meses,
            devolveu uma operação estável e documentada.”
          </blockquote>
          <figcaption className="mt-8 text-sm text-muted-foreground">
            <span className="block font-medium text-foreground">Marcela Duarte</span>
            Diretora de Operações, Grupo Vertlog
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
