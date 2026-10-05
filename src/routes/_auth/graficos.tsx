import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useOfferings } from "@/lib/offeringsData";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  Users,
  UserPlus,
  MapPin,
  Church,
  Home as HomeIcon,
  TrendingUp,
  ChevronRight,
  UsersRound,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useReports } from "@/lib/reportsData";
import {
  useAnalyticsAggregations,
  type CongregationAggregate,
  type GroupAggregate,
} from "@/lib/analytics";

export const Route = createFileRoute("/_auth/graficos")({
  component: GraficosPage,
});

// Agregações agora vêm da camada central `@/lib/analytics`. Este arquivo
// apenas consome os dados prontos — nenhum cálculo é feito localmente.

const chartAxis = { fontSize: 11, fill: "hsl(215 16% 47%)" } as const;

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function GraficosPage() {
  const { role, grupoId } = useAuth();

  // -------- Filtros globais --------
  const [filtroPeriodo, setFiltroPeriodo] = useState("all");
  const [filtroArea, setFiltroArea] = useState("all");
  const [filtroCong, setFiltroCong] = useState("all");
  const [filtroGrupo, setFiltroGrupo] = useState("all");

  const reports = useReports();
  const offerings = useOfferings();
console.log("[GRAFICOS] CONTEXTO DO LÍDER:", {
  role,
  grupoId,
});

console.log(
  "[GRAFICOS] RELATÓRIOS DO GRUPO:",
  reports.map((r) => ({
    grupo: r.grupo,
    grupoId: r.grupoId,
    semana: r.semana,
    status: r.status,
    membrosPresentes: r.membrosPresentes,
  })),
);
  console.log("[GRAFICOS] auth:", {
    role,
    grupoId,
  });

console.table(
  reports.map((r) => ({
    id: r.id,
    grupo: r.grupo,
    grupoId: r.grupoId,
    status: r.status,
    membrosPresentes: r.membrosPresentes,
    visitantes:
      r.visitantesCrentes + r.visitantesNaoCrentes,
  })),
);
  
 

const reviewedAll = useMemo(() => {
  const reviewed = reports.filter(
    (r) => r.status === "reviewed",
  );

  // ADMIN → vê todos os relatórios revisados
  if (role === "admin") {
    return reviewed;
  }

  // LÍDER → vê o histórico do grupo que atualmente lidera.
  //
  // IMPORTANTE:
  // Não usamos userId, liderEmail ou liderNome aqui.
  // O relatório pertence ao GRUPO.
  if (role === "leader") {
    if (!grupoId) {
      console.warn(
        "[GRAFICOS] Líder sem grupoId. Relatórios não serão exibidos."
      );

      return [];
    }

    const resultado = reviewed.filter(
      
      (r) => r.grupoId?.trim() === grupoId.trim(),
    );
console.log("========== DEBUG TROCA DE LÍDER ==========");
console.log("[GRAFICOS] role:", role);
console.log("[GRAFICOS] grupoId atual:", grupoId);

console.table(
  reports.map((r) => ({
    grupo: r.grupo,
    grupoId: r.grupoId,
    status: r.status,
    userId: r.userId,
    lider: r.lider,
    liderEmail: r.liderEmail,
  }))
);
    console.log("[GRAFICOS] FILTRO DO LÍDER:", {
      grupoId,
      revisados: reviewed.length,
      encontrados: resultado.length,
      gruposDosRevisados: reviewed.map((r) => ({
        grupo: r.grupo,
        grupoId: r.grupoId,
        status: r.status,
        lider: r.lider,
        liderEmail: r.liderEmail,
      })),
    });

    return resultado;
  }

  // MEMBER
  return [];
}, [reports, role, grupoId]);
  // Opções dos filtros (todas as opções disponíveis no dataset revisado)
  const opcoesGlobais = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr));
    return {
      periodos: uniq(reviewedAll.map((r) => r.semana)),
      areas: uniq(reviewedAll.map((r) => r.area)),
      congregacoes: uniq(reviewedAll.map((r) => r.congregacao)),
      grupos: uniq(reviewedAll.map((r) => r.grupo)),
    };
  }, [reviewedAll]);

  // Aplica filtros
  const reviewedFiltrados = useMemo(() => {
    return reviewedAll.filter((r) => {
      if (filtroPeriodo !== "all" && r.semana !== filtroPeriodo) return false;
      if (filtroArea !== "all" && r.area !== filtroArea) return false;
      if (filtroCong !== "all" && r.congregacao !== filtroCong) return false;
      if (filtroGrupo !== "all" && r.grupo !== filtroGrupo) return false;
      return true;
    });
  }, [reviewedAll, filtroPeriodo, filtroArea, filtroCong, filtroGrupo]);
