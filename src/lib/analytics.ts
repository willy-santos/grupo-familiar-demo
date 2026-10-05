// ---------------------------------------------------------------------------
// Camada central de Analytics — ADNA V1
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useReports, type Relatorio } from "@/lib/reportsData";

// ---------------------------------------------------------------------------
// Indicadores agregados
// ---------------------------------------------------------------------------

export interface AnalyticsIndicators {
  totalMembrosMatriculados: number;
  totalMembrosPresentes: number;
  totalVisitantesCrentes: number;
  totalVisitantesNaoCrentes: number;
  totalAssistencia: number;
  totalDecisoes: number;
  totalOfertas: number;

  gruposComRelatorioRevisado: number;
  gruposPendentes: number;

  relatoriosRevisados: number;
  relatoriosEnviados: number;
  relatoriosPendentes: number;

  ultimaSemanaRevisada: string | null;
}

export function computeIndicators(
  reports: Relatorio[],
): AnalyticsIndicators {
  const reviewed = reports.filter((r) => r.status === "reviewed");
  const pending = reports.filter((r) => r.status === "draft");
  const sent = reports.filter((r) => r.status === "sent");

  const gruposRevisados = new Set(reviewed.map((r) => r.grupo));
  const gruposPendentes = new Set(pending.map((r) => r.grupo));

  const parseEnviadoEm = (s: string): number => {
    const [dd, mm, yyyy] = (s ?? "").split("/");

    const d = Number(dd);
    const m = Number(mm);
    const y = Number(yyyy);

    if (!d || !m || !y) return -Infinity;

    return new Date(y, m - 1, d).getTime();
  };

  const ultimaSemanaRevisada =
    reviewed.length > 0
      ? [...reviewed].sort(
          (a, b) =>
            parseEnviadoEm(b.enviadoEm) -
            parseEnviadoEm(a.enviadoEm),
        )[0].semana
      : null;

  return {
    totalMembrosMatriculados: reviewed.reduce(
      (s, r) => s + r.membrosMatriculados,
      0,
    ),

    totalMembrosPresentes: reviewed.reduce(
      (s, r) => s + r.membrosPresentes,
      0,
    ),

    totalVisitantesCrentes: reviewed.reduce(
      (s, r) => s + r.visitantesCrentes,
      0,
    ),

    totalVisitantesNaoCrentes: reviewed.reduce(
      (s, r) => s + r.visitantesNaoCrentes,
      0,
    ),

    totalAssistencia: reviewed.reduce(
      (s, r) => s + r.totalAssistencia,
      0,
    ),

    totalDecisoes: reviewed.reduce(
      (s, r) => s + r.decisoes,
      0,
    ),

    totalOfertas: reviewed.reduce(
      (s, r) => s + r.oferta,
      0,
    ),

    gruposComRelatorioRevisado: gruposRevisados.size,
    gruposPendentes: gruposPendentes.size,

    relatoriosRevisados: reviewed.length,
    relatoriosEnviados: sent.length,
    relatoriosPendentes: pending.length,

    ultimaSemanaRevisada,
  };
}

// ---------------------------------------------------------------------------
// Hook dos indicadores
// ---------------------------------------------------------------------------

export function useAnalytics(): AnalyticsIndicators {
  const reports = useReports();

  return useMemo(
    () => computeIndicators(reports),
    [reports],
  );
}

// ---------------------------------------------------------------------------
// Agregações
// ---------------------------------------------------------------------------

export interface GroupAggregate {
  nome: string;
  congregacao: string;
  area: string;
  lider: string;

  membrosMatriculados: number;
  membrosPresentes: number;
  visitantesCrentes: number;
  visitantesNaoCrentes: number;
  totalAssistencia: number;
  decisoes: number;
  oferta: number;

  historico: Relatorio[];

  presenca: {
    semana: string;
    membrosMatriculados: number;
    membrosPresentes: number;
    visitantesCrentes: number;
    visitantesNaoCrentes: number;
    totalAssistencia: number;
    decisoes: number;
    oferta: number;
  }[];
}

export interface CongregationAggregate {
  id: string;
  nome: string;
  area: string;
  grupos: GroupAggregate[];

  membrosMatriculados: number;
  membrosPresentes: number;
  visitantesCrentes: number;
  visitantesNaoCrentes: number;
  totalAssistencia: number;
  decisoes: number;
  oferta: number;

  relatoriosEnviados: number;

  evolucao: {
    semana: string;
    membrosMatriculados: number;
    membrosPresentes: number;
    visitantesCrentes: number;
    visitantesNaoCrentes: number;
    totalAssistencia: number;
    decisoes: number;
    oferta: number;
  }[];
}

export interface AreaAggregate {
  nome: string;
  congregacoes: CongregationAggregate[];

  membrosMatriculados: number;
  membrosPresentes: number;
  visitantesCrentes: number;
  visitantesNaoCrentes: number;
  totalAssistencia: number;
  decisoes: number;
  oferta: number;
}

