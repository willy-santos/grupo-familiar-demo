import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, FileText, Image as ImageIcon, FileSpreadsheet, Download, Pencil, Trash2 } from "lucide-react";
import { PageHeader, HeaderIconButton } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { FilterChips } from "@/components/common/FilterChips";
import { ActionIconButton } from "@/components/common/ActionIconButton";

export const Route = createFileRoute("/_auth/arquivos")({
  component: ArquivosPage,
});

const arquivos = [
  { nome: "Cartaz Vigília.png", cat: "Divulgação", tamanho: "780 KB", icon: ImageIcon },
  { nome: "Escala de Louvor Dezembro...", cat: "Escalas", tamanho: "180 KB", icon: FileText },
  { nome: "Relatório GF Novembro.xlsx", cat: "Relatórios", tamanho: "96 KB", icon: FileSpreadsheet },
  { nome: "Regimento Interno 2024.pdf", cat: "Documentos", tamanho: "420 KB", icon: FileText },
  { nome: "Estudo Efésios.docx", cat: "Ensino", tamanho: "140 KB", icon: FileText },
];

function ArquivosPage() {
  return (
    <>
      <PageHeader
        title="Arquivos"
        actions={
          <>
            <HeaderIconButton label="Buscar">
              <Search className="h-5 w-5" />
            </HeaderIconButton>
            <HeaderIconButton label="Novo arquivo">
              <Plus className="h-5 w-5" />
            </HeaderIconButton>
          </>
        }
      />
      <PageContainer>
        <FilterChips options={["Todos", "Divulgação", "Documentos", "Ensino", "Escalas", "Relatórios"]} />

        <div className="mt-4 space-y-3">
          {arquivos.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.nome}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{a.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.cat} · {a.tamanho}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <ActionIconButton icon={Download} label="Baixar" />
                  <ActionIconButton icon={Pencil} label="Editar" />
                  <ActionIconButton icon={Trash2} label="Excluir" tone="destructive" />
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </>
  );
}