const ofertasConfirmadas = useMemo(() => {
  return offerings.filter((oferta) => {
    // Somente ofertas realmente confirmadas
    if (oferta.status !== "confirmed") return false;

    // Líder vê somente as ofertas do próprio grupo
    if (
      role === "leader" &&
      (!grupoId || oferta.groupId !== grupoId)
    ) {
      return false;
    }

    // Filtros globais
    if (
      filtroArea !== "all" &&
      oferta.area !== filtroArea
    ) {
      return false;
    }

    if (
      filtroCong !== "all" &&
      oferta.congregacao !== filtroCong
    ) {
      return false;
    }

    if (
      filtroGrupo !== "all" &&
      oferta.groupName !== filtroGrupo
    ) {
      return false;
    }

    return true;
  });
}, [
  offerings,
  role,
  grupoId,
  filtroArea,
  filtroCong,
  filtroGrupo,
]);
const totalOfertas = useMemo(
  () =>
    ofertasConfirmadas.reduce(
      (total, oferta) => total + Number(oferta.amount || 0),
      0,
    ),
  [ofertasConfirmadas],
);

const quantidadeOfertas = ofertasConfirmadas.length;
  // Toda origem de dados dos gráficos passa pela camada de Analytics
  // (fonte única de verdade). O hook é reativo: qualquer relatório que
  // muda para "reviewed" recalcula automaticamente.
  const agg = useAnalyticsAggregations(reviewedFiltrados);

  const totalVisitantes =
  agg.totals.visitantesCrentes +
  agg.totals.visitantesNaoCrentes;

const indicadores = [
  {
    label: "Membros presentes",
    value: agg.totals.membrosPresentes.toLocaleString("pt-BR"),
    icon: Users,
  },
  {
    label: "Visitantes",
    value: totalVisitantes.toLocaleString("pt-BR"),
    icon: UserPlus,
  },
  {
    label: "Áreas",
    value: agg.totals.areas.toString(),
    icon: MapPin,
  },
  {
    label: "Congregações",
    value: agg.totals.congregacoes.toString(),
    icon: Church,
  },
  {
    label: "Grupos Familiares",
    value: agg.totals.grupos.toString(),
    icon: HomeIcon,
  },
  {
  label: "Ofertas confirmadas",
  value: totalOfertas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
  icon: TrendingUp,
},
];

