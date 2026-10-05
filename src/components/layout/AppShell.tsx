import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { SideDrawer } from "./SideDrawer";
import { AppShellProvider } from "./AppShellContext";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppShellProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1">{children}</div>
        <BottomNav />
        <SideDrawer />
      </div>
    </AppShellProvider>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      {children}
    </div>
  );
}