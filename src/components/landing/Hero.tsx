import heroImage from "@/assets/hero-abstract.jpg";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <img
        src={heroImage}
        alt="Malha digital em tons de esmeralda representando infraestrutura tecnológica"
        width={1400}
        height={1000}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="grid-veil absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold">
          Consultoria em tecnologia
        </span>

        <h1 className="mt-8 max-w-3xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">
          Tecnologia que sustenta a{" "}
          <span className="text-gradient-gold">operação do seu negócio</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          A RGMtech desenha, implanta e opera sistemas sob medida — do diagnóstico à
          automação — para empresas que precisam crescer sem perder controle.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#contato"
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5"
          >
            Agendar diagnóstico
          </a>
          <a
            href="#servicos"
            className="rounded-full border border-border bg-surface/70 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold/40"
          >
            Ver serviços
          </a>
        </div>
      </div>
    </section>
  );
}
