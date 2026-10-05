
import { useSyncExternalStore } from "react";
import { addRealtimeListener } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

export type ReportStatus = "draft" | "sent" | "reviewed";

export interface Relatorio {
  id: string;
  userId?: string;
  grupoId?: string;

  campo: string;
  area: string;
  congregacao: string;
  grupo: string;
  lider: string;
  liderEmail?: string;
  semana: string;

  membrosMatriculados: number;
  membrosPresentes: number;
  visitantesCrentes: number;
  visitantesNaoCrentes: number;
  totalAssistencia: number;

  decisoes: number;
  decisoesDescricao?: string;

  oferta: number;

  observacoes?: string;

  status: ReportStatus;
  enviadoEm: string;
}
async function reloadReports() {
  if (store.hydrating) return;

  console.log("[reportsData] recarregando relatórios");

  store.hydrated = false;

  await ensureHydrated();
}
// ---------------------------------------------------------------------------
// Row shape no Supabase (tabela `public.reports`).
// ---------------------------------------------------------------------------
interface ReportRow {
  id: string;
  user_id: string | null;
  grupo_id: string | null;
  semana: string;
  status: ReportStatus;
  lider_nome: string | null;
  lider_email: string | null;
  grupo: string;
  area: string;
  congregacao: string;
  campo: string;

  // Campos antigos
  membros: number | null;
  visitantes: number | null;

  // Novos campos
  membros_matriculados: number | null;
  membros_presentes: number | null;
  visitantes_crentes: number | null;
  visitantes_nao_crentes: number | null;
  total_assistencia: number | null;

  decisoes: number | null;
  decisoes_descricao: string | null;
  ofertas: number | null;

  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function rowToRelatorio(r: ReportRow): Relatorio {

  const membrosMatriculados = r.membros_matriculados ?? r.membros ?? 0;
  const membrosPresentes = r.membros_presentes ?? 0;
  const visitantesCrentes = r.visitantes_crentes ?? 0;
  const visitantesNaoCrentes = r.visitantes_nao_crentes ?? 0;

  const totalAssistencia =
    r.total_assistencia ??
    (membrosPresentes +
      visitantesCrentes +
      visitantesNaoCrentes);

  return {
    id: r.id,
    userId: r.user_id ?? undefined,
    grupoId: r.grupo_id ?? undefined,

    campo: r.campo,
    area: r.area,
    congregacao: r.congregacao,
    grupo: r.grupo,

    lider: r.lider_nome ?? "",
    liderEmail: r.lider_email ?? undefined,
    semana: r.semana,

    membrosMatriculados,
    membrosPresentes,
    visitantesCrentes,
    visitantesNaoCrentes,
    totalAssistencia,

    decisoes: r.decisoes ?? 0,
decisoesDescricao: r.decisoes_descricao ?? undefined,
oferta: r.ofertas ?? 0,

    observacoes: r.observacoes ?? undefined,

    status: r.status,

    enviadoEm:
      r.status === "draft"
        ? "—"
        : formatDateBR(r.created_at),
  };
}

function relatorioToInsertRow(r: Relatorio): Record<string, unknown> {
  return {
    grupo_id: r.grupoId ?? null,

    semana: r.semana,
    status: r.status,

    lider_nome: r.lider || null,
    lider_email: r.liderEmail ?? null,

    grupo: r.grupo,
    area: r.area,
    congregacao: r.congregacao,
    campo: r.campo,

    membros_matriculados: r.membrosMatriculados,
    membros_presentes: r.membrosPresentes,

    visitantes_crentes: r.visitantesCrentes,
    visitantes_nao_crentes: r.visitantesNaoCrentes,

    total_assistencia: r.totalAssistencia,

    decisoes: r.decisoes,
decisoes_descricao: r.decisoesDescricao ?? null,
ofertas: r.oferta,
observacoes: r.observacoes ?? null,
  };
}
// ---------------------------------------------------------------------------
// Store reativo local (cache do banco).
// ---------------------------------------------------------------------------

type ReportStore = {
  state: Relatorio[];
  version: number;
  hydrated: boolean;
  hydrating: Promise<void> | null;
  listeners: Set<() => void>;
};

const __g = globalThis as unknown as { __adnaReportStore?: ReportStore };
const store: ReportStore =
  __g.__adnaReportStore ??
  (__g.__adnaReportStore = {
    state: [],
    version: 0,
    hydrated: false,
    hydrating: null,
    listeners: new Set<() => void>(),
  });

function emit() {
  store.version += 1;
  store.listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  store.listeners.add(cb);
  void ensureHydrated();
  return () => {
    store.listeners.delete(cb);
  };
}

function getSnapshot() {
  return store.version;
}

async function hydrate(): Promise<void> {
  const { data, error } = await supabase
    .from("reports")
    .select(
  "id,user_id,grupo_id,semana,status,lider_nome,lider_email,grupo,area,congregacao,campo,membros,membros_matriculados,membros_presentes,visitantes,visitantes_crentes,visitantes_nao_crentes,total_assistencia,decisoes,ofertas,observacoes,decisoes_descricao,created_at,updated_at",
)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reportsData] falha ao carregar relatórios do Supabase:", error);
    store.hydrated = true;
    emit();
    return;
  }

  store.state = ((data ?? []) as ReportRow[]).map((r) => rowToRelatorio(r));
  store.hydrated = true;
  emit();
}

