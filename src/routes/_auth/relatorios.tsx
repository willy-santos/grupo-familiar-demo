import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { createFileRoute } from "@tanstack/react-router";
import {  } from "@/features/auth/AuthProvider";
import { DollarSign } from "lucide-react";
import { useOfferings } from "@/lib/offeringsData";
import {
  getCurrentWeekLabel,
  // outros imports...
} from "@/lib/reportsData";
import {
  ClipboardList,
  Users,
  UserPlus,
  Heart,
  MessageSquare,
  Send,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useReports,
  markReviewed,
  getPendingGroupsForWeek,
  submitReport,
  type Relatorio,
  type ReportStatus,
} from "@/lib/reportsData";
import { computeIndicators } from "@/lib/analytics";

import {
  useCurrentUser,
  useEffectiveUser,
  getGrupoHierarquia,
  CAMPO_ADNA,
  type CurrentUser,
} from "@/features/auth/currentUser";


export const Route = createFileRoute("/_auth/relatorios")({
  component: RelatoriosPage,
});

type Status = ReportStatus;

// Contexto do líder — construído a partir da sessão. Usa os dados reais
// (grupo do usuário logado + hierarquia de área/congregação do grupo).
// Sem valores hard-coded: se o usuário não tem grupo atribuído, `grupo`
// vem como undefined e a UI bloqueia o envio — nunca cai em um grupo
// "chumbado". Reflete sempre o estado atual do vínculo administrado.
function buildLiderContext(user: CurrentUser) {
  const grupo = user.grupo;
  const hierarquia = grupo ? getGrupoHierarquia(grupo) : undefined;
  return {
  campo: user.campo ?? hierarquia?.campo ?? CAMPO_ADNA,
  area: user.area ?? hierarquia?.area ?? "—",
  congregacao: user.congregacao ?? hierarquia?.congregacao ?? "—",
  grupo,
  grupoId: user.grupoId,
  lider: user.nome,
  liderEmail: user.email,
  liderRole: user.role,
};
}

