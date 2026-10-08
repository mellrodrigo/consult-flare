import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Users, Wallet, Package } from "lucide-react";
import salonImage from "@/assets/salon-management.jpg";
import { Button } from "@/components/ui/button";

const areas = [
  { icon: CalendarDays, title: "Agenda e atendimento", text: "Agendamentos, serviços e disponibilidade dos profissionais." },
  { icon: Users, title: "Clientes e equipe", text: "Histórico de atendimento, relacionamento e gestão de comissões." },
  { icon: Wallet, title: "Financeiro", text: "Caixa, pagamentos e indicadores para acompanhar o negócio." },
  { icon: Package, title: "Produtos e estoque", text: "Controle dos produtos usados nos serviços e vendidos no salão." },
];

export function SalonSolutions() {
  return (
    <section id="saloes" className="scroll-mt-24 border-y border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase text-gold">Tecnologia para o mercado da beleza</p>
            <h2 className="text-3xl font-bold md:text-4xl">Seu salão tem personalidade.<br />Seu sistema também deve ter.</h2>
          </div>
          <Button asChild variant="outline" className="w-fit"><Link to="/solucoes/saloes-de-beleza">Conhecer a solução <ArrowUpRight /></Link></Button>
        </div>
        <img src={salonImage} alt="Profissional de beleza atendendo uma cliente com um tablet em um salão organizado" width={1536} height={1024} loading="lazy" className="aspect-[16/9] w-full rounded-lg object-cover md:aspect-[21/9]" />
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_2fr]">
          <p className="text-base leading-relaxed text-muted-foreground">Desenvolvemos soluções sob medida para salões de beleza, conectando a rotina da equipe à gestão do negócio. Da agenda ao financeiro, com as necessidades do seu salão no centro.</p>
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {areas.map(({ icon: Icon, title, text }) => <div key={title}><Icon className="mb-3 h-5 w-5 text-gold" /><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}