const steps = [
  {
    number: "01",
    title: "Diagnóstico",
    text: "Mapeamos processos, sistemas e gargalos em até duas semanas.",
  },
  {
    number: "02",
    title: "Desenho da solução",
    text: "Escopo, arquitetura e cronograma com custo fechado por etapa.",
  },
  {
    number: "03",
    title: "Implantação",
    text: "Entregas quinzenais, com validação do time que usa o sistema.",
  },
  {
    number: "04",
    title: "Operação assistida",
    text: "Suporte, evolução contínua e indicadores de uso acompanhados.",
  },
];

export function Method() {
  return (
    <section id="metodo" className="border-y border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-md font-display text-3xl font-bold md:text-4xl">
            Um método previsível, do primeiro contato à operação
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Você sabe exatamente o que será entregue, quando e por quanto — antes de
            assinar.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {steps.map((step) => (
            <li key={step.number} className="bg-background p-7">
              <span className="font-display text-sm font-semibold text-gold">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
