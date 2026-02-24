"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "default";

type StatCardProps = {
  title: string;
  count: number;
  percentage: number;
  icon: LucideIcon;
  variant?: Variant;
  onClick?: () => void;
  isActive?: boolean;
};

export default function StatCard({
  title,
  count,
  percentage,
  icon: Icon,
  variant = "default",
  onClick,
  isActive,
}: StatCardProps) {
  const variants: Record<
    Variant,
    {
      bg: string;
      border: string;
      iconBg: string;
      iconColor: string;
      textColor: string;
      activeBorder: string;
    }
  > = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
      activeBorder: "ring-2 ring-emerald-500",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
      activeBorder: "ring-2 ring-amber-500",
    },
    danger: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      textColor: "text-rose-700",
      activeBorder: "ring-2 ring-rose-500",
    },
    default: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      textColor: "text-slate-700",
      activeBorder: "ring-2 ring-slate-500",
    },
  };

  const style = variants[variant];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        style.bg,
        style.border,
        isActive && style.activeBorder,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? !!isActive : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", style.textColor)}>
                {count}
              </span>
              <span className={cn("text-sm font-medium", style.textColor)}>
                ({percentage}%)
              </span>
            </div>
          </div>

          <div className={cn("p-3 rounded-xl", style.iconBg)}>
            <Icon className={cn("w-6 h-6", style.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
