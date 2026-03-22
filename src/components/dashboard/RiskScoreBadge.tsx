"use client";

import RiskScoreDetail from "@/components/dashboard/RiskScoreDetail";
import { getRiskLevelColors, type RiskScore } from "@/lib/risk-score";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";

interface RiskScoreBadgeProps {
  riskScore: RiskScore;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

/**
 * Componente para exibir o score de risco visualmente
 * Mostra o score numérico, nível de risco e ícone correspondente
 * Suporta tooltip com detalhamento do cálculo
 */
export default function RiskScoreBadge({
  riskScore,
  showLabel = true,
  size = "md",
  showTooltip = true,
}: RiskScoreBadgeProps) {
  const [showDetail, setShowDetail] = useState(false);
  const colors = getRiskLevelColors(riskScore.level);

  const sizeClasses = {
    sm: {
      container: "px-2.5 py-1.5",
      score: "text-xs",
      label: "text-xs",
      icon: "w-3 h-3",
    },
    md: {
      container: "px-3 py-2",
      score: "text-sm",
      label: "text-xs",
      icon: "w-4 h-4",
    },
    lg: {
      container: "px-4 py-2.5",
      score: "text-base",
      label: "text-sm",
      icon: "w-5 h-5",
    },
  };

  const sizeConfig = sizeClasses[size];

  // Ícone baseado no nível
  const iconMap = {
    Crítico: AlertTriangle,
    Alto: AlertCircle,
    Atenção: Info,
    Controlado: CheckCircle2,
  };

  const IconComponent = iconMap[riskScore.level];

  return (
    <div className="relative">
      <button
        onClick={() => showTooltip && setShowDetail(!showDetail)}
        className={`inline-flex items-center gap-2 rounded-lg border font-medium transition-all cursor-pointer hover:shadow-md ${colors.bg} ${colors.text} ${colors.border} border ${sizeConfig.container} ${showTooltip ? "hover:shadow-sm" : ""}`}
      >
        {/* Ícone */}
        <IconComponent className={`${sizeConfig.icon} ${colors.icon}`} />

        {/* Score numérico */}
        <span className={sizeConfig.score}>
          <strong>{riskScore.score}</strong>
        </span>

        {/* Label opcional */}
        {showLabel && (
          <span className={`${sizeConfig.label} font-medium`}>
            {riskScore.level}
          </span>
        )}
      </button>

      {/* Tooltip com detalhamento */}
      {showTooltip && showDetail && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64">
          <div className="rounded-lg shadow-lg border border-slate-200 bg-white p-0 overflow-hidden">
            <RiskScoreDetail riskScore={riskScore} />
          </div>
          {/* Arrow pointer */}
          <div
            className={`absolute right-4 -top-1 w-2 h-2 rotate-45 ${colors.bg} ${colors.border} border-t border-l`}
          />
        </div>
      )}

      {/* Overlay para fechar tooltip ao clicar fora */}
      {showTooltip && showDetail && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}