function ensureHydrated(): Promise<void> {
  if (store.hydrated) return Promise.resolve();
  if (!store.hydrating) {
    store.hydrating = hydrate().finally(() => {
      store.hydrating = null;
    });
  }
  return store.hydrating;
}

// Kick off hidratação assim que o módulo carrega no client.
if (typeof window !== "undefined") {
  void ensureHydrated();
}
const globalStore = globalThis as {
  __adnaReportsRealtime?: boolean;
};

if (
  typeof window !== "undefined" &&
  !globalStore.__adnaReportsRealtime
) {
  globalStore.__adnaReportsRealtime = true;

  addRealtimeListener(
    "reports",
    reloadReports,
  );
}
// ---------------------------------------------------------------------------
// API pública (mesma assinatura da versão anterior).
// ---------------------------------------------------------------------------

// Mantido para compatibilidade com imports existentes (agora vazio: os
// dados reais vêm do Supabase).
export const mockRelatorios: Relatorio[] = [];

export function useReports(): Relatorio[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return store.state;
}

export function getReports(): Relatorio[] {
  return store.state;
}

export function getReviewedReports(): Relatorio[] {
  return store.state.filter((r) => r.status === "reviewed");
}

// Semana de referência atual do sistema (mock — futuramente calculada a
// partir da data corrente / configuração do administrador).
function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();

  const day = now.getDay(); // 0 = domingo, 1 = segunda
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getCurrentWeekLabel(): string {
  const { start, end } = getCurrentWeekRange();

  const format = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return `${format(start)}–${format(end)}`;
}

export function getReportForGroupWeek(
  grupo: string,
  semana: string = getCurrentWeekLabel(),
): Relatorio | undefined {
  return store.state.find((r) => r.grupo === grupo && r.semana === semana);

}

export function getPendingGroupsForWeek(
  semana: string = getCurrentWeekLabel(),
): Relatorio[] {
  return store.state.filter(
    (r) => r.semana === semana && r.status === "draft",
  );
}



export type NewReportInput = Omit<
  Relatorio,
  "id" | "status" | "enviadoEm"
> & { status?: ReportStatus };

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addReport(input: NewReportInput): Relatorio {
  const novo: Relatorio = {
    ...input,
    id: newId(),
    status: input.status ?? "sent",
    enviadoEm: formatToday(),
  };

  store.state = [novo, ...store.state];
  emit();

  void supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error || !user) {
      console.error("[reportsData] usuário não encontrado:", error);
      return;
    }

    void supabase
      .from("reports")
      .insert({
  ...relatorioToInsertRow(novo),
  user_id: user.id,
})
.select()
.single()
.then(({ data, error }) => {
  if (data) {
  store.state = store.state.map((r) =>
    r.id === novo.id
      ? {
          ...r,
          id: data.id,
        }
      : r,
  );
  emit();
}
console.log("[reportsData] UUID real do Supabase:", data.id);
        if (error) {
          console.error("[reportsData] falha ao inserir relatório:", error);
          store.hydrated = false;
          void ensureHydrated();
        }
      });
  });

  return novo;
}

