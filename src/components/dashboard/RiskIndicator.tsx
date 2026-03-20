"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useMemo } from "react";

import {
  createRealPendingsList,
  groupPendingsByColaborador,
} from "@/lib/unified-pending";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

interface RiskIndicatorProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
  isLoading?: boolean;
}

type RiskLevel = "alto" | "médio" | "baixo";

interface RiskData {
  level: RiskLevel;
  vencidosCount: number;
  vendoCount: number;
  colaboradoresComRisco: number;
}

export default function RiskIndicator({
  asos,
  treinamentos,
  isLoading = false,
}: RiskIndicatorProps) {
  const riskData = useMemo<RiskData>(() => {
    const realPendingsList = createRealPendingsList(asos, treinamentos);
    const groupedPendencies = groupPendingsByColaborador(realPendingsList);

    const vencidosCount = groupedPendencies.reduce(
      (sum, group) => sum + group.vencidosCount,
      0,
    );
    const vendoCount = groupedPendencies.reduce(
      (sum, group) => sum + group.vendoCount,
      0,
    );
    const colaboradoresComRisco = groupedPendencies.filter(
      (group) => group.vencidosCount > 0,
    ).length;

    let level: RiskLevel = "baixo";
    if (vencidosCount > 0) {
      level = "alto";
    } else if (vendoCount > 0) {
      level = "médio";
    }

    return {
      level,
      vencidosCount,
      vendoCount,
      colaboradoresComRisco,
    };
  }, [asos, treinamentos]);

  if (isLoading) {
    return null;
  }

  const riskConfig: Record<
    RiskLevel,
    {
      bg: string;
      border: string;
      icon: React.ReactNode;
      label: string;
      textColor: string;
    }
  > = {
    alto: {
      bg: "bg-rose-50",
      border: "border-l-4 border-rose-500",
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
      label: "ALTO",
      textColor: "text-rose-900",
    },
    médio: {
      bg: "bg-amber-50",
      border: "border-l-4 border-amber-500",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      label: "MÉDIO",
      textColor: "text-amber-900",
    },
    baixo: {
      bg: "bg-emerald-50",
      border: "border-l-4 border-emerald-500",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      label: "BAIXO",
      textColor: "text-emerald-900",
    },
  };

  const config = riskConfig[riskData.level];

  return (
    <div className={`${config.bg} ${config.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor}`}>
            Risco Geral: {config.label}
          </h3>
          <p className={`text-sm ${config.textColor} opacity-80 mt-1`}>
            {riskData.vencidosCount} vencidos • {riskData.vendoCount} vencendo •{" "}
            {riskData.colaboradoresComRisco} colaboradores críticos
          </p>
        </div>
      </div>
    </div>
  );
}
