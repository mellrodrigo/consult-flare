export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display font-semibold text-foreground">RGMtech</span>
        <span>© {new Date().getFullYear()} RGMtech Consultoria em Tecnologia</span>
      </div>
    </footer>
  );
}
