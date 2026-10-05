import { Link } from "@tanstack/react-router";
import { signOut } from "@/features/auth/service";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCurrentUser } from "@/features/auth/currentUser";
import { drawerNav } from "@/lib/nav";
import { useAppShell } from "./AppShellContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { LogOut, ChevronRight } from "lucide-react";


export function SideDrawer() {
  const { drawerOpen, closeDrawer } = useAppShell();
  const navigate = useNavigate();
  const realUser = useCurrentUser();
  const { profile } = useAuth();
  
  const isAdmin = realUser.role === "admin";

  
  const displayUser = realUser;
  const roleLabel =
  displayUser.role === "admin"
    ? "Administrador"
    : displayUser.role === "lider"
      ? "Líder"
      : "Membro";
  const initials =
    (displayUser.nome || "AD")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "AD";
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;

  async function loadAvatar() {
    if (!profile?.avatar_url) {
      setAvatarUrl(null);
      return;
    }

    const { data, error } = await supabase.storage
      .from("photos")
      .createSignedUrl(profile.avatar_url, 60 * 60);

    if (error) {
      console.error(
        "[SideDrawer] Erro ao carregar avatar:",
        error,
      );

      setAvatarUrl(null);
      return;
    }

    if (!cancelled) {
      setAvatarUrl(data.signedUrl);
    }
  }

  loadAvatar();

  return () => {
    cancelled = true;
  };
}, [profile?.avatar_url]);

 
  
  

  async function handleLogout() {
  try {
    await signOut();
    closeDrawer();
    navigate({ to: "/login" });
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}


  // Itens administrativos ficam visíveis apenas para administradores.
  const shouldHideAdminItems = !isAdmin;

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
          />
          <motion.aside
            key="drawer"
            className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-primary text-primary-foreground"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-10">
              <div className="flex h-24 w-full items-center justify-center">
  <img
    src="/logo-adna-transparente.png"
    alt="Assembleia de Deus Nova Ananindeua"
    className="h-full max-w-[280px] object-contain"
  />
</div>
              <p className="text-lg font-bold tracking-wide">AD NOVA ANANINDEUA</p>
             
            </div>

            <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <div className="grid h-11 w-11 overflow-hidden place-items-center rounded-full bg-white/20 text-sm font-bold">
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt={`Foto de ${displayUser.nome}`}
      className="h-full w-full object-cover"
    />
  ) : (
    initials
  )}
</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{displayUser.nome}</p>
                <p className="truncate text-xs text-white/70">
                  {displayUser.email || roleLabel}
                </p>
                {displayUser.role === "lider" && displayUser.grupo && (
                  <p className="truncate text-[11px] text-white/60">
                    {displayUser.grupo}
                  </p>
                )}
              </div>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase">
                {roleLabel}
              </span>
            </div>

          
              
            <nav className="flex-1 overflow-y-auto px-2 pb-6">
              <ul className="space-y-1">
                {drawerNav.map((item) => {
                  const Icon = item.icon;
                  if ("adminOnly" in item && item.adminOnly && shouldHideAdminItems)
                    return null;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={closeDrawer}
                        className="flex items-center gap-4 rounded-lg px-4 py-3 text-[15px] font-bold uppercase tracking-wide transition hover:bg-white/10"
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="h-4 w-4 opacity-70" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 border-t border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-wide transition hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" /> Sair
            </button>
          </motion.aside>

        </>
      )}
    </AnimatePresence>
  );
}
