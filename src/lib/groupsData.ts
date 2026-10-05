// ---------------------------------------------------------------------------
// Fonte única dos Grupos Familiares — agora persistida no Supabase.
//
// A interface pública deste módulo é mantida IDÊNTICA à versão em memória
// anterior (mesmos nomes, mesmas assinaturas, mesma semântica síncrona)
// para que os consumidores existentes NÃO precisem ser alterados:
//   - /grupos      (CRUD dos grupos)
//   - /usuarios    (atribuição de líder, substituição, detecção de grupo
//                   já ocupado)
//   - features/auth/currentUser.ts  (hierarquia campo/área/congregação
//                                    e resolução do líder por e-mail)
//   - /relatorios  (via currentUser -> getGrupoHierarquia)
//
// Estratégia:
//   - Um store reativo local (useSyncExternalStore) segue existindo,
//     porém a única fonte de verdade é o Supabase.
//   - Na inicialização do módulo, o store é hidratado a partir do banco.
//   - Mutações atualizam otimisticamente o store e disparam a persistência
//     no Supabase; em caso de erro, o estado é ressincronizado.
//   - Ao recarregar a página, o módulo é reimportado e a hidratação a
//     partir do Supabase garante a persistência.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { addRealtimeListener } from "@/lib/realtime";

export const CAMPO_ADNA = "Assembleia de Deus Nova Ananindeua";

export type GrupoStatus = "Ativo" | "Inativo";

export interface Grupo {
  id: string;
  nome: string;
  area: string;
  congregacao: string;
  campo: string;
  status: GrupoStatus;

  // ID do usuário que atualmente lidera o grupo.
  // É o vínculo oficial entre profiles e grupos.
  leaderId?: string;

  // Mantidos para exibição/compatibilidade.
  liderNome?: string;
  liderEmail?: string;
}

// ---------------------------------------------------------------------------
// Row shape no Supabase (tabela `public.grupos`).
// ---------------------------------------------------------------------------
interface GrupoRow {
  id: string;
  nome: string;
  area: string;
  congregacao: string;
  campo: string;
  status: GrupoStatus;
  leader_id: string | null;
  lider_nome: string | null;
  lider_email: string | null;
}

