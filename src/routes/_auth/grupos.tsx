import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useGroups,
  addGroup,
  updateGroup,
  CAMPO_ADNA,
  type GrupoStatus,
} from "@/lib/groupsData";
import { Plus, Search, Sparkles, Pencil } from "lucide-react";
import { PageHeader, HeaderIconButton } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterChips } from "@/components/common/FilterChips";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_auth/grupos")({
  component: GruposPage,
});

// ---------------------------------------------------------------------------
// Este módulo é a FONTE OFICIAL de Grupos Familiares. Os dados vivem em
// `@/lib/groupsData` e são compartilhados com:
//   - /usuarios     (para atribuir Líder a um Grupo Familiar)
//   - /relatorios   (o líder herda automaticamente campo/área/congregação
//                    do grupo aqui cadastrado)
//   - analytics     (via reportsData -> gráficos)
//
// A liderança é gerenciada em /usuarios; aqui o campo `lider` é apenas
// leitura. O ADNA possui um único Campo — este valor é fixo.
//
// Área e Congregação seguem listas mock (Select), prontas para futura
// migração ao Supabase.
// ---------------------------------------------------------------------------

type Status = GrupoStatus;

// Opções mock — substituir por dados vindos do Supabase futuramente.
const AREAS_MOCK = ["Área 1", "Área 2", "Área 3", "Área 4"] as const;
const CONGREGACOES_MOCK = [
  "Centro",
  "Marambaia",
  "Pedreira",
  "Cidade Nova",
  "Icuí",
  "Coqueiro",
] as const;

type Filtro = "Todos" | "Ativos" | "Inativos";

interface GrupoFormState {
  nome: string;
  area: string;
  congregacao: string;
  status: Status;
}

const formVazio: GrupoFormState = {
  nome: "",
  area: "",
  congregacao: "",
  status: "Ativo",
};

function GruposPage() {
  // Fonte oficial dos grupos — reativa. Alterações refletem em /usuarios,
  // /relatorios e nos gráficos automaticamente.
  const grupos = useGroups();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [buscaAberta, setBuscaAberta] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<GrupoFormState>(formVazio);

  const gruposVisiveis = useMemo(() => {
    const q = query.trim().toLowerCase();
    return grupos
      .filter((g) => {
        if (filtro === "Ativos" && g.status !== "Ativo") return false;
        if (filtro === "Inativos" && g.status !== "Inativo") return false;
        if (q && !g.nome.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [grupos, query, filtro]);

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio);
    setModalAberto(true);
  }

  function abrirEdicao(g: (typeof grupos)[number]) {
    setEditandoId(g.id);
    setForm({
      nome: g.nome,
      area: g.area,
      congregacao: g.congregacao,
      status: g.status,
    });
    setModalAberto(true);
  }

  const formInvalido =
    !form.nome.trim() ||
    !form.area.trim() ||
    !form.congregacao.trim();

  function salvar() {
    if (formInvalido) return;
    if (editandoId) {
      updateGroup(editandoId, {
        nome: form.nome,
        area: form.area,
        congregacao: form.congregacao,
        status: form.status,
      });
    } else {
      addGroup({
        nome: form.nome,
        area: form.area,
        congregacao: form.congregacao,
        status: form.status,
      });
    }
    setModalAberto(false);
  }

  return (
    <>
      <PageHeader
        title={`Grupos Familiares (${grupos.length})`}
        actions={
          <HeaderIconButton
            label="Buscar"
            onClick={() => setBuscaAberta((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </HeaderIconButton>
        }
      />
      <PageContainer>
        <div className="space-y-4">
          {buscaAberta && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar Grupo Familiar..."
                className="pl-9"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <FilterChips
              options={["Todos", "Ativos", "Inativos"]}
              defaultValue="Todos"
              onChange={(v) => setFiltro(v as Filtro)}
            />
            <Button size="sm" onClick={abrirNovo} className="shrink-0 gap-1.5">
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </div>

          {gruposVisiveis.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nenhum grupo encontrado"
              description="Ajuste a pesquisa ou os filtros, ou crie um novo Grupo Familiar."
            />
          ) : (
            <div className="space-y-3">
              {gruposVisiveis.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/10 to-primary-soft text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-base font-bold uppercase tracking-wide">
                          {g.nome}
                        </p>
                        <Badge
                          variant={g.status === "Ativo" ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          {g.status}
                        </Badge>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <Info label="Área" value={g.area} />
                        <Info label="Congregação" value={g.congregacao} />
                        <Info label="Líder" value={g.liderNome ?? "—"} />
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirEdicao(g)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar Grupo Familiar" : "Novo Grupo Familiar"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field
              id="grupo-nome"
              label="Nome do Grupo"
              value={form.nome}
              onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
            />
            <div className="space-y-1.5">
              <Label>Campo</Label>
              <Input value={CAMPO_ADNA} disabled readOnly />
              <p className="text-[11px] text-muted-foreground">
                O ADNA possui apenas um Campo. Este valor é fixo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grupo-area">Área</Label>
              <Select
                value={form.area}
                onValueChange={(v) => setForm((f) => ({ ...f, area: v }))}
              >
                <SelectTrigger id="grupo-area">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS_MOCK.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grupo-cong">Congregação</Label>
              <Select
                value={form.congregacao}
                onValueChange={(v) => setForm((f) => ({ ...f, congregacao: v }))}
              >
                <SelectTrigger id="grupo-cong">
                  <SelectValue placeholder="Selecione a congregação" />
                </SelectTrigger>
                <SelectContent>
                  {CONGREGACOES_MOCK.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grupo-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}
              >
                <SelectTrigger id="grupo-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editandoId && (
              <p className="text-xs text-muted-foreground">
                A liderança é gerenciada no módulo Usuários e não pode ser
                alterada aqui. Grupos nunca são excluídos — use o status{" "}
                <span className="font-semibold">Inativo</span> para desativar.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={formInvalido}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate font-medium">{value || "—"}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
