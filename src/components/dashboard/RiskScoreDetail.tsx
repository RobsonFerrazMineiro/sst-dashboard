"use client";

import { getRiskLevelColors, type RiskScore } from "@/lib/risk-score";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Minus,
} from "lucide-react";

interface RiskScoreDetailProps {
  riskScore: RiskScore;
}

/**
 * Componente de detalhamento do score de risco
 * Mostra a breakdown do cálculo
 */
export default function RiskScoreDetail({ riskScore }: RiskScoreDetailProps) {
  const colors = getRiskLevelColors(riskScore.level);

  const iconMap = {
    Crítico: AlertTriangle,
    Alto: AlertCircle,
    Atenção: Info,
    Controlado: CheckCircle2,
  };

  const IconComponent = iconMap[riskScore.level];

  const breakdownItems = [
    {
      label: "Pontos iniciais",
      value: riskScore.breakdown.initial,
      type: "initial" as const,
    },
    {
      label: "Itens vencidos",
      value: riskScore.breakdown.expiredDeduction,
      type: "deduction" as const,
    },
    {
      label: "Itens prestes a vencer",
      value: riskScore.breakdown.almostExpiredDeduction,
      type: "deduction" as const,
    },
    {
      label: "Itens pendentes",
      value: riskScore.breakdown.pendingDeduction,
      type: "deduction" as const,
    },
    {
      label: "Penalidade (vencido >30 dias)",
      value: riskScore.breakdown.oldExpiredPenalty,
      type: "deduction" as const,
    },
  ].filter((item) => item.value !== 0);

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-opacity-30">
        <IconComponent className={`w-5 h-5 ${colors.icon}`} />
        <div>
          <div className={`text-sm font-bold ${colors.text}`}>
            Score de Risco: {riskScore.score}
          </div>
          <div className={`text-xs font-medium ${colors.text}`}>
            {riskScore.level}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {breakdownItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1">
              {item.type === "deduction" && (
                <Minus className={`w-3 h-3 ${colors.text}`} />
              )}
              <span className={`${colors.text}`}>{item.label}</span>
            </div>
            <span
              className={`font-medium ${item.type === "initial" ? `font-bold ${colors.text}` : colors.text}`}
            >
              {item.value}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-opacity-30 mt-2">
          <span className={colors.text}>Score final</span>
          <span className={colors.text}>{riskScore.score}</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-3 text-xs space-y-1">
        {riskScore.breakdown.expiredDeduction < 0 && (
          <p className={`${colors.text}`}>
            ⚠️ {Math.abs(riskScore.breakdown.expiredDeduction) / 30} item(ns)
            vencido(s)
          </p>
        )}
        {riskScore.breakdown.almostExpiredDeduction < 0 && (
          <p className={`${colors.text}`}>
            ⏰ {Math.abs(riskScore.breakdown.almostExpiredDeduction) / 10}{" "}
            item(ns) prestes a vencer
          </p>
        )}
        {riskScore.breakdown.pendingDeduction < 0 && (
          <p className={`${colors.text}`}>
            📋 {Math.abs(riskScore.breakdown.pendingDeduction) / 15} item(ns)
            pendente(s)
          </p>
        )}
      </div>
    </div>
  );
}
