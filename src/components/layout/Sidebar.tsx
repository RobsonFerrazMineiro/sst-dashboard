"use client";

import {
  ClipboardCheck,
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
  {
    href: "/solicitacoes",
    label: "Solicitações",
    icon: ClipboardCheck,
    permission: "dashboard.visualizar",
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
  const { hasPermission, hasRole, user, roles, ...query } =
    useAuthPermissions();

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

      <div className="mt-auto border-t border-slate-200 p-3 space-y-2">
        {/* ── Card do usuário logado ──────────────────────────────────── */}
        {query.isLoading ? (
          /* Skeleton enquanto carrega */
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 animate-pulse">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-3/4 rounded bg-slate-200" />
              <div className="h-2 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            {/* Avatar com inicial */}
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-700 to-emerald-400 text-sm font-bold text-white shadow-sm"
            >
              {user.nome.charAt(0).toUpperCase()}
            </div>
            {/* Dados textuais */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-slate-800">
                {user.nome}
              </p>
              <p className="truncate text-xs leading-tight text-slate-400">
                {roles.length > 0
                  ? roles
                      .map((r) =>
                        r === "TECNICO_SST"
                          ? "Técnico SST"
                          : r.charAt(0) + r.slice(1).toLowerCase(),
                      )
                      .join(" · ")
                  : "—"}
              </p>
              {user.empresaNome && (
                <p className="truncate text-xs leading-tight text-slate-400">
                  {user.empresaNome}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Botão de logout ────────────────────────────────────────── */}
        <Button
          type="button"
          variant="ghost"
          disabled={loggingOut}
          onClick={handleLogout}
          aria-label={loggingOut ? "Saindo do sistema" : "Sair do sistema"}
          className="flex w-full items-center justify-start gap-3 rounded-xl px-3 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {loggingOut ? "Saindo..." : "Sair"}
        </Button>

        <div className="px-1 text-xs text-slate-400">
          <p>v0.1 • Micro-SaaS</p>
        </div>
      </div>
    </aside>
  );
}
