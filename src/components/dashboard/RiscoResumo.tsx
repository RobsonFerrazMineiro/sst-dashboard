"use client";

import type { PendingFilterType } from "@/lib/dashboard-analytics";
import { cn } from "@/lib/utils";
import { AlertTriangle, CalendarClock, CalendarX } from "lucide-react";

type RiscoResumoProps = {
  totalVencidos: number;
  vencendoProximos30Dias: number;
  vencendoHoje: number;
  filterType: PendingFilterType;
  onFilterChange: (f: PendingFilterType) => void;
};

type CardDef = {
  id: PendingFilterType;
  label: string;
  subLabel: string;
  value: number;
  icon: React.ReactNode;
  base: string;
  active: string;
};

export default function RiscoResumo({
  totalVencidos,
  vencendoProximos30Dias,
  vencendoHoje,
  filterType,
  onFilterChange,
}: RiscoResumoProps) {
  const cards: CardDef[] = [
    {
      id: "vencidos",
      label: "Críticos",
      subLabel: "vencidos",
      value: totalVencidos,
      icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
      base: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
      active: "ring-2 ring-rose-400 bg-rose-100",
    },
    {
      id: "vencendo",
      label: "Vencendo",
      subLabel: "próx. 30 dias",
      value: vencendoProximos30Dias,
      icon: <CalendarClock className="h-5 w-5" aria-hidden="true" />,
      base: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      active: "ring-2 ring-amber-400 bg-amber-100",
    },
    {
      id: "hoje",
      label: "Hoje",
      subLabel: "vencem hoje",
      value: vencendoHoje,
      icon: <CalendarX className="h-5 w-5" aria-hidden="true" />,
      base: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      active: "ring-2 ring-blue-400 bg-blue-100",
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-3"
      role="group"
      aria-label="Resumo estratégico de riscos SST"
    >
      {cards.map((card) => {
        const isActive = filterType === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(isActive ? "todos" : card.id)}
            aria-pressed={isActive}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              card.base,
              isActive && card.active,
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="opacity-70">{card.icon}</span>
              {isActive && (
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  ativo
                </span>
              )}
            </div>
            <p className="text-2xl font-bold tabular-nums leading-none">
              {card.value}
            </p>
            <p className="text-xs font-semibold mt-1">{card.label}</p>
            <p className="text-[11px] opacity-60 mt-0.5">{card.subLabel}</p>
          </button>
        );
      })}
    </div>
  );
}
