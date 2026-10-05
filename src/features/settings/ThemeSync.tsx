import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getUserPreferences,
  type UserPreferences,
} from "./userPreferences";
import { applyTheme, watchSystemTheme } from "./theme";

export function ThemeSync() {
  const { user } = useAuth();

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      applyTheme("system");
      return;
    }

    let cancelled = false;
    let stopWatching = () => {};

    async function loadTheme() {
      if (!userId) return;

      try {
        const preferences = await getUserPreferences(userId);

        if (cancelled) return;

        const theme: UserPreferences["theme"] =
          preferences.theme;

        applyTheme(theme);

        stopWatching = watchSystemTheme(theme);
      } catch (error) {
        console.error(
          "[Theme] Erro ao carregar preferência:",
          error,
        );

        if (!cancelled) {
          applyTheme("system");
        }
      }
    }

    loadTheme();

    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [user?.id]);

  return null;
}