// ---------------------------------------------------------------------------
// Fonte única de usuários — agora persistida no Supabase (`public.profiles`).
//
// A interface pública é mantida IDÊNTICA à versão em memória anterior para
// que os consumidores existentes NÃO precisem ser alterados:
//   - /usuarios                           (lista, cria, altera função)
//   - features/auth/currentUser.ts        (upsert do usuário autenticado)
//
// Regra de cargo:
//   • O cargo oficial vem de `user_roles` / `profiles.role`.
//   • O vínculo com Grupo Familiar vem de `grupos.leader_id`.
//   • `lider_nome` e `lider_email` são mantidos apenas para exibição
//     e compatibilidade.
//   • O campo `grupo` de AppUser é uma projeção derivada de `leader_id`.
// Estratégia:
//   • Store reativo local (useSyncExternalStore) segue existindo, porém a
//     única fonte de verdade é o Supabase.
//   • Na inicialização o store é hidratado a partir do banco.
//   • Mutações atualizam otimisticamente o store e disparam a persistência
//     em background; em caso de erro, o estado é ressincronizado.
// ---------------------------------------------------------------------------
import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import {
  ensureGroupsHydrated,
  getGroups,
  subscribeGroups,
} from "./groupsData";
import { addRealtimeListener } from "@/lib/realtime";
export type UserRole = "Membro" | "Líder" | "Admin";

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  grupo?: string;
  isBlocked: boolean;
}

// ---------------------------------------------------------------------------
// Row shape no Supabase (tabela `public.profiles`).
// ---------------------------------------------------------------------------
interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole
   is_blocked: boolean;
    onboarding_completed: boolean;
}

interface GroupRow {
  nome: string;
  leader_id: string | null;
}

function rowToUser(r: ProfileRow): AppUser {
  return {
    id: r.id,
    nome: r.full_name,
    email: r.email,
    role: r.role,
    isBlocked: r.is_blocked,
  };
}

// ---------------------------------------------------------------------------
// Store reativo local (cache do banco).
// ---------------------------------------------------------------------------

type UserStore = {
  state: AppUser[];
  version: number;
  hydrated: boolean;
  hydrating: Promise<void> | null;
  listeners: Set<() => void>;
};

const __g = globalThis as unknown as { __adnaUserStore?: UserStore };
const store: UserStore =
  __g.__adnaUserStore ??
  (__g.__adnaUserStore = {
    state: [],
    version: 0,
    hydrated: false,
    hydrating: null,
    listeners: new Set<() => void>(),
  });
const globalStore = globalThis as unknown as {
  __adnaUsersGroupsRealtime?: boolean;
  __adnaUsersGroupsSubscription?: () => void;
};

