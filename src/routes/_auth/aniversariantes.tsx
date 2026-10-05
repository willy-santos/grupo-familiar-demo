import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_auth/aniversariantes")({
  component: AnivPage,
});

const list = [
  { nome: "Ana Paula Silva", data: "12/07" },
  { nome: "Carlos Henrique", data: "18/07" },
  { nome: "Luciana Ferreira", data: "25/07" },
];

function AnivPage() {
  return (
    <>
      <PageHeader title="Aniversariantes" />
      <PageContainer>
        <div className="space-y-3">
          {list.map((p) => (
            <div
              key={p.nome}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{p.nome}</p>
                <p className="text-xs text-muted-foreground">Aniversário em {p.data}</p>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
