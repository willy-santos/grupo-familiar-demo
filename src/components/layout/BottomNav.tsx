import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "./AppShellContext";

const items = [
  { key: "menu", label: "Menu", icon: Menu, action: "drawer" as const },
  { key: "home", label: "Início", icon: Home, to: "/" },
  { key: "alerts", label: "Alertas", icon: Bell, to: "/notificacoes" },
  { key: "profile", label: "Perfil", icon: User, to: "/perfil" },
];

export function BottomNav() {
  const { openDrawer } = useAppShell();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-border bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-16 max-w-3xl items-stretch justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.to && (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to));
          const isProfile = item.key === "profile";
          const content = (
            <div className="flex h-full flex-col items-center justify-center gap-0.5">
              {isProfile ? (
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary",
                    active && "ring-2 ring-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              ) : (
                <Icon
                  className={cn(
                    "h-6 w-6 transition",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </div>
          );
          if (item.action === "drawer") {
            return (
              <li key={item.key} className="flex-1">
                <button
                  type="button"
                  onClick={openDrawer}
                  className="h-full w-full"
                  aria-label={item.label}
                >
                  {content}
                </button>
              </li>
            );
          }
          return (
            <li key={item.key} className="flex-1">
              <Link to={item.to!} className="block h-full w-full">
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