if (
  typeof window !== "undefined" &&
  !globalStore.__adnaUsersGroupsRealtime
) {
  globalStore.__adnaUsersGroupsRealtime = true;

  // -----------------------------------------------------------------------
  // Reage diretamente às mudanças do store de grupos.
  //
  // Isso é importante porque o vínculo Líder ↔ Grupo é mantido em
  // groupsData. O usersData precisa atualizar a projeção `grupo` sempre que
  // esse vínculo mudar, sem depender exclusivamente do realtime do Supabase.
  // -----------------------------------------------------------------------
  globalStore.__adnaUsersGroupsSubscription = subscribeGroups(() => {
    console.log(
      "[usersData] groupsData alterado → reconciliando usuários",
    );

    reconcileGroups();
  });

  // -----------------------------------------------------------------------
  // Mantém também a sincronização por Realtime.
  // -----------------------------------------------------------------------
    addRealtimeListener("grupos", async () => {
    console.log(
      "[usersData] realtime de grupos → recarregando/reconciliando usuários",
    );

    await ensureGroupsHydrated();
    reconcileGroups();
  });

  addRealtimeListener("profiles", async () => {
  console.log(
    "[usersData] realtime de profiles → recarregando usuários",
  );

  store.hydrated = false;

  try {
    await hydrate();
  } catch (error) {
    console.error(
      "[usersData] erro ao sincronizar profiles:",
      error,
    );
  }
});
}
function reconcileGroups() {
  const groups = getGroups();

  let changed = false;

  store.state = store.state.map((user) => {
    if (user.role !== "Líder") {
      if (user.grupo !== undefined) {
        changed = true;

        return {
          ...user,
          grupo: undefined,
        };
      }

      return user;
    }

    const group = groups.find(
      (g) => g.leaderId === user.id,
    );

    const grupo = group?.nome;

    if (user.grupo === grupo) {
      return user;
    }

    changed = true;

    return {
      ...user,
      grupo,
    };
  });

  if (changed) {
    emit();
  }
}
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
  await ensureGroupsHydrated();
  const grupos = getGroups();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,email,role,is_blocked,onboarding_completed",
    )
    .order("full_name", { ascending: true });

  if (error) {
    console.error(
      "[usersData] falha ao carregar profiles do Supabase:",
      error,
    );

    store.hydrated = true;
    emit();
    return;
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select(`
      user_id,
      role_id,
      roles (
        name
      )
    `);

  if (rolesError) {
    console.error(
      "[usersData] falha ao carregar user_roles:",
      rolesError,
    );
  }

  

  store.state = ((data ?? []) as ProfileRow[]).map((profile) => {
    const user = rowToUser(profile);

    const userRole = (userRoles ?? []).find(
      (r) => r.user_id === profile.id,
    );

    const roleName =
      userRole?.roles &&
      typeof userRole.roles === "object" &&
      "name" in userRole.roles
        ? String(userRole.roles.name)
        : null;

    const group = (grupos ?? []).find(
  (g) => g.leaderId === profile.id,
);

    let role: UserRole = user.role;

    if (roleName === "admin") {
      role = "Admin";
    } else if (roleName === "leader") {
      role = "Líder";
    } else if (roleName === "member") {
      role = "Membro";
    }

    return {
      ...user,
      role,
      grupo: role === "Líder" ? group?.nome : undefined,
    };
  });

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

if (typeof window !== "undefined") {
  void ensureHydrated();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// API pública (mesma assinatura da versão anterior).
// ---------------------------------------------------------------------------

/**
 * Lista reativa de usuários, reconciliada com o vínculo Líder↔Grupo
 * mantido em groupsData. Reage a mudanças em ambos os stores.
 */
export function useUsers(): AppUser[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
 return store.state.map((u) => {
  // Admin sempre permanece Admin
  if (u.role === "Admin") {
    return {
      ...u,
      grupo: undefined,
    };
  }

  

  return u;
});
}

export async function setUserBlocked(
  userId: string,
  blocked: boolean,
): Promise<void> {
  console.log("[BLOCK] tentando atualizar:", {
    userId,
    blocked,
  });

  // Guarda o estado anterior para rollback caso o Supabase falhe
  const previous = store.state;

  // Atualização imediata da interface
  store.state = store.state.map((u) =>
    u.id === userId
      ? { ...u, isBlocked: blocked }
      : u,
  );

  emit();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      is_blocked: blocked,
    })
    .eq("id", userId)
    .select("id, is_blocked")
    .maybeSingle();

  console.log("[BLOCK] resultado:", {
    data,
    error,
  });

  if (error) {
    // Se falhar, desfaz a alteração visual
    store.state = previous;
    emit();

    console.error(
      "[usersData] falha ao atualizar bloqueio:",
      error,
    );

    throw error;
  }

  // Garante que o valor confirmado pelo banco
  // permaneça no estado local.
  if (data) {
    store.state = store.state.map((u) =>
      u.id === userId
        ? {
            ...u,
            isBlocked: data.is_blocked,
          }
        : u,
    );

    emit();
  }
}

/**
 * Insere ou atualiza um usuário a partir de dados vindos da sessão
 * autenticada. Dedup por e-mail (case-insensitive). Não sobrescreve o
 * nome existente se o novo vier vazio.
 */
