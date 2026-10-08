import { createFileRoute } from "@tanstack/react-router";

import { ContactCta } from "@/components/landing/ContactCta";
import { Hero } from "@/components/landing/Hero";
import { Method } from "@/components/landing/Method";
import { Results } from "@/components/landing/Results";
import { ServicesBento } from "@/components/landing/ServicesBento";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SalonSolutions } from "@/components/landing/SalonSolutions";

const title = "RGMtech — Sistemas sob medida e soluções para salões de beleza";
const description =
  "Consultoria em tecnologia, desenvolvimento sob medida e soluções para salões de beleza. Conheça o Workflow de Profissionais e o Raio X da Fatura.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://rgmtech.com.br/" },
      { property: "og:site_name", content: "RGMtech" },
      { property: "og:locale", content: "pt_BR" },
    ],
    links: [{ rel: "canonical", href: "https://rgmtech.com.br/" }],
  }),

  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <Results />
        <SalonSolutions />
        <ServicesBento />
        <Method />
        <ContactCta />
      </main>
      <SiteFooter />
    </div>
  );
}