export interface AnalyticsAggregations {
  areas: AreaAggregate[];
  groups: GroupAggregate[];
  congregations: CongregationAggregate[];

  totals: {
    membrosMatriculados: number;
    membrosPresentes: number;
    visitantesCrentes: number;
    visitantesNaoCrentes: number;
    totalAssistencia: number;
    decisoes: number;
    oferta: number;

    areas: number;
    congregacoes: number;
    grupos: number;
    relatorios: number;
  };

  visitantesPorSemana: {
    semana: string;
    visitantesCrentes: number;
    visitantesNaoCrentes: number;
    visitantes: number;
  }[];
}

// ---------------------------------------------------------------------------
// Função principal de agregação
// ---------------------------------------------------------------------------

export function computeAggregations(
  reviewedReports: Relatorio[],
): AnalyticsAggregations {
  // -------------------------------------------------------------------------
  // GRUPOS
  // -------------------------------------------------------------------------

  const groupMap = new Map<string, Relatorio[]>();

  for (const r of reviewedReports) {
    const key = `${r.area}::${r.congregacao}::${r.grupo}`;

    const list = groupMap.get(key) ?? [];

    list.push(r);

    groupMap.set(key, list);
  }

  const groups: GroupAggregate[] = [];

  for (const [, list] of groupMap) {
    // O último relatório é o estado mais recente do grupo.
    const latest = list[list.length - 1];

    groups.push({
      nome: latest.grupo,
      congregacao: latest.congregacao,
      area: latest.area,
      lider: latest.lider,

      membrosMatriculados: latest.membrosMatriculados,
      membrosPresentes: latest.membrosPresentes,
      visitantesCrentes: latest.visitantesCrentes,
      visitantesNaoCrentes: latest.visitantesNaoCrentes,
      totalAssistencia: latest.totalAssistencia,
      decisoes: latest.decisoes,
      oferta: 0,

      historico: list,

      presenca: list.map((r) => ({
        semana: r.semana,
        membrosMatriculados: r.membrosMatriculados,
        membrosPresentes: r.membrosPresentes,
        visitantesCrentes: r.visitantesCrentes,
        visitantesNaoCrentes: r.visitantesNaoCrentes,
        totalAssistencia: r.totalAssistencia,
        decisoes: r.decisoes,
        oferta: 0,
      })),
    });
  }

  // -------------------------------------------------------------------------
  // CONGREGAÇÕES
  // -------------------------------------------------------------------------

  const congMap = new Map<string, GroupAggregate[]>();

  for (const g of groups) {
    const key = `${g.area}::${g.congregacao}`;

    const list = congMap.get(key) ?? [];

    list.push(g);

    congMap.set(key, list);
  }

  const congregations: CongregationAggregate[] = [];

  for (const [key, grupos] of congMap) {
    const [area, nome] = key.split("::");

    const relatoriosCount = reviewedReports.filter(
      (r) =>
        r.area === area &&
        r.congregacao === nome,
    ).length;

    // ---------------------------------------------------------------
    // Evolução semanal da congregação
    // ---------------------------------------------------------------

    const weekMap = new Map<
      string,
      {
        membrosMatriculados: number;
        membrosPresentes: number;
        visitantesCrentes: number;
        visitantesNaoCrentes: number;
        totalAssistencia: number;
        decisoes: number;
        oferta: number;
      }
    >();

    for (const r of reviewedReports) {
      if (
        r.area !== area ||
        r.congregacao !== nome
      ) {
        continue;
      }

      const current = weekMap.get(r.semana) ?? {
        membrosMatriculados: 0,
        membrosPresentes: 0,
        visitantesCrentes: 0,
        visitantesNaoCrentes: 0,
        totalAssistencia: 0,
        decisoes: 0,
        oferta: 0,
      };

      weekMap.set(r.semana, {
        membrosMatriculados:
          current.membrosMatriculados +
          r.membrosMatriculados,

        membrosPresentes:
          current.membrosPresentes +
          r.membrosPresentes,

        visitantesCrentes:
          current.visitantesCrentes +
          r.visitantesCrentes,

        visitantesNaoCrentes:
          current.visitantesNaoCrentes +
          r.visitantesNaoCrentes,

        totalAssistencia:
          current.totalAssistencia +
          r.totalAssistencia,

        decisoes:
          current.decisoes +
          r.decisoes,

        oferta:
          current.oferta +
          r.oferta,
      });
    }

    const evolucao = Array.from(
      weekMap.entries(),
    ).map(([semana, valores]) => ({
      semana,
      ...valores,
    }));

    congregations.push({
      id: `${area}-${nome}`,
      nome,
      area,
      grupos,

      membrosMatriculados: grupos.reduce(
        (s, g) =>
          s + g.membrosMatriculados,
        0,
      ),

      membrosPresentes: grupos.reduce(
        (s, g) =>
          s + g.membrosPresentes,
        0,
      ),

      visitantesCrentes: grupos.reduce(
        (s, g) =>
          s + g.visitantesCrentes,
        0,
      ),

      visitantesNaoCrentes: grupos.reduce(
        (s, g) =>
          s + g.visitantesNaoCrentes,
        0,
      ),

      totalAssistencia: grupos.reduce(
        (s, g) =>
          s + g.totalAssistencia,
        0,
      ),

      decisoes: grupos.reduce(
        (s, g) =>
          s + g.decisoes,
        0,
      ),

      oferta: grupos.reduce(
        (s, g) =>
          s + g.oferta,
        0,
      ),

      relatoriosEnviados:
        relatoriosCount,

      evolucao,
    });
  }

  // -------------------------------------------------------------------------
  // ÁREAS
  // -------------------------------------------------------------------------

  const areaMap =
    new Map<string, CongregationAggregate[]>();

  for (const c of congregations) {
    const list =
      areaMap.get(c.area) ?? [];

    list.push(c);

    areaMap.set(c.area, list);
  }

  const areas: AreaAggregate[] =
    Array.from(areaMap.entries()).map(
      ([nome, congregacoes]) => ({
        nome,
        congregacoes,

        membrosMatriculados:
          congregacoes.reduce(
            (s, c) =>
              s + c.membrosMatriculados,
            0,
          ),

        membrosPresentes:
          congregacoes.reduce(
            (s, c) =>
              s + c.membrosPresentes,
            0,
          ),

        visitantesCrentes:
          congregacoes.reduce(
            (s, c) =>
              s + c.visitantesCrentes,
            0,
          ),

        visitantesNaoCrentes:
          congregacoes.reduce(
            (s, c) =>
              s + c.visitantesNaoCrentes,
            0,
          ),

        totalAssistencia:
          congregacoes.reduce(
            (s, c) =>
              s + c.totalAssistencia,
            0,
          ),

        decisoes:
          congregacoes.reduce(
            (s, c) =>
              s + c.decisoes,
            0,
          ),

        oferta:
          congregacoes.reduce(
            (s, c) =>
              s + c.oferta,
            0,
          ),
      }),
    );

  // -------------------------------------------------------------------------
  // VISITANTES POR SEMANA
  // -------------------------------------------------------------------------

  const visMap = new Map<
    string,
    {
      visitantesCrentes: number;
      visitantesNaoCrentes: number;
    }
  >();

  for (const r of reviewedReports) {
    const current =
      visMap.get(r.semana) ?? {
        visitantesCrentes: 0,
        visitantesNaoCrentes: 0,
      };

    visMap.set(r.semana, {
      visitantesCrentes:
        current.visitantesCrentes +
        r.visitantesCrentes,

      visitantesNaoCrentes:
        current.visitantesNaoCrentes +
        r.visitantesNaoCrentes,
    });
  }

  const visitantesPorSemana =
    Array.from(visMap.entries()).map(
      ([semana, valores]) => ({
        semana,

        visitantesCrentes:
          valores.visitantesCrentes,

        visitantesNaoCrentes:
          valores.visitantesNaoCrentes,

        visitantes:
          valores.visitantesCrentes +
          valores.visitantesNaoCrentes,
      }),
    );

  // -------------------------------------------------------------------------
  // TOTAIS
  // -------------------------------------------------------------------------

  const totals = {
    membrosMatriculados:
      groups.reduce(
        (s, g) =>
          s + g.membrosMatriculados,
        0,
      ),

    membrosPresentes:
      groups.reduce(
        (s, g) =>
          s + g.membrosPresentes,
        0,
      ),

    visitantesCrentes:
      groups.reduce(
        (s, g) =>
          s + g.visitantesCrentes,
        0,
      ),

    visitantesNaoCrentes:
      groups.reduce(
        (s, g) =>
          s + g.visitantesNaoCrentes,
        0,
      ),

    totalAssistencia:
      groups.reduce(
        (s, g) =>
          s + g.totalAssistencia,
        0,
      ),

    decisoes:
      groups.reduce(
        (s, g) =>
          s + g.decisoes,
        0,
      ),

    oferta:
      groups.reduce(
        (s, g) =>
          s + g.oferta,
        0,
      ),

    areas: areas.length,
    congregacoes: congregations.length,
    grupos: groups.length,
    relatorios: reviewedReports.length,
  };

  return {
    areas,
    groups,
    congregations,
    totals,
    visitantesPorSemana,
  };
}

// ---------------------------------------------------------------------------
// Hook reativo das agregações
// ---------------------------------------------------------------------------

export function useAnalyticsAggregations(
  reviewedReports?: Relatorio[],
): AnalyticsAggregations {
  const all = useReports();

  return useMemo(() => {
    const source =
      reviewedReports ??
      all.filter(
        (r) => r.status === "reviewed",
      );

    return computeAggregations(source);
  }, [reviewedReports, all]);
}