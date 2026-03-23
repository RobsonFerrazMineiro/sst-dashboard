"use client";

import RiskScoreBadge from "@/components/dashboard/RiskScoreBadge";
import RiskScoreHoverCard from "@/components/dashboard/RiskScoreHoverCard";
import { calculateRiskScore } from "@/lib/risk-score";
import { createRealPendingsList } from "@/lib/unified-pending";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

interface RiskScoreProfileCardProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
}

/**
 * Calcula e exibe o Score de Risco do colaborador no perfil
 * Usa o mesmo padrão do dashboard: botão + hover card
 */
export default function RiskScoreProfileCard({
  asos,
  treinamentos,
}: RiskScoreProfileCardProps) {
  // Cria lista de pendências reais
  const pendingsList = createRealPendingsList(asos, treinamentos);

  // Calcula score
  const riskScore = calculateRiskScore(pendingsList);

  // Usa o mesmo padrão do dashboard: RiskScoreBadge com hover card
  return (
    <RiskScoreHoverCard riskScore={riskScore}>
      <RiskScoreBadge riskScore={riskScore} showLabel />
    </RiskScoreHoverCard>
  );
}
