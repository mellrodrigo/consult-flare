import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import salonImage from "@/assets/salon-management.jpg";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SalonSolutions } from "@/components/landing/SalonSolutions";
import { Button } from "@/components/ui/button";

const title = "Soluções para salões de beleza | RGMtech";
const description = "Desenvolvimento de sistemas sob medida para salões de beleza: agenda, clientes, comissões, financeiro e estoque. Conheça a RGMtech.";
export const Route = createFileRoute("/solucoes/saloes-de-beleza")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: "https://rgmtech.com.br/solucoes/saloes-de-beleza" }] }),
  component: SalonPage,
});

function SalonPage() {
  return <div className="min-h-screen bg-background"><SiteHeader /><main>
    <section className="relative isolate overflow-hidden">
      <img src={salonImage} alt="Salão de beleza com atendimento personalizado" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="salon-veil absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-6 text-sm font-medium text-gold">RGMtech · Soluções sob medida</p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">Sistemas para<br />salões de beleza</h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground/90">Mais organização para a gestão. Mais tempo para cuidar de quem senta na sua cadeira. Desenvolvemos a solução que acompanha a rotina do seu salão.</p>
        <Button asChild variant="gold" size="lg" className="mt-8"><Link to="/" hash="contato">Conversar sobre meu salão <ArrowRight /></Link></Button>
      </div>
    </section>
    <SalonSolutions />
    <section className="mx-auto max-w-6xl px-6 py-16"><h2 className="text-2xl font-semibold">Uma solução construída com você.</h2><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">Entendemos seus processos, definimos as prioridades e desenvolvemos as funcionalidades adequadas à sua operação. O escopo é combinado antes de começar.</p></section>
  </main><SiteFooter /></div>;
}