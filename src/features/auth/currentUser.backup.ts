// ---------------------------------------------------------------------------
// Contexto do usuário logado.
//
// Regras:
//   1. `useCurrentUser()` retorna SEMPRE o usuário autenticado real
//      (derivado da sessão + vínculo Líder→Grupo no store oficial).
//      Nunca é alterado por overrides / modos de visualização.
//
//   2. "Ver como Líder" é um modo de visualização exclusivo do Admin:
//      não altera identidade, não altera permissões, não persiste após
//      logout. Vive num store em memória + sessionStorage (por aba).
//      Consumido via `useViewAsLider()` e `useEffectiveUser()`.
//
// Os antigos overrides `adna_dev_role` / `adna_dev_grupo` foram removidos.
// ---------------------------------------------------------------------------

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { addRealtimeListener } from "@/lib/realtime";
import {
  CAMPO_ADNA as GROUP_CAMPO_ADNA,
  getGrupoHierarquia as getGrupoHierarquiaFromStore,
  getGroupByName,
  getGroupForLeaderEmail,
  useGroups,
} from "@/lib/groupsData";
import { upsertUser } from "@/lib/usersData";

export type AppRole = "admin" | "lider" | "membro";
export interface CurrentUser {
  role: AppRole;
  nome: string;
  email: string;

  grupo?: string;
  grupoId?: string;

  campo?: string;
  area?: string;
  congregacao?: string;
}

// Reexport para preservar imports existentes.
export const CAMPO_ADNA = GROUP_CAMPO_ADNA;

export function getGrupoHierarquia(
  grupo: string | undefined,
): { campo: string; area: string; congregacao: string } {
  return getGrupoHierarquiaFromStore(grupo);
}

// Aliases de credenciais de teste que não correspondem a um líder real.
const DEV_LIDER_ALIASES: Record<string, string> = {
  "lider@adnova.com": "marcos@adnova.com",
};

// ---------------------------------------------------------------------------
// Store do modo "Ver como Líder" (visualização, não identidade)
// ---------------------------------------------------------------------------

const VIEW_AS_KEY = "adna_view_as_grupo";

type ViewAsStore = {
  grupoNome: string | null;
  listeners: Set<() => void>;
};

const __g = globalThis as unknown as { __adnaViewAsStore?: ViewAsStore };
const viewStore: ViewAsStore =
  __g.__adnaViewAsStore ??
  (__g.__adnaViewAsStore = {
    grupoNome:
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(VIEW_AS_KEY)
        : null,
    listeners: new Set<() => void>(),
  });

function emitViewAs() {
  viewStore.listeners.forEach((l) => l());
}

function subscribeViewAs(cb: () => void) {
  viewStore.listeners.add(cb);
  return () => {
    viewStore.listeners.delete(cb);
  };
}

function getViewAsSnapshot() {
  return viewStore.grupoNome;
}

function getViewAsServerSnapshot() {
  return null as string | null;
}

/**
 * Ativa o modo "Ver como Líder" para o grupo informado.
 * Silenciosamente ignorado se o chamador não for admin.
 */
export function setViewAsLider(grupoNome: string, isAdmin: boolean) {
  if (!isAdmin) return;
  const grupo = getGroupByName(grupoNome);
  if (!grupo) return;
  viewStore.grupoNome = grupo.nome;
  try {
    window.sessionStorage.setItem(VIEW_AS_KEY, grupo.nome);
  } catch {
    /* noop */
  }
  emitViewAs();
}

