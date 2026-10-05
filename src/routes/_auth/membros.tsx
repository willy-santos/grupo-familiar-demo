import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Mail, Pencil, Trash2 } from "lucide-react";
import { PageHeader, HeaderIconButton } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { FilterChips } from "@/components/common/FilterChips";
import { ActionIconButton } from "@/components/common/ActionIconButton";

export const Route = createFileRoute("/_auth/membros")({
  component: MembrosPage,
});

const membros = [
  { nome: "Ana Paula Silva", papel: "OBREIRO", email: "ana.silva@example.com" },
  { nome: "Beatriz Souza", papel: "OBREIRO", email: "b.souza@example.com" },
  { nome: "Carlos Henrique", papel: "MEMBRO", email: "carlos.h@example.com" },
  { nome: "Luciana Ferreira", papel: "MEMBRO", email: "lu.ferreira@example.com" },
  { nome: "Marcos Ribeiro", papel: "MEMBRO", email: "marcos.r@example.com" },
  { nome: "Pastor João Batista", papel: "PASTOR", email: "pr.joao@example.com" },
];

function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function MembrosPage() {
  return (
    <>
      <PageHeader
        title={`Membros (${membros.length})`}
        actions={
          <>
            <HeaderIconButton label="Buscar">
              <Search className="h-5 w-5" />
            </HeaderIconButton>
            <HeaderIconButton label="Novo membro">
              <Plus className="h-5 w-5" />
            </HeaderIconButton>
          </>
        }
      />
      <PageContainer>
        <FilterChips options={["Todos", "Pastores", "Líderes", "Obreiros", "Membros"]} />
        <div className="mt-4 space-y-3">
          {membros.map((m) => (
            <div
              key={m.email}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {initials(m.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{m.nome}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{m.papel}</p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {m.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <ActionIconButton icon={Pencil} label="Editar" />
                <ActionIconButton icon={Trash2} label="Excluir" tone="destructive" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
