import {
  useLocation,
  Navigate,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth();
  const location = useLocation();

  const [checkingOnboarding, setCheckingOnboarding] =
    useState(true);

  const [completed, setCompleted] = useState<boolean | null>(null);

  // -----------------------------
  // VERIFICAR ONBOARDING
  // -----------------------------

  useEffect(() => {
    async function checkOnboarding() {
      // Sem sessão
      if (!session?.user?.id) {
        setCompleted(null);
        setCheckingOnboarding(false);
        return;
      }

      setCheckingOnboarding(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error(
          "[ProtectedRoute] Erro ao verificar onboarding:",
          error,
        );

        setCompleted(true);
      } else {
        setCompleted(data?.onboarding_completed ?? false);
      }

      setCheckingOnboarding(false);
    }

    checkOnboarding();
  }, [session]);

  // -----------------------------
  // CARREGANDO
  // -----------------------------

  if (loading || checkingOnboarding) {
    return <>Carregando...</>;
  }

  // -----------------------------
  // SEM SESSÃO
  // -----------------------------

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // -----------------------------
  // USUÁRIO NOVO
  // -----------------------------

  if (completed === false) {
    // Usuário novo só pode acessar /bem-vindo
    if (location.pathname !== "/bem-vindo") {
      return <Navigate to="/bem-vindo" replace />;
    }

    return <>{children}</>;
  }

  // -----------------------------
  // USUÁRIO JÁ CADASTRADO
  // -----------------------------

  if (
    completed === true &&
    location.pathname === "/bem-vindo"
  ) {
    return <Navigate to="/" replace />;
  }

  // -----------------------------
  // ACESSO NORMAL
  // -----------------------------

  return <>{children}</>;
}