const ofertasPorMes = useMemo(() => {
  const mapa = new Map<string, number>();

  for (const oferta of ofertasConfirmadas) {
    const data = new Date(oferta.offeringDate);

    if (Number.isNaN(data.getTime())) continue;

    const mes = data.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });

    mapa.set(
      mes,
      (mapa.get(mes) ?? 0) + Number(oferta.amount || 0),
    );
  }

  return Array.from(mapa.entries()).map(([mes, valor]) => ({
    mes,
    valor,
  }));
}, [ofertasConfirmadas]);

  const membrosPresentesPorArea = agg.areas.map((a) => ({
  nome: a.nome,
  membrosPresentes: a.membrosPresentes,
}));

  // ---- Congregação selecionada para o filtro do gráfico "Membros por Grupo" ----
  const [filtroCongGrupos, setFiltroCongGrupos] = useState<string>("all");
  const gruposDaCongFiltrada = useMemo(() => {
    if (filtroCongGrupos === "all") return agg.groups;
    return agg.groups.filter((g) => g.congregacao === filtroCongGrupos);
  }, [agg.groups, filtroCongGrupos]);

  // ---- Modais ----
  const [selectedCong, setSelectedCong] = useState<CongregationAggregate | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupAggregate | null>(null);

  const periodoLabel =
    filtroPeriodo === "all" ? "Todos os períodos" : filtroPeriodo;

  return (
    <>
      <PageHeader title="Gráficos" />
      <PageContainer>
      

        {/* Filtros globais */}
        <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FilterSelect
              label="Período"
              value={filtroPeriodo}
              onChange={setFiltroPeriodo}
              options={opcoesGlobais.periodos}
            />
            <FilterSelect
              label="Área"
              value={filtroArea}
              onChange={setFiltroArea}
              options={opcoesGlobais.areas}
            />
            <FilterSelect
              label="Congregação"
              value={filtroCong}
              onChange={setFiltroCong}
              options={opcoesGlobais.congregacoes}
            />
            <FilterSelect
              label="Grupo"
              value={filtroGrupo}
              onChange={setFiltroGrupo}
              options={opcoesGlobais.grupos}
            />
          </div>
        </section>

        {/* Indicadores */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {indicadores.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.label}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {ind.label}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {ind.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      <ChartCard
  title="Contribuições"
  subtitle="Ofertas confirmadas por mês"
>
  <div className="mb-3 grid grid-cols-2 gap-2 text-center">
    <div className="rounded-xl bg-muted/40 p-2">
      <p className="text-[11px] text-muted-foreground">
        Total confirmado
      </p>

      <p className="text-sm font-bold">
        {totalOfertas.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </p>
    </div>

    <div className="rounded-xl bg-muted/40 p-2">
      <p className="text-[11px] text-muted-foreground">
        Registros
      </p>

      <p className="text-sm font-bold">
        {quantidadeOfertas}
      </p>
    </div>
  </div>

  <div className="h-56 w-full">
    {ofertasPorMes.length === 0 ? (
      <EmptyChart />
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={ofertasPorMes}
          margin={{
            top: 8,
            right: 8,
            left: 0,
            bottom: 16,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(215 20% 92%)"
            vertical={false}
          />

          <XAxis
            dataKey="mes"
            tick={chartAxis}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={chartAxis}
            axisLine={false}
            tickLine={false}
            domain={[0, "auto"]}
          />

          <Tooltip
            formatter={(value) =>
              Number(value).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(215 20% 90%)",
              fontSize: 12,
            }}
          />

          <Bar
            dataKey="valor"
            fill="var(--primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</ChartCard>

        <div className="mt-6 space-y-4">
          {/* 1) Participantes por Área — barras verticais */}
<ChartCard
  title="Participantes por Área"
  subtitle="Campo ADNA — distribuição por área"
>
  <div className="h-56 w-full">
    {membrosPresentesPorArea.length === 0 ? (
      <EmptyChart />
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={membrosPresentesPorArea}
          margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(215 20% 92%)"
            vertical={false}
          />

          <XAxis
            dataKey="nome"
            tick={chartAxis}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={chartAxis}
            axisLine={false}
            tickLine={false}
            domain={[0, "auto"]}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ fill: "hsl(215 20% 96%)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(215 20% 90%)",
              fontSize: 12,
            }}
          />

          <Bar
  dataKey="membrosPresentes"
  fill="var(--primary)"
  radius={[8, 8, 0, 0]}
  maxBarSize={48}
/>
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</ChartCard>

          {/* 2) Membros por Congregação — hierarquia vertical clicável */}
          <ChartCard
            title="Participantes por Congregação"
            subtitle="Toque em uma congregação para ver o detalhamento"
          >
            {agg.areas.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="space-y-4">
                {agg.areas.map((area) => (
                  <div key={area.nome}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {area.nome}
                      </p>
                    </div>
                    <div className="space-y-2 border-l border-dashed border-border/70 pl-3">
                      {area.congregacoes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCong(c)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-card active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                              <Church className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {c.nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.membrosPresentes} membros presentes · {c.grupos.length} grupos
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* 3) Membros por Grupo Familiar */}
          <ChartCard
            title="Participantes por Grupo Familiar"
            subtitle="Toque em um grupo para ver o detalhamento"
          >
            <div className="mb-3">
              <Select value={filtroCongGrupos} onValueChange={setFiltroCongGrupos}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar Congregação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Congregações</SelectItem>
                  {opcoesGlobais.congregacoes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {gruposDaCongFiltrada.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="space-y-2">
                {gruposDaCongFiltrada.map((g) => (
                  <button
                    key={`${g.congregacao}-${g.nome}`}
                    onClick={() => setSelectedGroup(g)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-card active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <UsersRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {g.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {g.congregacao} · {g.membrosPresentes} membros presentes
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {g.membrosPresentes}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ChartCard>

          {/* 4) Visitantes */}
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
            <header className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Visitantes</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Evolução de visitantes por semana
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                <TrendingUp className="h-3 w-3" /> {agg.totals.visitantesCrentes + agg.totals.visitantesNaoCrentes}
              </span>
            </header>

            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/40 p-2">
                <p className="text-[11px] text-muted-foreground">Total</p>
               <p className="text-sm font-bold">{totalVisitantes}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2">
                <p className="text-[11px] text-muted-foreground">Semanas</p>
                <p className="text-sm font-bold">{agg.visitantesPorSemana.length}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2">
                <p className="text-[11px] text-muted-foreground">Relatórios</p>
                <p className="text-sm font-bold">{agg.totals.relatorios}</p>
              </div>
            </div>

            <div className="h-56 w-full">
              {agg.visitantesPorSemana.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={agg.visitantesPorSemana}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 92%)" vertical={false} />
                    <XAxis dataKey="semana" tick={chartAxis} axisLine={false} tickLine={false} />
                    <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(215 20% 90%)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visitantes"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "var(--primary)" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      </PageContainer>

      {/* Detalhamento da congregação */}
      <Dialog open={!!selectedCong} onOpenChange={(o) => !o && setSelectedCong(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          {selectedCong && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCong.nome}</DialogTitle>
                <DialogDescription>
                  {selectedCong.area} · {periodoLabel}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
               <StatBox
  label="Membros presentes"
  value={selectedCong.membrosPresentes}
/>

<StatBox
  label="Visitantes"
  value={
    selectedCong.visitantesCrentes +
    selectedCong.visitantesNaoCrentes
  }
/>
                <StatBox label="Grupos" value={selectedCong.grupos.length} />
                <StatBox
                  label="Relatórios"
                  value={selectedCong.relatoriosEnviados}
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Evolução de membros
                </p>
                <div className="h-40 w-full">
                  {selectedCong.evolucao.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedCong.evolucao}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 92%)" vertical={false} />
                        <XAxis dataKey="semana" tick={chartAxis} axisLine={false} tickLine={false} />
                        <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(215 20% 90%)",
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="membrosPresentes"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "var(--primary)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Grupos familiares
                </p>
                <div className="space-y-2">
                  {selectedCong.grupos.map((g) => (
                    <div
                      key={g.nome}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                          <UsersRound className="h-4 w-4" />
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {g.nome}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
  {g.membrosPresentes}
</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalhamento do grupo familiar */}
      <Dialog open={!!selectedGroup} onOpenChange={(o) => !o && setSelectedGroup(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          {selectedGroup && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGroup.nome}</DialogTitle>
                <DialogDescription>
                  {selectedGroup.congregacao} · {selectedGroup.area}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-2 text-sm">
                <InfoRow label="Líder" value={selectedGroup.lider} />
                <InfoRow label="Congregação" value={selectedGroup.congregacao} />
                <InfoRow label="Área" value={selectedGroup.area} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <StatBox
  label="Membros presentes"
  value={selectedGroup.membrosPresentes}
/>

<StatBox
  label="Visitantes"
  value={
    selectedGroup.visitantesCrentes +
    selectedGroup.visitantesNaoCrentes
  }
/>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Presença por semana
                </p>
                <div className="h-40 w-full">
                  {selectedGroup.presenca.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedGroup.presenca}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 92%)" vertical={false} />
                        <XAxis dataKey="semana" tick={chartAxis} axisLine={false} tickLine={false} />
                        <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(215 20% 90%)",
                            fontSize: 12,
                          }}
                        />
                      <Line
  type="monotone"
  dataKey="membrosPresentes"
  stroke="var(--primary)"
  strokeWidth={2.5}
  dot={{ r: 3, fill: "var(--primary)" }}
/>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Histórico dos relatórios
                </p>
                <div className="space-y-2">
                  {selectedGroup.historico.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {r.semana}
                        </p>
                        <p className="text-muted-foreground">
                          Enviado em {r.enviadoEm}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>
                          <span className="font-semibold text-foreground">
                            {r.membrosPresentes}
                          </span>{" "}
                          part.
                        </span>
                        <span>
                          <span className="font-semibold text-foreground">
                           {r.visitantesCrentes + r.visitantesNaoCrentes}
                          </span>{" "}
                          visit.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-border/70 bg-surface p-4 text-center text-xs text-muted-foreground">
      Sem relatórios revisados para os filtros selecionados.
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-10">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