function rowToGrupo(r: GrupoRow): Grupo {
  return {
    id: r.id,
    nome: r.nome,
    area: r.area,
    congregacao: r.congregacao,
    campo: r.campo ?? CAMPO_ADNA,
    status: r.status,

    leaderId: r.leader_id ?? undefined,

    liderNome: r.lider_nome ?? undefined,
    liderEmail: r.lider_email ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Store reativo local (cache do banco).
// ---------------------------------------------------------------------------

type GroupStore = {
  state: Grupo[];
  version: number;
  hydrated: boolean;
  hydrating: Promise<void> | null;
  listeners: Set<() => void>;
};

const __g = globalThis as unknown as { __adnaGroupStore?: GroupStore };
const store: GroupStore =
  __g.__adnaGroupStore ??
  (__g.__adnaGroupStore = {
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
  // Dispara hidratação lazy na primeira assinatura.
  void ensureGroupsHydrated();
  return () => {
    store.listeners.delete(cb);
  };
}

export function subscribeGroups(cb: () => void) {
  return subscribe(cb);
}

function getSnapshot() {
  return store.version;
}

async function hydrate(): Promise<void> {
  const { data, error } = await supabase
  .from("grupos")
  .select(
    "id,nome,area,congregacao,campo,status,leader_id,lider_nome,lider_email"
  )
  .order("nome", { ascending: true });

  if (error) {
    console.error("[groupsData] falha ao carregar grupos do Supabase:", error);
    store.hydrated = true;
    emit();
    return;
  }

  store.state = ((data ?? []) as GrupoRow[]).map((r: GrupoRow) => rowToGrupo(r));
  store.hydrated = true;
  emit();
}
async function reloadGroups() {
  if (store.hydrating) return;

  console.log("[groupsData] recarregando grupos");

  store.hydrated = false;

  await ensureGroupsHydrated();
}
export function ensureGroupsHydrated(): Promise<void> {
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
  void ensureGroupsHydrated();
}
const globalStore = globalThis as unknown as {
  __adnaGroupsRealtime?: boolean;
};

if (
  typeof window !== "undefined" &&
  !globalStore.__adnaGroupsRealtime
) {
  globalStore.__adnaGroupsRealtime = true;

  addRealtimeListener(
    "grupos",
    reloadGroups,
  );
}
// ---------------------------------------------------------------------------
// API pública (mesma assinatura da versão anterior).
// ---------------------------------------------------------------------------

export function useGroups(): Grupo[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return store.state;
}

export function getGroups(): Grupo[] {
  return store.state;
}

export function getGroupByName(nome: string): Grupo | undefined {
  return store.state.find((g) => g.nome === nome);
}

export function getGroupForLeaderEmail(email: string): Grupo | undefined {
  const e = email.toLowerCase();
  if (!e) return undefined;
  return store.state.find((g) => (g.liderEmail ?? "").toLowerCase() === e);
}

export function getGrupoHierarquia(nome: string | undefined): {
  campo: string;
  area: string;
  congregacao: string;
} {
  const g = nome ? getGroupByName(nome) : undefined;
  return {
    campo: g?.campo ?? CAMPO_ADNA,
    area: g?.area ?? "—",
    congregacao: g?.congregacao ?? "—",
  };
}

export type NewGrupoInput = {
  nome: string;
  area: string;
  congregacao: string;
  status: GrupoStatus;
  campo?: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Cria um grupo. Retorna imediatamente o objeto criado e persiste no Supabase em background.
 * e persiste no Supabase em background — mantendo a assinatura síncrona
 * esperada pelos consumidores atuais.
 */
export function addGroup(input: NewGrupoInput): Grupo {
  const grupo: Grupo = {
    id: newId(),
    nome: input.nome,
    area: input.area,
    congregacao: input.congregacao,
    campo: input.campo ?? CAMPO_ADNA,
    status: input.status,
  };
  store.state = [...store.state, grupo];
  emit();

  void supabase
    .from("grupos")
    .insert({
  id: grupo.id,
  nome: grupo.nome,
  area: grupo.area,
  congregacao: grupo.congregacao,
  campo: grupo.campo,
  status: grupo.status,
  lider_nome: null,
  lider_email: null,
})
    .then(({ error }: { error: unknown }) => {
      if (error) {
        console.error("[groupsData] falha ao inserir grupo:", error);
        // Ressincroniza a partir do banco para refletir o estado real.
        store.hydrated = false;
        void ensureGroupsHydrated();
      }
    });

  return grupo;
}

export function updateGroup(id: string, patch: Partial<Omit<Grupo, "id">>): void {
  let changed = false;
  store.state = store.state.map((g) => {
    if (g.id !== id) return g;
    changed = true;
    return { ...g, ...patch };
  });
  if (!changed) return;
  emit();

  const dbPatch: Partial<GrupoRow> = {};
  if (patch.nome !== undefined) dbPatch.nome = patch.nome;
  if (patch.area !== undefined) dbPatch.area = patch.area;
  if (patch.congregacao !== undefined) dbPatch.congregacao = patch.congregacao;
  if (patch.campo !== undefined) dbPatch.campo = patch.campo;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.liderNome !== undefined) dbPatch.lider_nome = patch.liderNome ?? null;
  if (patch.liderEmail !== undefined) dbPatch.lider_email = patch.liderEmail ?? null;

  void supabase
    .from("grupos")
    .update(dbPatch)
    .eq("id", id)
    .then(({ error }: { error: unknown }) => {
      if (error) {
        console.error("[groupsData] falha ao atualizar grupo:", error);
        store.hydrated = false;
        void ensureGroupsHydrated();
      }
    });
}

/**
 * Atribui um líder a um Grupo Familiar. Regras:
 *   - Um grupo tem no máximo um líder.
 *   - Se o mesmo e-mail já liderava outro grupo, esse vínculo anterior é
 *     removido (um usuário só lidera um grupo por vez).
 *   - Passar `null` remove a liderança do grupo.
 * Retorna o id do grupo previamente liderado por este e-mail e o e-mail do
 * líder substituído no grupo alvo (compatibilidade com a UI).
 */
export async function setGroupLeader(
  groupId: string,
  lider: { id: string; nome: string; email: string } | null,
): Promise<{ previousGroupId?: string; replacedLeaderEmail?: string }> {
  const targetGroup = store.state.find((g) => g.id === groupId);

  if (!targetGroup) {
    throw new Error("Grupo Familiar não encontrado.");
  }

  const previousGroup = lider
    ? store.state.find(
        (g) =>
          g.liderEmail?.toLowerCase() === lider.email.toLowerCase() &&
          g.id !== groupId,
      )
    : undefined;

  const replacedLeaderEmail =
    targetGroup.liderEmail &&
    lider &&
    targetGroup.liderEmail.toLowerCase() !== lider.email.toLowerCase()
      ? targetGroup.liderEmail
      : undefined;

  console.log("[groupsData] transferência de líder:", {
    groupId,
    grupo: targetGroup.nome,
    novoLider: lider,
    previousGroupId: previousGroup?.id,
  });

  // ------------------------------------------------------------
  // A transferência inteira agora é feita no banco através da RPC.
  //
  // A RPC mantém sincronizados:
  //   - grupos
  //   - grupo_lideres
  //   - draft do relatório
  //
  // Relatórios já enviados/revisados NÃO são alterados.
  // ------------------------------------------------------------

  const { data, error } = await supabase.rpc(
    "transfer_group_leader",
    {
      p_group_id: groupId,
      p_new_leader_id: lider?.id ?? null,
    },
  );

  if (error) {
    console.error(
      "[groupsData] erro na transferência de líder:",
      error,
    );

    store.hydrated = false;
    await ensureGroupsHydrated();

    throw error;
  }

  console.log(
    "[groupsData] transferência concluída:",
    data,
  );

  // ------------------------------------------------------------
  // Atualiza o cache local somente depois do banco confirmar.
  // ------------------------------------------------------------

  store.state = store.state.map((g) => {
    // Se o novo líder estava em outro grupo,
    // esse grupo ficou sem líder.
    if (previousGroup && g.id === previousGroup.id) {
      return {
        ...g,
        leaderId: undefined,
        liderNome: undefined,
        liderEmail: undefined,
      };
    }

    // Grupo destino.
    if (g.id === groupId) {
      return {
        ...g,
        leaderId: lider?.id,
        liderNome: lider?.nome,
        liderEmail: lider?.email,
      };
    }

    return g;
  });

  emit();

  return {
    previousGroupId: previousGroup?.id,
    replacedLeaderEmail,
  };
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
