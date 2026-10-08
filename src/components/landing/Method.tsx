const steps = [
  {
    number: "01",
    title: "Diagnóstico",
    text: "Entendemos sua rotina, os sistemas atuais e o que precisa mudar.",
  },
  {
    number: "02",
    title: "Desenho da solução",
    text: "Definimos funcionalidades, integrações, prioridades e investimento.",
  },
  {
    number: "03",
    title: "Implantação",
    text: "Desenvolvemos e validamos as entregas com as pessoas que vão usar.",
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
            Clareza em cada etapa.
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Do primeiro diagnóstico à evolução do sistema, construímos o caminho junto com você.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
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
