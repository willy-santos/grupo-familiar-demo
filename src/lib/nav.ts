import {
  Users,
  LayoutGrid,
  GraduationCap,
  Calendar,
  Camera,
  BarChart3,
  Settings,
  Home,
  Bell,
  Menu,
  User,
  UserCog,
  ClipboardList,
} from "lucide-react";

export const drawerNav = [
  { to: "/", label: "Início", icon: Home },
  { to: "/grupos", label: "Grupos Familiares", icon: LayoutGrid },
  { to: "/usuarios", label: "Usuários", icon: UserCog, adminOnly: true },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardList },
  { to: "/graficos", label: "Gráficos", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export const bottomNav = [
  { to: "__drawer__", label: "Menu", icon: Menu },
  { to: "/", label: "Início", icon: Home },
  { to: "/notificacoes", label: "Alertas", icon: Bell },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;
