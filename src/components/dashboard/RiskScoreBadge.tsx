"use client";

import { getRiskLevelColors, type RiskScore } from "@/lib/risk-score";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface RiskScoreBadgeProps {
  riskScore: RiskScore;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Componente para exibir o score de risco visualmente
 * Mostra o score numérico, nível de risco e ícone correspondente
 * Para usar com hover card, envolva este componente com RiskScoreHoverCard
 */
export default function RiskScoreBadge({
  riskScore,
  showLabel = true,
  size = "md",
}: RiskScoreBadgeProps) {
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
    <button
      className={`inline-flex items-center gap-2 rounded-lg border font-medium transition-all cursor-pointer hover:shadow-md ${colors.bg} ${colors.text} ${colors.border} border ${sizeConfig.container}`}
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
  );
}
