import { createContext, useContext, useState, type ReactNode } from "react";

interface AppShellCtx {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const Ctx = createContext<AppShellCtx | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <Ctx.Provider
      value={{
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppShell() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppShell must be used inside AppShellProvider");
  return c;
}
