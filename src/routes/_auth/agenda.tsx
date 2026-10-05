import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, HeaderIconButton } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_auth/agenda")({
  component: AgendaPage,
});

const events = [
  { date: "11/07/2026", time: "19:30 – 21:30", title: "GRUPO FAMILIAR - TC" },
  { date: "08/08/2026", time: "19:30 – 21:30", title: "GRUPO FAMILIAR - TC" },
  { date: "15/08/2026", time: "09:00 – 12:00", title: "EBD - Templo Central" },
];

function AgendaPage() {
  return (
    <>
      <PageHeader
        title="Agenda"
        actions={
          <HeaderIconButton label="Novo evento">
            <Plus className="h-5 w-5" />
          </HeaderIconButton>
        }
      />
      <PageContainer>
        <div className="space-y-3">
          {events.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
            >
              <div className="w-24 shrink-0">
                <p className="text-sm font-bold">{e.date}</p>
                <p className="text-xs text-muted-foreground">{e.time}</p>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{e.title}</p>
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
