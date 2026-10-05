import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Video, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_auth/midias")({
  component: MidiasPage,
});

const opts = [
  { to: "/fotos", label: "Fotos", desc: "Galeria da igreja", icon: Camera },
  { to: "/videos", label: "Vídeos", desc: "Pregações e louvor", icon: Video },
  { to: "/arquivos", label: "Arquivos", desc: "PDFs e planilhas", icon: FileText },
];

function MidiasPage() {
  return (
    <>
      <PageHeader title="Mídias" />
      <PageContainer>
        <div className="space-y-3">
          {opts.map((o) => {
            const Icon = o.icon;
            return (
              <Link
                key={o.to}
                to={o.to}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold">{o.label}</p>
                  <p className="text-sm text-muted-foreground">{o.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </PageContainer>
    </>
  );
}
