import heroImage from "@/assets/hero-abstract.jpg";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 md:pb-20 md:pt-20">
        <span className="text-xs font-semibold uppercase text-gold">
          Consultoria · Desenvolvimento · Automação
        </span>

        <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[1.05] md:text-7xl">
          RGM<span className="text-gradient-gold">tech</span>
        </h1>
        <p className="mt-5 max-w-2xl font-display text-2xl font-medium leading-tight md:text-4xl">Tecnologia feita para o seu negócio. Não o contrário.</p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Desenvolvemos sistemas sob medida e simplificamos operações. De consultorias
          a salões de beleza, conectamos pessoas, processos e dados para o seu negócio avançar.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="gold" size="lg"><a
            href="#contato"
          >
            Vamos conversar <ArrowRight />
          </a></Button>
          <Button asChild variant="outline" size="lg"><a href="#solucoes">Explorar soluções <ArrowDown /></a></Button>
        </div>
        <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-5 text-xs text-muted-foreground"><span>Sistemas sob medida</span><span>Gestão para salões de beleza</span><span>Integrações e automação</span></div>
      </div>
    </section>
  );
}
