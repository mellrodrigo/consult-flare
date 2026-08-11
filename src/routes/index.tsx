import { createFileRoute } from "@tanstack/react-router";

import { ContactCta } from "@/components/landing/ContactCta";
import { Hero } from "@/components/landing/Hero";
import { Method } from "@/components/landing/Method";
import { Results } from "@/components/landing/Results";
import { ServicesBento } from "@/components/landing/ServicesBento";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

const title = "RGMtech — Consultoria em tecnologia para empresas";
const description =
  "Diagnóstico, sistemas sob medida, automação e dados para empresas que precisam crescer com operação estável. Fale com a RGMtech.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
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
        <ServicesBento />
        <Method />
        <Results />
        <ContactCta />
      </main>
      <SiteFooter />
    </div>
  );
}