const statusMeta: Record<Status, { label: string; className: string; icon: typeof Clock }> = {
  "draft": {
    label: "Pendente",
    className: "bg-warning/15 text-warning border-warning/30",
    icon: Clock,
  },
  sent: {
    label: "Enviado",
    className: "bg-primary/10 text-primary border-primary/25",
    icon: Send,
  },
  reviewed: {
    label: "Revisado",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
};

function StatusBadge({ status }: { status: Status }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={`gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

// ---------- Líder ----------

function LiderForm() {
  const { user: currentUser, isViewingAs } = useEffectiveUser();
  const LIDER_CONTEXT = useMemo(() => buildLiderContext(currentUser), [currentUser]);

  const reports = useReports();
  const { user } = useAuth();
  
  const [membrosMatriculados, setMembrosMatriculados] = useState("");
const [membrosPresentes, setMembrosPresentes] = useState("");
const [visitantesCrentes, setVisitantesCrentes] = useState("");
const [visitantesNaoCrentes, setVisitantesNaoCrentes] = useState("");
const [decisoes, setDecisoes] = useState("");
const [oferta, setOferta] = useState("");
  const [decisoesDescricao, setDecisoesDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const currentWeek = getCurrentWeekLabel();
  const [submitting, setSubmitting] = useState(false);
const semana = getCurrentWeekLabel();
  const hasGroup = Boolean(LIDER_CONTEXT.grupo);

  const historico = useMemo(
  () =>
    reports
      .filter(
        (r) =>
          r.grupo === LIDER_CONTEXT.grupo &&
          r.status !== "draft"
      )
      .sort((a, b) => (a.enviadoEm < b.enviadoEm ? 1 : -1)),
  [reports, LIDER_CONTEXT.grupo],
);

  // Relatório da semana atual do grupo do líder (se já existe registro).
 
  console.log("[relatorios] DEBUG SEMANA ATUAL:", {
  currentWeek,
  grupoLider: LIDER_CONTEXT.grupo,
  reportsDoGrupo: reports.filter(
    (r) => r.grupo === LIDER_CONTEXT.grupo
  ),
});

const currentWeekReport = useMemo(
  () =>
    reports.find(
      (r) =>
        r.grupo === LIDER_CONTEXT.grupo &&
        r.semana === currentWeek,
    ),
  [reports, LIDER_CONTEXT.grupo, currentWeek],
);

  // Considera "pendente" quando não há registro OU o registro está com
  // status "draft"
  const currentStatus: Status =
  currentWeekReport?.status ?? "draft";
  const isPending = currentStatus === "draft";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (isViewingAs) {
      toast.error("Modo visualização.", {
        description:
          "Você está vendo como Líder. O envio de relatórios está desativado neste modo.",
      });
      return;
    }
    if (!LIDER_CONTEXT.grupo) {
      toast.error("Nenhum grupo atribuído.", {
        description:
          "Peça ao administrador para vincular você a um Grupo Familiar antes de enviar relatórios.",
      });
      return;
    }

    // Participantes, visitantes e decisões são opcionais (vazio = 0).
    // Descrição das decisões só é obrigatória quando decisões > 0.
    const nMembrosMatriculados = Number(membrosMatriculados) || 0;
const nMembrosPresentes = Number(membrosPresentes) || 0;
const nVisitantesCrentes = Number(visitantesCrentes) || 0;
const nVisitantesNaoCrentes = Number(visitantesNaoCrentes) || 0;
const nTotalAssistencia =
  nMembrosPresentes +
  nVisitantesCrentes +
  nVisitantesNaoCrentes;

const nDecisoes = Number(decisoes) || 0;
const nOferta = Number(oferta) || 0;
    if (nMembrosPresentes > nMembrosMatriculados) {
  toast.error("Verifique os membros presentes.", {
    description:
      "A quantidade de membros presentes não pode ser maior que a quantidade de membros matriculados.",
  });
  return;
}

if (nDecisoes > nTotalAssistencia) {
      toast.error("Verifique o número de decisões.", {
        description: "A quantidade de decisões não pode ser maior que a de participantes.",
      });
      return;
    }
    if (nDecisoes > 0 && !decisoesDescricao.trim()) {
      toast.error("Descreva as decisões registradas.", {
        description: "É necessário descrever as decisões quando houver pelo menos uma.",
      });
      return;
    }
    if (
      nMembrosMatriculados === 0 &&
nMembrosPresentes === 0 &&
nVisitantesCrentes === 0 &&
nVisitantesNaoCrentes === 0 &&
nDecisoes === 0 &&
nOferta === 0 &&
      !observacoes.trim()
    ) {
      toast.error("Informe uma observação para justificar um relatório sem dados.");
      return;
    }
    setSubmitting(true);

try {
  console.log("[relatorios] DADOS DO ENVIO:", {
    grupo: LIDER_CONTEXT.grupo,
    semana: currentWeek,
    campo: LIDER_CONTEXT.campo,
    area: LIDER_CONTEXT.area,
    congregacao: LIDER_CONTEXT.congregacao,
  });

 await submitReport({
  grupoId: LIDER_CONTEXT.grupoId,
  campo: LIDER_CONTEXT.campo,
  area: LIDER_CONTEXT.area,
  congregacao: LIDER_CONTEXT.congregacao,
  grupo: LIDER_CONTEXT.grupo,
  lider: LIDER_CONTEXT.lider,
  liderEmail: LIDER_CONTEXT.liderEmail,
  semana: currentWeek,
 membrosMatriculados: nMembrosMatriculados,
membrosPresentes: nMembrosPresentes,
visitantesCrentes: nVisitantesCrentes,
visitantesNaoCrentes: nVisitantesNaoCrentes,
totalAssistencia: nTotalAssistencia,
decisoes: nDecisoes,
oferta: nOferta,
  decisoesDescricao: decisoesDescricao.trim() || undefined,
  observacoes: observacoes.trim() || undefined,
});

 toast.success("Relatório enviado com sucesso!", {
  description: `Semana ${currentWeek} · ${nTotalAssistencia} pessoas`,
});

  setMembrosMatriculados("");
setMembrosPresentes("");
setVisitantesCrentes("");
setVisitantesNaoCrentes("");
setDecisoes("");
setOferta("");
  setDecisoesDescricao("");
  setObservacoes("");
} catch (error) {
  console.error("[relatorios] ERRO AO ENVIAR:", error);

  toast.error("Não foi possível enviar o relatório.", {
    description:
      error instanceof Error
        ? error.message
        : "Erro desconhecido.",
  });
} finally {
  setSubmitting(false);
}
  };

  return (
    <PageContainer>
   

      

      


      {/* Banner de status da semana atual */}
      <section
        className={`mt-4 rounded-2xl border p-4 shadow-card ${
          isPending
            ? "border-warning/30 bg-warning/10"
            : currentStatus === "sent"
              ? "border-primary/25 bg-primary/5"
              : "border-success/30 bg-success/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl ${
              isPending
                ? "bg-warning/20 text-warning"
                : currentStatus === "sent"
                  ? "bg-primary/10 text-primary"
                  : "bg-success/20 text-success"
            }`}
          >
            {isPending ? (
              <Clock className="h-5 w-5" />
            ) : currentStatus === "sent" ? (
              <Send className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Semana {currentWeek}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isPending
                ? "Relatório pendente — preencha e envie abaixo."
                : currentStatus === "sent"
                  ? "Relatório enviado. Aguardando análise do administrador."
                  : "Relatório revisado pelo administrador."}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </section>

      {!isPending && (
        <section className="mt-4 rounded-2xl border border-dashed border-border/70 bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">
            O relatório desta semana já foi enviado. Consulte o histórico
            abaixo.
          </p>
        </section>
      )}

      {hasGroup && isPending && !isViewingAs && (
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
<section className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
  <Label htmlFor="semana" className="text-sm font-semibold">
    Semana de referência
  </Label>

  <div className="mt-2 flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm">
  {currentWeek}
</div>
</section>

        <section className="grid grid-cols-2 gap-3">
  <FieldCard
    id="membrosMatriculados"
    label="Membros matriculados"
    icon={Users}
    value={membrosMatriculados}
    onChange={setMembrosMatriculados}
    placeholder="0"
  />

  <FieldCard
    id="membrosPresentes"
    label="Membros presentes"
    icon={Users}
    value={membrosPresentes}
    onChange={setMembrosPresentes}
    placeholder="0"
  />

  <FieldCard
    id="visitantesCrentes"
    label="Visitantes crentes"
    icon={UserPlus}
    value={visitantesCrentes}
    onChange={setVisitantesCrentes}
    placeholder="0"
  />

  <FieldCard
    id="visitantesNaoCrentes"
    label="Visitantes não crentes"
    icon={UserPlus}
    value={visitantesNaoCrentes}
    onChange={setVisitantesNaoCrentes}
    placeholder="0"
  />

  <FieldCard
    id="decisoes"
    label="Decisões"
    icon={Heart}
    value={decisoes}
    onChange={setDecisoes}
    placeholder="0"
  />
  <FieldCard
  id="oferta"
  label="Oferta"
  icon={DollarSign}
  value={oferta}
  onChange={setOferta}
  placeholder="0,00"
/>
  <FieldCard
  id="totalAssistencia"
  label="Assistência total"
  icon={Users}
  value={String(
    (Number(membrosPresentes) || 0) +
    (Number(visitantesCrentes) || 0) +
    (Number(visitantesNaoCrentes) || 0)
  )}
  onChange={() => {}}
  placeholder="0"
/>
          <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Preencha em números
            </p>
          </div>
        </section>

        {Number(decisoes) > 0 && (
          <TextareaCard
            id="decisoesDescricao"
            label="Descrição das decisões *"
            icon={Heart}
            value={decisoesDescricao}
            onChange={setDecisoesDescricao}
            placeholder="Descreva as decisões (ex.: 2 pessoas aceitaram Cristo durante a reunião)."
          />
        )}

        <TextareaCard
          id="observacoes"
          label="Observações"
          icon={MessageSquare}
          value={observacoes}
          onChange={setObservacoes}
          placeholder="Notas gerais sobre o encontro, testemunhos, avisos…"
        />

        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          <Send className="h-4 w-4" />
          {submitting ? "Enviando…" : "Enviar Relatório"}
        </Button>
      </form>
      )}

      {/* Histórico do próprio grupo */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Meu histórico
          </h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {historico.length} relatório{historico.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {historico.length === 0 && (
            <p className="rounded-xl border border-dashed border-border/70 bg-surface p-4 text-center text-xs text-muted-foreground">
              Nenhum relatório enviado ainda.
            </p>
          )}
          {historico.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  Semana {r.semana}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                 {r.totalAssistencia} ass. · {r.visitantesCrentes + r.visitantesNaoCrentes} visit. · {r.decisoes} dec.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="text-[11px] text-muted-foreground">{r.enviadoEm}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function SemGrupoMessage() {
  return (
    <section className="rounded-2xl border border-warning/30 bg-warning/10 p-4 shadow-card">
      <p className="text-sm font-semibold text-foreground">
        Nenhum Grupo Familiar vinculado ao seu usuário.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Peça ao administrador para atribuir um grupo em Gestão de Usuários.
        Assim que a alteração for feita, esta tela será atualizada
        automaticamente.
      </p>
    </section>
  );
}

function FieldCard({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  icon: typeof Users;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="mt-2 h-11 text-lg font-semibold"
      />
    </div>
  );
}

function TextareaCard({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  icon: typeof MessageSquare;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 resize-none"
      />
    </div>
  );
}

// ---------- Administrador ----------

function AdminView() {
  const reports = useReports();
  const offerings = useOfferings();

  const [campo, setCampo] = useState("all");
  const [area, setArea] = useState("all");
  const [congregacao, setCongregacao] = useState("all");
  const [grupo, setGrupo] = useState("all");
  const [periodo, setPeriodo] = useState("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Relatorio | null>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (campo !== "all" && r.campo !== campo) return false;
      if (area !== "all" && r.area !== area) return false;
      if (congregacao !== "all" && r.congregacao !== congregacao) return false;
      if (grupo !== "all" && r.grupo !== grupo) return false;
      if (periodo !== "all" && r.semana !== periodo) return false;
      if (status !== "all" && r.status !== status) return false;
      if (busca && !`${r.grupo} ${r.lider}`.toLowerCase().includes(busca.toLowerCase()))
        return false;
      return true;
    });
  }, [reports, campo, area, congregacao, grupo, periodo, status, busca]);

  const totals = useMemo(() => {
  const reviewed = filtered.filter((r) => r.status === "reviewed");

  return {
    total: filtered.length,
    enviados:
      filtered.filter((r) => r.status === "sent").length +
      reviewed.length,
    revisados: reviewed.length,

    membrosMatriculados: reviewed.reduce(
      (s, r) => s + r.membrosMatriculados,
      0,
    ),

    membrosPresentes: reviewed.reduce(
      (s, r) => s + r.membrosPresentes,
      0,
    ),

    visitantesCrentes: reviewed.reduce(
      (s, r) => s + r.visitantesCrentes,
      0,
    ),

    visitantesNaoCrentes: reviewed.reduce(
      (s, r) => s + r.visitantesNaoCrentes,
      0,
    ),

    decisoes: reviewed.reduce(
      (s, r) => s + r.decisoes,
      0,
    ),

    totalAssistencia: reviewed.reduce(
      (s, r) => s + r.totalAssistencia,
      0,
    ),

    oferta: offerings
  .filter(
    (o) =>
      o.status === "confirmed" &&
      o.reportId &&
      reviewed.some((r) => r.id === o.reportId),
  )
  .reduce((s, o) => s + Number(o.amount || 0), 0),
  };
}, [filtered, offerings]);

  const uniq = (key: keyof Relatorio) =>
    Array.from(new Set(reports.map((r) => r[key] as string)));

  const handleReview = (r: Relatorio) => {
    markReviewed(r.id);
    toast.success("Relatório marcado como revisado.", {
      description: `${r.grupo} · Semana ${r.semana}`,
    });
    setDetalhe((prev) => (prev && prev.id === r.id ? { ...prev, status: "reviewed" } : prev));
  };

  return (
    <PageContainer>
      {/* Cards de resumo */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="Relatórios"
          value={totals.total.toString()}
          icon={ClipboardList}
          hint={`${totals.revisados} revisados · ${totals.enviados} enviados`}
        />
        <SummaryCard
  label="Membros presentes"
  value={totals.membrosPresentes.toString()}
  icon={Users}
  hint="Somente revisados"
/>

<SummaryCard
  label="Visitantes crentes"
  value={totals.visitantesCrentes.toString()}
  icon={UserPlus}
  hint="Somente revisados"
/>

<SummaryCard
  label="Visitantes não crentes"
  value={totals.visitantesNaoCrentes.toString()}
  icon={UserPlus}
  hint="Somente revisados"
/>

<SummaryCard
  label="Decisões"
  value={totals.decisoes.toString()}
  icon={Heart}
  hint="Somente revisados"
  
/>
<SummaryCard
  label="Ofertas aprovadas"
  value={totals.oferta.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
  icon={UserPlus}
  hint="Somente ofertas confirmadas"
/>
      </section>

      {/* Destaque — grupos pendentes na semana atual */}
      <PendentesHighlight />

      {/* Filtros */}
      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect label="Campo" value={campo} onChange={setCampo} options={uniq("campo")} />
          <FilterSelect label="Área" value={area} onChange={setArea} options={uniq("area")} />
          <FilterSelect
            label="Congregação"
            value={congregacao}
            onChange={setCongregacao}
            options={uniq("congregacao")}
          />
          <FilterSelect label="Grupo" value={grupo} onChange={setGrupo} options={uniq("grupo")} />
          <FilterSelect
            label="Período"
            value={periodo}
            onChange={setPeriodo}
            options={uniq("semana")}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as "all" | Status)}
            options={["draft", "sent", "reviewed"]}
            labels={{ pending: "Pendente", sent: "Enviado", reviewed: "Revisado" }}
          />
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar líder / grupo"
            className="h-10 pl-9"
          />
        </div>
      </section>

      {/* Tabela — desktop */}
      <section className="mt-4 hidden overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead>Grupo</TableHead>
              <TableHead>Líder</TableHead>
              <TableHead>Semana</TableHead>
             <TableHead className="text-right">Matriculados</TableHead>
<TableHead className="text-right">Presentes</TableHead>
<TableHead className="text-right">Visit. crentes</TableHead>
<TableHead className="text-right">Visit. não crentes</TableHead>
<TableHead className="text-right">Decisões</TableHead>
<TableHead className="text-right">Assistência</TableHead>
<TableHead className="text-right">Oferta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Envio</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
  <TableCell className="font-medium">{r.grupo}</TableCell>

  <TableCell className="text-muted-foreground">
    {r.lider}
  </TableCell>

  <TableCell className="text-muted-foreground">
    {r.semana}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.membrosMatriculados}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.membrosPresentes}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.visitantesCrentes}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.visitantesNaoCrentes}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.decisoes}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.totalAssistencia}
  </TableCell>

  <TableCell className="text-right font-semibold">
    {r.oferta.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}
  </TableCell>

  <TableCell>
    <StatusBadge status={r.status} />
  </TableCell>

  <TableCell className="text-muted-foreground">
    {r.enviadoEm}
  </TableCell>

  <TableCell>
    <div className="flex items-center justify-end gap-1">
      <button
                      type="button"
                      onClick={() => setDetalhe(r)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-primary-soft hover:text-primary"
                      aria-label="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {r.status !== "reviewed" && r.status !== "draft" && (
                      <button
                        type="button"
                        onClick={() => handleReview(r)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-success/15 hover:text-success"
                        aria-label="Marcar como revisado"
                        title="Marcar como revisado"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum relatório encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* Cards — mobile */}
      <section className="mt-4 space-y-3 md:hidden">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{r.grupo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.lider} · {r.congregacao}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Semana" value={r.semana} />
             <MiniStat label="Ass." value={r.totalAssistencia.toString()} />
             <MiniStat label="Visit." value={(r.visitantesCrentes + r.visitantesNaoCrentes).toString()}
/>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Enviado em {r.enviadoEm}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 px-2 text-xs"
                  onClick={() => setDetalhe(r)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Detalhes
                </Button>
                {r.status !== "reviewed" && r.status !== "draft" && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs"
                    onClick={() => handleReview(r)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Revisar
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-8 text-center text-sm text-muted-foreground">
            Nenhum relatório encontrado.
          </div>
        )}
      </section>

      {/* Dialog detalhes */}
      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detalhe.grupo}
                  <StatusBadge status={detalhe.status} />
                </DialogTitle>
                <DialogDescription>
                  {detalhe.lider} · {detalhe.congregacao} · Semana {detalhe.semana}
                </DialogDescription>
              </DialogHeader>
             <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
  <MiniStat
    label="Membros matriculados"
    value={detalhe.membrosMatriculados.toString()}
  />

  <MiniStat
    label="Membros presentes"
    value={detalhe.membrosPresentes.toString()}
  />

  <MiniStat
    label="Visitantes crentes"
    value={detalhe.visitantesCrentes.toString()}
  />

  <MiniStat
    label="Visitantes não crentes"
    value={detalhe.visitantesNaoCrentes.toString()}
  />

  <MiniStat
    label="Decisões"
    value={detalhe.decisoes.toString()}
  />

  <MiniStat
    label="Assistência total"
    value={detalhe.totalAssistencia.toString()}
  />

  <MiniStat
    label="Oferta"
    value={detalhe.oferta.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}
  />
</div>
              {detalhe.decisoesDescricao && (
  <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      Descrição das decisões
    </p>

    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
      {detalhe.decisoesDescricao}
    </p>
  </div>
)}
              {detalhe.observacoes && (
                <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Observações
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {detalhe.observacoes}
                  </p>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setDetalhe(null)}>
                  Fechar
                </Button>
                {detalhe.status !== "reviewed" && detalhe.status !== "draft" && (
                  <Button className="gap-2" onClick={() => handleReview(detalhe)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como revisado
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: typeof Users;
  hint?: string;
  accent?: "primary" | "warning";
}) {
  const accentCls =
    accent === "warning" ? "bg-warning/15 text-warning" : "bg-primary-soft text-primary";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${accentCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PendentesHighlight() {
  const reports = useReports();
  const semanaAtual = getCurrentWeekLabel();

const pendentes = useMemo(
  () => getPendingGroupsForWeek(semanaAtual),
  [reports, semanaAtual],
);
  return (
    <section className="mt-4 rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">
          Grupos pendentes · Semana {semanaAtual}
        </h3>
        <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-semibold text-warning">
          {pendentes.length}
        </span>
      </div>
      {pendentes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border/70 bg-surface p-3 text-center text-xs text-muted-foreground">
          Todos os grupos enviaram o relatório desta semana.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pendentes.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-warning/30 bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.grupo}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {r.congregacao} · {r.area}
                </p>
              </div>
              <StatusBadge status="draft" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-10">
          <SelectValue placeholder={`Todos`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {labels?.[opt] ?? opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------- Page ----------
function RelatoriosPage() {
  const { loading: authLoading } = useAuth();
  const currentUser = useCurrentUser();

  if (authLoading) {
    return (
      <>
        <PageHeader title="Relatórios" />
        <PageContainer>
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Carregando...
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  // Membro
  if (currentUser.role === "membro") {
    return (
      <>
        <PageHeader title="Relatórios" />
        <PageContainer>
          <SemGrupoMessage />
        </PageContainer>
      </>
    );
  }

  // Admin
  if (currentUser.role === "admin") {
    return (
      <>
        <PageHeader title="Relatórios" />
        <AdminView />
      </>
    );
  }

  // Líder sem grupo
  if (currentUser.role === "lider" && !currentUser.grupo) {
    return (
      <>
        <PageHeader title="Relatórios" />
        <PageContainer>
          <SemGrupoMessage />
        </PageContainer>
      </>
    );
  }

  // Líder com grupo
  return (
    <>
      <PageHeader title="Relatórios" />
      <LiderForm />
    </>
  );
}