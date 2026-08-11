import { Mail, MapPin, Phone } from "lucide-react";

const contacts = [
  { icon: Mail, label: "contato@rgmtech.com.br" },
  { icon: Phone, label: "+55 (11) 4000-0000" },
  { icon: MapPin, label: "São Paulo · atendimento remoto no Brasil" },
];

export function ContactCta() {
  return (
    <section id="contato" className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Vamos olhar sua operação juntos
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Conte o cenário atual e retornamos em até um dia útil com uma proposta de
            diagnóstico.
          </p>

          <ul className="mt-10 space-y-4">
            {contacts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-gold" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <form
          className="bento-card space-y-4 p-8"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Nome</span>
              <input
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Empresa</span>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted-foreground">E-mail corporativo</span>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Desafio atual</span>
            <textarea
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5"
          >
            Enviar solicitação
          </button>
        </form>
      </div>
    </section>
  );
}
