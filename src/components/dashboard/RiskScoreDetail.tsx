"use client";

import { getRiskLevelColors, type RiskScore } from "@/lib/risk-score";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

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
    <div className="space-y-0 max-w-xs">
      {/* Header com background colorido - compacto */}
      <div className={`flex items-center gap-2 p-3 ${colors.bg}`}>
        <IconComponent className={`w-5 h-5 ${colors.icon} shrink-0`} />
        <div>
          <div className={`text-base font-bold ${colors.text} leading-tight`}>
            {riskScore.score}
          </div>
          <div className={`text-xs font-semibold ${colors.text} opacity-70`}>
            {riskScore.level}
          </div>
        </div>
      </div>

      {/* Divisor sutil */}
      <div className="h-px bg-slate-200" />

      {/* Breakdown section - compacto */}
      <div className="p-3 space-y-1.5">
        <div className="space-y-1">
          {breakdownItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1.5">
                {item.type === "initial" ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                )}
                <span className="text-slate-600">{item.label}</span>
              </div>
              <span
                className={`font-semibold ${
                  item.type === "initial" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {item.value > 0 ? "+" : ""}
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-1.5 mt-1.5 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total</span>
            <span className={`text-base font-bold ${colors.text}`}>
              {riskScore.score}
            </span>
          </div>
        </div>
      </div>

      {/* Insights section - compacto */}
      {(riskScore.breakdown.expiredDeduction < 0 ||
        riskScore.breakdown.almostExpiredDeduction < 0 ||
        riskScore.breakdown.pendingDeduction < 0) && (
        <>
          <div className="h-px bg-slate-200" />
          <div className="px-3 py-2 space-y-1">
            {riskScore.breakdown.expiredDeduction < 0 && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <span>⚠️</span>
                <span>
                  <span className="font-semibold">
                    {Math.abs(riskScore.breakdown.expiredDeduction) / 30}
                  </span>{" "}
                  vencido(s)
                </span>
              </div>
            )}
            {riskScore.breakdown.almostExpiredDeduction < 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700">
                <span>⏰</span>
                <span>
                  <span className="font-semibold">
                    {Math.abs(riskScore.breakdown.almostExpiredDeduction) / 10}
                  </span>{" "}
                  vencendo
                </span>
              </div>
            )}
            {riskScore.breakdown.pendingDeduction < 0 && (
              <div className="flex items-center gap-1.5 text-xs text-blue-700">
                <span>📋</span>
                <span>
                  <span className="font-semibold">
                    {Math.abs(riskScore.breakdown.pendingDeduction) / 15}
                  </span>{" "}
                  pendente(s)
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