/** Sai do modo de visualização. */
export function clearViewAsLider() {
  viewStore.grupoNome = null;
  try {
    window.sessionStorage.removeItem(VIEW_AS_KEY);
  } catch {
    /* noop */
  }
  emitViewAs();
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCurrentUser(): CurrentUser {
  const { session } = useAuth();

  // Assina o store oficial de grupos.
  useGroups();

  const [profileRole, setProfileRole] = useState<
    "Admin" | "Líder" | "Membro"
  >("Membro");

  const [profileName, setProfileName] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const rawEmail = (session?.user?.email ?? "").toLowerCase();
  const email = DEV_LIDER_ALIASES[rawEmail] ?? rawEmail;

  useEffect(() => {
    console.log("[currentUser EFFECT ENTROU]", {
  email,
  profileRole,
});
  console.log("[currentUser EFFECT]", {
    email,
    profileRole,
  });

  const loadProfile = async () => {
    if (!email) {
      console.log("[currentUser] sem email, não registra realtime");
      return;
    }
const { data: authTest, error: authTestError } =
  await supabase.auth.getUser();

console.log("[TESTE AUTH REAL]", {
  authId: authTest.user?.id,
  authEmail: authTest.user?.email,
  error: authTestError,
});

const { data: groupTest, error: groupTestError } =
  await supabase.rpc("is_user_in_group", {
    group_uuid: "a17564e6-670a-45e3-a9ee-6187bc51b024",
  });

console.log("[TESTE VINCULO REAL]", {
  data: groupTest,
  error: groupTestError,
});
      // ------------------------------------------------------------
      // 1. Busca o profile pelo e-mail
      // ------------------------------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, is_blocked, onboarding_completed")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        console.error(
          "[currentUser] erro ao carregar profile:",
          profileError,
        );
        return;
      }

      // ------------------------------------------------------------
      // 2. Busca o cargo oficial em user_roles → roles
      // ------------------------------------------------------------
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            name
          )
        `)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (roleError) {
        console.error(
          "[currentUser] erro ao carregar user_roles:",
          roleError,
        );
      }

      const roleName =
        userRole?.roles &&
        typeof userRole.roles === "object" &&
        "name" in userRole.roles
          ? String(userRole.roles.name)
          : null;

      // ------------------------------------------------------------
      // 3. Dados básicos do profile
      // ------------------------------------------------------------
      setProfileName(profile.full_name);
      setIsBlocked(profile.is_blocked);
      setOnboardingCompleted(profile.onboarding_completed);

      // ------------------------------------------------------------
      // 4. Converte o cargo do banco para o AppRole da aplicação
      // ------------------------------------------------------------
      if (roleName === "admin") {
        setProfileRole("Admin");
      } else if (roleName === "leader") {
        setProfileRole("Líder");
      } else {
        setProfileRole("Membro");
      }
    };

    void loadProfile();

console.log("[currentUser] REGISTRANDO REALTIME", {
  email,
  profileRole,
});

const unsubscribeProfiles = addRealtimeListener(
  "profiles",
  loadProfile,
);

const unsubscribeUserRoles = addRealtimeListener(
  "user_roles",
  loadProfile,
);

const unsubscribeGrupos = addRealtimeListener(
  "grupos",
  loadProfile,
);

console.log("[currentUser realtime] listeners registrados:", {
  profiles: true,
  user_roles: true,
  grupos: true,
});

return () => {
  unsubscribeProfiles();
  unsubscribeUserRoles();
  unsubscribeGrupos();
};
  }, [email]);

  // ------------------------------------------------------------
  // Bloqueio
  // ------------------------------------------------------------
  useEffect(() => {
    if (!email || !isBlocked) return;

    async function logoutBlockedUser() {
      await supabase.auth.signOut();

      alert("Sua conta foi bloqueada pelo administrador.");
    }

    void logoutBlockedUser();
  }, [email, isBlocked]);

  // ------------------------------------------------------------
  // Nome fallback da sessão
  // ------------------------------------------------------------
  const metaName =
    (session?.user?.user_metadata?.name as string | undefined) ||
    (session?.user?.user_metadata?.full_name as string | undefined) ||
    rawEmail.split("@")[0] ||
    "Usuário";

  // Garante presença na Gestão de Usuários.
  useEffect(() => {
    if (email) {
      void upsertUser({
        nome: metaName,
        email,
      });
    }
  }, [email, metaName]);

  // ------------------------------------------------------------
  // Grupo vinculado ao líder
  // ------------------------------------------------------------
  const grupoDoLider = getGroupForLeaderEmail(email);

  // ------------------------------------------------------------
  // ADMIN
  // ------------------------------------------------------------
 console.log("[currentUser]", {
  email,
  profileRole,
  grupoDoLider,
});
  if (profileRole === "Admin") {
    return {
      role: "admin",
      nome: profileName || metaName,
      email,
    };
  }

  // ------------------------------------------------------------
  // LÍDER
  // ------------------------------------------------------------
  if (profileRole === "Líder" && grupoDoLider) {
  return {
    role: "lider",
    nome: grupoDoLider.liderNome ?? profileName ?? metaName,
    email,
    grupo: grupoDoLider.nome,
    grupoId: grupoDoLider.id,
    ...getGrupoHierarquia(grupoDoLider.nome),
  };
}

  // ------------------------------------------------------------
  // MEMBRO
  // ------------------------------------------------------------
  return {
    role: "membro",
    nome: profileName || metaName,
    email,
  };
}

/**
 * Retorna o estado atual do modo "Ver como Líder".
 * Só é considerado ativo quando o usuário real é admin.
 */
export function useViewAsLider(): {
  active: boolean;
  grupoNome: string | null;
  viewedUser: CurrentUser | null;
} {
  const real = useCurrentUser();
  const grupoNome = useSyncExternalStore(
    subscribeViewAs,
    getViewAsSnapshot,
    getViewAsServerSnapshot,
  );
  useGroups(); // re-render se o grupo/líder mudar no store oficial

  const isAdmin = real.role === "admin";
  const active = Boolean(isAdmin && grupoNome);

  // Auto-limpeza: se o usuário real deixar de ser admin, cancela a view.
  useEffect(() => {
    if (!isAdmin && grupoNome) clearViewAsLider();
  }, [isAdmin, grupoNome]);

  if (!active || !grupoNome) {
    return { active: false, grupoNome: null, viewedUser: null };
  }

  const grupo = getGroupByName(grupoNome);
  if (!grupo) {
    return { active: false, grupoNome: null, viewedUser: null };
  }

  const viewedUser: CurrentUser = {
  role: "lider",
  nome: grupo.liderNome ?? "Sem líder atribuído",
  email: grupo.liderEmail ?? "",
  grupo: grupo.nome,
  grupoId: grupo.id,
  ...getGrupoHierarquia(grupo.nome),
};
  return { active: true, grupoNome, viewedUser };
}

/**
 * Usuário "efetivo" para fins de VISUALIZAÇÃO apenas.
 * - Se o admin estiver em modo "Ver como Líder", devolve o líder simulado.
 * - Caso contrário, devolve o usuário real.
 *
 * IMPORTANTE: NÃO use isto para checar permissões — permissões devem sempre
 * consultar `useCurrentUser()` (identidade real). Use `useEffectiveUser()`
 * apenas para renderizar a experiência do líder (contexto de grupo, filtros
 * de histórico, banners etc.).
 */
export function useEffectiveUser(): {
  user: CurrentUser;
  realUser: CurrentUser;
  isViewingAs: boolean;
} {
  const real = useCurrentUser();
  const { active, viewedUser } = useViewAsLider();
  if (active && viewedUser) {
    return { user: viewedUser, realUser: real, isViewingAs: true };
  }
  return { user: real, realUser: real, isViewingAs: false };
}

// Lista dos caminhos que só o administrador pode acessar.
export const ADMIN_ONLY_PATHS: readonly string[] = ["/usuarios"];

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
