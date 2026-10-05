import {
  useEffect,
  useState,
  useContext,
  type ReactNode,
} from "react";
import { AuthContext } from "./AuthContext";
import { addRealtimeListener } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type UserRole = "admin" | "leader" | "member";

type AuthProfile = {
  full_name: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  onboarding_completed: boolean;
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
const [congregacao, setCongregacao] =
  useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const [role, setRole] = useState<UserRole | null>(null);
  const [grupoId, setGrupoId] = useState<string | null>(null);
const [grupoNome, setGrupoNome] = useState<string | null>(null);
  useEffect(() => {
    async function loadUserData(userId: string) {
      // ---------------------------------------------------------
      // Perfil
      // ---------------------------------------------------------

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
  "full_name, avatar_url, is_blocked, onboarding_completed",
)
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error(
          "[Auth] Erro ao buscar perfil:",
          profileError,
        );
      }

      setProfile(profileData);
      setBlocked(false);
      // ---------------------------------------------------------
// Usuário bloqueado
// ---------------------------------------------------------

if (profileData?.is_blocked) {
  console.warn("[AUTH] Usuário bloqueado. Encerrando sessão.");

  setBlocked(true);

  await supabase.auth.signOut();

  setSession(null);
  setProfile(null);
  setRole(null);
  setGrupoId(null);
  setGrupoNome(null);
  setCongregacao(null);

  return;
}
      // ---------------------------------------------------------
      // Cargo
      // ---------------------------------------------------------

      const {
        data: roleData,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            name
          )
        `)
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error(
          "[Auth] Erro ao buscar cargo:",
          roleError,
        );

        setRole(null);
        setGrupoId(null);

        return;
      }

      const rolesData = roleData?.roles;

      let roleName: UserRole | null = null;

      if (Array.isArray(rolesData)) {
        const name = rolesData[0]?.name;

        if (
          name === "admin" ||
          name === "leader" ||
          name === "member"
        ) {
          roleName = name;
        }
      } else if (
        rolesData &&
        typeof rolesData === "object"
      ) {
        const name = (rolesData as { name?: unknown }).name;

        if (
          name === "admin" ||
          name === "leader" ||
          name === "member"
        ) {
          roleName = name;
        }
      }

      setRole(roleName);

      // ---------------------------------------------------------
      // Grupo do líder
      // ---------------------------------------------------------

      if (roleName === "leader") {
        const {
          data: grupoData,
          error: grupoError,
        } = await supabase
          .from("grupos")
.select("id, nome, congregacao")
.eq("leader_id", userId)
.maybeSingle();

        if (grupoError) {
  console.error(
    "[Auth] Erro ao buscar grupo do líder:",
    grupoError,
  );

  setGrupoId(null);
  setGrupoNome(null);
  setCongregacao(null);
} else {
  setGrupoId(grupoData?.id ?? null);
  setGrupoNome(grupoData?.nome ?? null);
  setCongregacao(grupoData?.congregacao ?? null);
}
      } else {
  setGrupoId(null);
  setGrupoNome(null);
  setCongregacao(null);
}
    }

    async function loadSession() {
  const { data, error } = await supabase.auth.getSession();

  console.log("[AUTH DEBUG] getSession:", {
    session: data.session,
    error,
    userId: data.session?.user?.id,
  });

  setSession(data.session);

  if (data.session?.user) {
    await loadUserData(data.session.user.id);
  } else {
   setProfile(null);
setRole(null);
setGrupoId(null);
setGrupoNome(null);
setCongregacao(null);
  }

  setLoading(false);
}
const unsubscribeProfiles = addRealtimeListener(
  "profiles",
  async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session?.user?.id) return;

    console.log(
      "[Auth Realtime] profiles → recarregando usuário",
    );

    await loadUserData(data.session.user.id);
  },
);

const unsubscribeUserRoles = addRealtimeListener(
  "user_roles",
  async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session?.user?.id) return;

    console.log(
      "[Auth Realtime] user_roles → recarregando usuário",
    );

    await loadUserData(data.session.user.id);
  },
);

console.log("[Auth Realtime] listeners registrados:", {
  profiles: true,
  user_roles: true,
});


    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        setSession(session);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
  setProfile(null);
  setRole(null);
  setGrupoId(null);
  setGrupoNome(null);
  setCongregacao(null);
}

        setLoading(false);
      },
    );

    return () => {
  unsubscribeProfiles();
  unsubscribeUserRoles();
  subscription.unsubscribe();
};
  }, []);

  return (
    <AuthContext.Provider
     value={{
  session,
  user: session?.user ?? null,
  loading,
  blocked,
  profile,
  role,
  grupoId,
  grupoNome,
  congregacao,
}}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}