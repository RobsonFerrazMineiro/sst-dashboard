"use client";

import { ClipboardList, LayoutDashboard, Shield, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/tipos-treinamento",
    label: "Tipos de Treinamento",
    icon: ClipboardList,
  },
  { href: "/tipos-aso", label: "Tipos de ASO", icon: Tags },
];

export default function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-full w-72 border-r border-slate-200 bg-white",
        className,
      )}
    >
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-200">
        <div className="p-2 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-slate-900">Gestão SST</p>
          <p className="text-xs text-slate-500">ASOs & Treinamentos</p>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                "hover:bg-slate-50",
                isActive
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-indigo-600" : "text-slate-400",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-xs text-slate-400">
        <p>v0.1 • Micro-SaaS</p>
      </div>
    </aside>
  );
}
