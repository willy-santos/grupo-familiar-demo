import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { motion } from "motion/react";
import {
  Heart,
  FileText,
  ClipboardList,
  BarChart3,
  Menu,
} from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { useAppShell } from "@/components/layout/AppShellContext";


const banner = "/logo1.png";

const grid = [
  { to: "/licoes", label: "Lições", icon: FileText },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardList },
  { to: "/graficos", label: "Gráficos", icon: BarChart3 },
  { to: "/oferta", label: "Contribuições", icon: Heart },
];



function HomePage() {
  const { openDrawer } = useAppShell();
  return (
    
    <div>
      {/* Top mini bar with menu (mobile-first, no back button) */}
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between bg-primary px-4 text-primary-foreground">
        <button
          type="button"
          onClick={openDrawer}
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold uppercase tracking-widest">AD Nova Ananindeua</p>
        <div className="h-9 w-9" />
      </div>

      <PageContainer>
        {/* Hero carousel */}
        <motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative overflow-hidden rounded-2xl shadow-elevated bg-card"
>
  <img
    src="/logo1.png"
    alt="ADNA Grupo Familiar"
    className="w-full h-auto object-contain"
  />
</motion.div>

        

        {/* Feature grid */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {grid.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>

      </PageContainer>
    </div>
    
  );
}

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});