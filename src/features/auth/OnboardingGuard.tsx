import { Navigate, Outlet } from "@tanstack/react-router";
import { useCurrentUser } from "./currentUser";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function OnboardingGuard() {
  const user = useCurrentUser();
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      if (!user.email) return;

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("email", user.email)
        .single();

      if (data) {
        setCompleted(data.onboarding_completed);
      }
    }

    check();
  }, [user.email]);

  if (completed === null) {
    return null;
  }

  if (!completed) {
    return <Navigate to="/bem-vindo" />;
  }

  return <Outlet />;
}