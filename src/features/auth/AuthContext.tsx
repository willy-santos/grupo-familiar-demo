import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

type UserRole = "admin" | "leader" | "member";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
blocked: boolean;

  profile: {
  full_name: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  onboarding_completed: boolean;
} | null;

  role: UserRole | null;

  grupoId: string | null;
  grupoNome: string | null;
  congregacao: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  blocked: false,
  profile: null,

  role: null,

  grupoId: null,
  grupoNome: null,
  congregacao: null,
});

export function useAuth() {
  return useContext(AuthContext);
}