export function markReviewed(id: string): void {
  let changed = false;

  const report = store.state.find((r) => r.id === id);

  if (!report) {
    console.warn(
      "[reportsData] relatório não encontrado para revisão:",
      id,
    );
    return;
  }

  store.state = store.state.map((r) => {
    if (r.id === id && r.status !== "reviewed") {
      changed = true;

      return {
        ...r,
        status: "reviewed",
      };
    }

    return r;
  });

  if (!changed) return;

  emit();

  void supabase.auth.getUser().then(async ({ data: { user }, error }) => {
    if (error || !user) {
      console.error(
        "[reportsData] usuário não encontrado ao revisar relatório:",
        error,
      );
      return;
    }

    // ------------------------------------------------------------
    // 1. Marca o relatório como revisado
    // ------------------------------------------------------------

    const { error: reportError } = await supabase
      .from("reports")
      .update({
        status: "reviewed",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", id);

    if (reportError) {
      console.error(
        "[reportsData] falha ao marcar relatório como revisado:",
        reportError,
      );

      store.hydrated = false;
      void ensureHydrated();

      return;
    }

   // ------------------------------------------------------------
// 2. Se o relatório possui oferta, cria/confirma a oferta
// ------------------------------------------------------------

if (Number(report.oferta || 0) > 0) {
  const amount = Number(report.oferta);

  // Procura se já existe uma oferta vinculada a este relatório
  const { data: existingOffering, error: findOfferingError } =
    await supabase
      .from("offerings")
      .select("id")
      .eq("report_id", id)
      .maybeSingle();

  if (findOfferingError) {
    console.error(
      "[reportsData] erro ao procurar oferta do relatório:",
      findOfferingError,
    );
  } else if (existingOffering?.id) {
    // ----------------------------------------------------------
    // Já existe → apenas confirma/atualiza
    // ----------------------------------------------------------

    const { error: offeringError } = await supabase
      .from("offerings")
      .update({
        status: "confirmed",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
        amount,
      })
      .eq("id", existingOffering.id);

    if (offeringError) {
      console.error(
        "[reportsData] falha ao confirmar oferta existente:",
        offeringError,
      );
    } else {
      console.log(
        "[reportsData] oferta existente confirmada:",
        {
          reportId: id,
          offeringId: existingOffering.id,
          amount,
        },
      );
    }
  } else {
    // ----------------------------------------------------------
    // Não existe → cria a oferta
    // ----------------------------------------------------------

    const { error: offeringError } = await supabase
      .from("offerings")
      .insert({
        report_id: id,
        group_id: report.grupoId,
        leader_id: report.userId,
        amount,
        offering_date: new Date().toISOString(),
        status: "confirmed",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      });

    if (offeringError) {
      console.error(
        "[reportsData] falha ao criar oferta do relatório:",
        offeringError,
      );
    } else {
      console.log(
        "[reportsData] oferta criada e confirmada:",
        {
          reportId: id,
          amount,
        },
      );
    }
  }
}

    // ------------------------------------------------------------
    // 3. Recarrega os dados
    // ------------------------------------------------------------

    store.hydrated = false;
    void ensureHydrated();
  });
}
async function resolveGrupoId(
  userId: string,
  grupoNome: string,
): Promise<string> {
  // 1. Resolve o grupo pelo nome.
  const { data: grupo, error: grupoError } = await supabase
    .from("grupos")
    .select("id")
    .eq("nome", grupoNome)
    .maybeSingle();

  if (grupoError) {
    console.error(
      "[reportsData] erro ao buscar grupo:",
      grupoError,
    );
    throw grupoError;
  }

  if (!grupo?.id) {
    throw new Error(
      `Grupo "${grupoNome}" não encontrado.`,
    );
  }

  // 2. Confirma o vínculo oficial do líder com o grupo.
  const { data: vinculo, error: vinculoError } = await supabase
    .from("grupo_lideres")
    .select("grupo_id")
    .eq("grupo_id", grupo.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (vinculoError) {
    console.error(
      "[reportsData] erro ao verificar vínculo líder/grupo:",
      vinculoError,
    );
    throw vinculoError;
  }

  if (!vinculo) {
    throw new Error(
      `O usuário não está vinculado ao grupo "${grupoNome}".`,
    );
  }

  return grupo.id;
}
export async function generateReportsForWeek(
  semana: string,
): Promise<void> {
  console.log("[reportsData] gerando relatórios da semana:", semana);

  // ------------------------------------------------------------
  // 1. Busca grupos ativos que possuem líder
  // ------------------------------------------------------------

  const { data: grupos, error: gruposError } = await supabase
    .from("grupos")
    .select(`
      id,
      nome,
      leader_id,
      area,
      congregacao,
      campo,
      status
    `)
    .eq("status", "Ativo")
    .not("leader_id", "is", null);

  if (gruposError) {
    console.error(
      "[reportsData] erro ao buscar grupos para gerar relatórios:",
      gruposError,
    );

    throw gruposError;
  }

  if (!grupos || grupos.length === 0) {
    console.log(
      "[reportsData] nenhum grupo ativo com líder encontrado.",
    );

    return;
  }

  // ------------------------------------------------------------
  // 2. Busca os perfis dos líderes
  // ------------------------------------------------------------

  const leaderIds = grupos
    .map((g) => g.leader_id)
    .filter((id): id is string => !!id);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", leaderIds);

  if (profilesError) {
    console.error(
      "[reportsData] erro ao buscar perfis dos líderes:",
      profilesError,
    );

    throw profilesError;
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  // ------------------------------------------------------------
  // 3. Para cada grupo, verifica se já existe relatório
  // ------------------------------------------------------------

  for (const grupo of grupos) {
    if (!grupo.leader_id) continue;

    const profile = profilesById.get(grupo.leader_id);

    if (!profile) {
      console.warn(
        "[reportsData] líder sem perfil encontrado:",
        grupo.leader_id,
      );

      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("reports")
      .select("id, status")
      .eq("grupo_id", grupo.id)
      .eq("semana", semana)
      .maybeSingle();

    if (existingError) {
      console.error(
        "[reportsData] erro ao verificar relatório existente:",
        {
          grupo: grupo.nome,
          semana,
          error: existingError,
        },
      );

      throw existingError;
    }

    // Já existe → não cria outro.
    if (existing) {
      console.log(
        "[reportsData] relatório já existe:",
        {
          grupo: grupo.nome,
          semana,
          status: existing.status,
        },
      );

      continue;
    }

    // ----------------------------------------------------------
    // 4. Cria o draft
    // ----------------------------------------------------------

    const { error: insertError } = await supabase
      .from("reports")
      .insert({
        user_id: grupo.leader_id,

        grupo_id: grupo.id,

        semana,
        status: "draft",

        lider_nome: profile.full_name,
        lider_email: profile.email,

        grupo: grupo.nome,
        area: grupo.area ?? "",
        congregacao: grupo.congregacao ?? "",
        campo: grupo.campo ?? "",

        membros: 0,
        visitantes: 0,
        decisoes: 0,
        batismos: 0,
        ofertas: 0,
        observacoes: null,
      });

    if (insertError) {
      console.error(
        "[reportsData] erro ao criar draft:",
        {
          grupo: grupo.nome,
          grupoId: grupo.id,
          semana,
          error: insertError,
        },
      );

      // Se outro processo criou simultaneamente,
      // o UNIQUE pode acusar conflito. Nesse caso não
      // consideramos isso uma falha fatal.
      if (insertError.code === "23505") {
        console.warn(
          "[reportsData] draft já criado simultaneamente:",
          grupo.nome,
          semana,
        );

        continue;
      }

      throw insertError;
    }

    console.log(
      "[reportsData] draft criado:",
      {
        grupo: grupo.nome,
        grupoId: grupo.id,
        lider: profile.full_name,
        semana,
      },
    );
  }

  console.log(
    "[reportsData] geração de relatórios concluída:",
    semana,
  );
}
export async function submitReport(
  input: NewReportInput,
): Promise<Relatorio> {
  console.log("[reportsData] início do envio:", {
    grupo: input.grupo,
    semana: input.semana,
  });

  // ------------------------------------------------------------
  // 1. Usuário autenticado
  // ------------------------------------------------------------

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    console.error(
      "[reportsData] usuário autenticado não encontrado:",
      authError,
    );

    throw new Error("Usuário não autenticado.");
  }

  const userId = authData.user.id;

  console.log("[reportsData] usuário do envio:", {
    userId,
    email: authData.user.email,
  });
const grupoId = input.grupoId ?? await resolveGrupoId(
  userId,
  input.grupo,
);

console.log("[reportsData] grupo resolvido:", {
  grupo: input.grupo,
  grupoId,
  userId,
});
  // ------------------------------------------------------------
  // 2. Procura qualquer relatório da mesma semana/grupo
  // ------------------------------------------------------------
  //
  // NÃO filtramos pelo user_id aqui.
  //
  // Isso é importante porque o líder do grupo pode ter sido
  // substituído e o draft antigo pode ter sido criado pelo
  // líder anterior.
  // ------------------------------------------------------------

  const { data: existingRow, error: findError } = await supabase
  .from("reports")
  .select(`
    id,
    user_id,
    grupo_id,
    semana,
    status,
    lider_nome,
    lider_email,
    grupo,
    area,
    congregacao,
    campo,
    membros,
    membros_matriculados,
    membros_presentes,
    visitantes,
    visitantes_crentes,
    visitantes_nao_crentes,
    total_assistencia,
   decisoes,
   decisoes_descricao,
   ofertas,
   observacoes,
    created_at,
    updated_at
  `)
  .eq("grupo", input.grupo)
  .eq("semana", input.semana)
  .maybeSingle();

  console.log("[reportsData] BUSCA DO DRAFT:", {
  grupo: input.grupo,
  grupoId,
  semana: input.semana,
  userId,
  existingRow,
  findError,
});

  if (findError) {
    console.error(
      "[reportsData] erro ao procurar draft:",
      findError,
    );

    throw findError;
  }

  // ------------------------------------------------------------
  // 3. Se existe draft, usamos ele.
  // ------------------------------------------------------------

  let existing: Relatorio | null = existingRow
    ? rowToRelatorio(existingRow as ReportRow)
    : null;

  // ------------------------------------------------------------
  // 4. Se NÃO existe draft, criamos diretamente como SENT.
  // ------------------------------------------------------------

  if (!existing) {
  console.log(
    "[reportsData] Nenhum relatório encontrado. Criando relatório enviado...",
  );

  const novo: Relatorio = {
    ...input,
    id: newId(),
    userId,
    grupoId,
    status: "sent",
    enviadoEm: formatToday(),
  };

  const { data: createdRow, error: createError } =
    await supabase
      .from("reports")
      .insert({
        ...relatorioToInsertRow(novo),
        user_id: userId,
      })
      .select()
      .single();

  if (createError || !createdRow) {
    console.error(
      "[reportsData] falha ao criar relatório:",
      createError,
    );

    throw (
      createError ??
      new Error("Não foi possível criar o relatório.")
    );
  }

  const created = rowToRelatorio(
    createdRow as ReportRow,
  );

  store.state = [
    created,
    ...store.state.filter(
      (r) =>
        !(
          r.grupo === input.grupo &&
          r.semana === input.semana
        ),
    ),
  ];

  emit();

  console.log(
    "[reportsData] RELATÓRIO CRIADO E ENVIADO:",
    created.id,
  );

  return created;
}

// ------------------------------------------------------------
// 5. Já existe um relatório enviado/revisado.
// ------------------------------------------------------------

if (
  existing.status === "sent" ||
  existing.status === "reviewed"
) {
  console.log(
    "[reportsData] Já existe relatório para este grupo e semana:",
    {
      id: existing.id,
      grupo: existing.grupo,
      semana: existing.semana,
      status: existing.status,
      lider: existing.lider,
      liderEmail: existing.liderEmail,
    },
  );

  return existing;
}

  // ------------------------------------------------------------
  // 5. Existe draft → transforma em enviado.
  // ------------------------------------------------------------

  const updated: Relatorio = {
  ...existing,
  ...input,
  id: existing.id,
  userId,
  grupoId,
  status: "sent",
  enviadoEm: formatToday(),
};

  const { data, error } = await supabase
    .from("reports")
    .update({
      user_id: userId,
      status: "sent",
      lider_nome: updated.lider || null,
      lider_email: updated.liderEmail ?? null,
      grupo: updated.grupo,
      area: updated.area,
      congregacao: updated.congregacao,
      campo: updated.campo,
      membros: updated.membrosMatriculados,
membros_matriculados: updated.membrosMatriculados,
membros_presentes: updated.membrosPresentes,
visitantes: updated.visitantesCrentes + updated.visitantesNaoCrentes,
visitantes_crentes: updated.visitantesCrentes,
visitantes_nao_crentes: updated.visitantesNaoCrentes,
total_assistencia: updated.totalAssistencia,
decisoes: updated.decisoes,
decisoes_descricao: updated.decisoesDescricao ?? null,
ofertas: updated.oferta,
observacoes: updated.observacoes ?? null,
    })
    .eq("id", existing.id)
    .select()
    .single();

  console.log("[reportsData] resultado envio:", {
    data,
    error,
  });

  if (error) {
    console.error(
      "[reportsData] falha ao enviar relatório:",
      error,
    );

    store.hydrated = false;
    await ensureHydrated();

    throw error;
  }

  if (!data) {
    throw new Error(
      "O relatório não foi atualizado.",
    );
  }

  const result = rowToRelatorio(
    data as ReportRow,
  );

  // Atualiza cache
  store.state = store.state.map((r) =>
    r.id === result.id ? result : r,
  );

  emit();

  console.log(
    "[reportsData] RELATÓRIO ENVIADO COM SUCESSO:",
    result.id,
  );

  return result;
}

export function getReportById(id: string): Relatorio | undefined {
  return store.state.find((r) => r.id === id);
}

// Preserva o store entre reloads de HMR — evita perda do estado e
// duplicação de instâncias do módulo.
if (import.meta.hot) {
  import.meta.hot.accept();
}