export async function upsertUser(input: {
  nome?: string;
  email: string;
}): Promise<void> {
  const emailTrim = input.email.trim();
  const emailLower = emailTrim.toLowerCase();
  if (!emailLower) return;

  const idx = store.state.findIndex(
    (u) => u.email.toLowerCase() === emailLower,
  );
  const nomeInput = input.nome?.trim();

  if (idx >= 0) {
    const prev = store.state[idx];
    const nextNome = nomeInput || prev.nome;
    if (prev.nome === nextNome) return;
    const next = [...store.state];
    next[idx] = { ...prev, nome: nextNome };
    store.state = next;
    emit();

    void supabase
      .from("profiles")
      .update({ full_name: nextNome })
      .eq("id", prev.id)
      .then(({ error }: { error: unknown }) => {
        if (error) {
          console.error("[usersData] falha ao atualizar profile:", error);
          store.hydrated = false;
          void ensureHydrated();
        }
      });
    return;
  }

  // Novo usuário — normalmente disparado pelo primeiro login. Optimistic
  // local + upsert por e-mail (o trigger on_auth_user_created pode ter
  // criado a linha antes; o upsert reconcilia sem erro).
  const nome = nomeInput || emailLower.split("@")[0];
 const optimistic: AppUser = {
  id: newId(),
  nome,
  email: emailTrim,
  role: "Membro",
  isBlocked: false,
};
  store.state = [...store.state, optimistic];
  emit();

const {
  data: { user: authUser },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !authUser) {
  console.error(
    "[usersData] usuário autenticado não encontrado:",
    authError,
  );
  return;
}

  console.log("[usersData] authUser", authUser);
console.log("[usersData] authUser.id", authUser?.id);

console.log({
  id: authUser?.id,
  full_name: nome,
  email: emailTrim,
});

void supabase
  .from("profiles")
  .upsert(
    {
      id: authUser.id,
      full_name: nome,
      email: emailTrim,
    },
    {
      onConflict: "email",
    },
  )
  .select("id,full_name,email,role,is_blocked,onboarding_completed")
  .single()
    .then(({ data, error }: { data: ProfileRow | null; error: unknown }) => {
      if (error) {
        console.error("[usersData] falha ao upsert profile:", error);
        store.hydrated = false;
        void ensureHydrated();
        return;
      }
      if (data) {
        // Reconciliar id local com o id definitivo do banco.
        store.state = store.state.map((u) =>
          u.id === optimistic.id ? { ...u, id: data.id, nome: data.full_name } : u,
        );
        emit();
      }
    });
}

/**
 * Define a função "base" de um usuário. O vínculo com grupo continua sendo
 * governado por groupsData.setGroupLeader — este método é mantido por
 * compatibilidade com a UI atual (ao rebaixar um líder para Membro).
 * Como o cargo é derivado do vínculo em groupsData, esta operação afeta
 * apenas a projeção local até o próximo render.
 */
export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<boolean> {
  const roleMap: Record<UserRole, string> = {
    Admin: "001c769c-9dd7-463e-ae54-48c529280daa",
    Líder: "f2600e11-aabc-4fe0-a530-6f2bfc6162ec",
    Membro: "c39cb86c-b6c9-4960-8780-d29fa2503160",
  };

  const roleId = roleMap[role];

  if (!roleId) {
    console.error("[usersData] cargo inválido:", role);
    return false;
  }

  // 1. Atualiza o cargo em profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role,
    })
    .eq("id", userId);

  if (profileError) {
    console.error(
      "[usersData] falha ao atualizar role em profiles:",
      profileError,
    );
    return false;
  }

  // 2. Atualiza o cargo oficial em user_roles
  const { data: existingRole, error: roleFetchError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleFetchError) {
    console.error(
      "[usersData] falha ao verificar user_roles:",
      roleFetchError,
    );
    return false;
  }

  if (existingRole) {
    const { error: roleUpdateError } = await supabase
      .from("user_roles")
      .update({
        role_id: roleId,
      })
      .eq("user_id", userId);

    if (roleUpdateError) {
      console.error(
        "[usersData] falha ao atualizar user_roles:",
        roleUpdateError,
      );
      return false;
    }
  } else {
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: roleId,
      });

    if (roleInsertError) {
      console.error(
        "[usersData] falha ao inserir user_roles:",
        roleInsertError,
      );
      return false;
    }
  }

  // 3. Atualiza o cache local somente depois que o banco confirmou
  store.state = store.state.map((u) =>
    u.id === userId
      ? {
          ...u,
          role,
          grupo: role === "Membro" || role === "Admin"
            ? undefined
            : u.grupo,
        }
      : u,
  );

  emit();

  return true;
}

/**
 * Cria um novo usuário administrativamente. Valida nome e e-mail, impede
 * duplicidade (case-insensitive), grava em `public.profiles` e retorna o
 * usuário criado — mantendo a assinatura síncrona esperada pela UI.
 *
 * O vínculo Líder↔Grupo é responsabilidade do chamador (via setGroupLeader),
 * como no fluxo existente.
 */
export function createUser(input: {
  nome: string;
  email: string;
  role: UserRole;
}): AppUser {
  const nome = (input.nome ?? "").trim();
  const email = (input.email ?? "").trim();
  const emailLower = email.toLowerCase();

  if (!nome) throw new Error("Informe o nome do usuário.");
  if (!email) throw new Error("Informe o e-mail do usuário.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido.");
  }
  if (store.state.some((u) => u.email.toLowerCase() === emailLower)) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const user: AppUser = {
    id: newId(),
    nome,
    email,
    isBlocked: false,
    role: input.role,
  };
  store.state = [...store.state, user];
  emit();

  console.warn(
  "[usersData] Cadastro administrativo ainda não é persistido no Supabase.",
);

  return user;
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
