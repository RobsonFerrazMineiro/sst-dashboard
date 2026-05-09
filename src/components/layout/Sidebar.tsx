"use client";

import {
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Tags,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuthPermissions } from "@/lib/permissions-client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  /** Mostra apenas se o usuário TEM este papel */
  role?: string;
  /** Oculta se o usuário TEM este papel */
  excludeRole?: string;
};

const navItems: NavItem[] = [
  {
    href: "/meu-perfil",
    label: "Meu Perfil",
    icon: UserCircle,
    permission: "colaborador.visualizar-proprio",
    excludeRole: "ADMIN",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.visualizar",
  },
  {
    // Colaboradores aparece para GESTOR (visualizar) e TECNICO_SST (gerenciar)
    href: "/colaboradores",
    label: "Colaboradores",
    icon: Users,
    permission: "colaboradores.visualizar",
  },
  {
    // Tipos de Treinamento: somente quem gerencia (ADMIN)
    href: "/tipos-treinamento",
    label: "Tipos de Treinamento",
    icon: ClipboardList,
    permission: "tipos-treinamento.gerenciar",
  },
  {
    // Tipos de ASO: somente quem gerencia (ADMIN)
    href: "/tipos-aso",
    label: "Tipos de ASO",
    icon: Tags,
    permission: "tipos-aso.gerenciar",
  },
  {
    href: "/acessos",
    label: "Acessos",
    icon: KeyRound,
    permission: "dashboard.visualizar",
    role: "ADMIN",
  },
];

export default function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const { hasPermission, hasRole } = useAuthPermissions();

  const visibleNavItems = navItems.filter((item) => {
    if (item.role && !hasRole(item.role)) return false;
    if (item.excludeRole && hasRole(item.excludeRole)) return false;
    return hasPermission(item.permission);
  });

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Falha ao sair do sistema");
      }

      // Limpa TODO o cache do TanStack Query para que o próximo usuário
      // não herde dados/permissões da sessão anterior.
      queryClient.clear();

      onNavigate?.();
      // Usa reload completo em vez de navegação client-side para desmontar
      // todos os componentes imediatamente e evitar refetch de /api/auth/me
      // com cookie já removido (que geraria 401 no console).
      window.location.href = "/login";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao sair");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-slate-200 bg-white md:w-56",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="rounded-xl bg-linear-to-br from-teal-800 via-teal-300 to-lime-200 p-1 shadow-md shadow-emerald-200">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-slate-900">Gestão SST</p>
          <p className="text-xs text-slate-500">ASOs & Treinamentos</p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="space-y-1 p-3">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                "hover:bg-slate-50",
                isActive
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600",
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-emerald-700" : "text-slate-400",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-3">
        <Button
          type="button"
          variant="ghost"
          disabled={loggingOut}
          onClick={handleLogout}
          aria-label={loggingOut ? "Saindo do sistema" : "Sair do sistema"}
          className="mb-3 flex w-full items-center justify-start gap-3 rounded-xl px-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <LogOut aria-hidden="true" className="h-4 w-4 text-slate-400" />
          {loggingOut ? "Saindo..." : "Sair"}
        </Button>

        <div className="px-1 text-xs text-slate-400">
          <p>v0.1 • Micro-SaaS</p>
        </div>
      </div>
    </aside>
  );
}
