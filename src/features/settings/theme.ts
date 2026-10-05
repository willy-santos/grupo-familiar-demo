export type Theme = "system" | "light" | "dark";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");

  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }

  if (theme === "light") {
    root.classList.add("light");
    return;
  }

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  if (prefersDark) {
    root.classList.add("dark");
  }
}

export function watchSystemTheme(
  theme: Theme,
  onChange?: () => void,
) {
  if (theme !== "system") return () => {};

  const media = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  const handler = () => {
    applyTheme("system");
    onChange?.();
  };

  media.addEventListener("change", handler);

  return () => {
    media.removeEventListener("change", handler);
  };
}