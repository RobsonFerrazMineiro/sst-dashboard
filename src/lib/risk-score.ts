import type { UnifiedPendingItem } from "@/lib/unified-pending";
import { parseLocalDate } from "@/lib/utils";

/**
 * Classificação de risco por faixa de score
 */
export type RiskLevel = "Crítico" | "Alto" | "Atenção" | "Controlado";

/**
 * Informações de risco de um colaborador
 */
export type RiskScore = {
  score: number; // 0 a 100
  level: RiskLevel;
  breakdown: {
    initial: number; // 100
    expiredDeduction: number; // -30 por item vencido
    almostExpiredDeduction: number; // -10 por item prestes a vencer
    pendingDeduction: number; // -15 por item pendente
    oldExpiredPenalty: number; // -10 por item vencido há mais de 30 dias
  };
};

/**
 * Calcula dias entre uma data e hoje
 * Retorna número negativo se a data está no passado
 */
function calculateDaysDifference(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;

  try {
    const date = parseLocalDate(dateStr);
    if (!date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = date.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Calcula o score de risco para um conjunto de itens de pendência
 *
 * Regras:
 * - Comença com 100 pontos
 * - -30 por item vencido
 * - -10 por item prestes a vencer
 * - -15 por item pendente
 * - -10 adicional por item vencido há mais de 30 dias (penalidade extra)
 * - Limita resultado entre 0 e 100
 *
 * @param items Lista de itens de pendência do colaborador
 * @returns RiskScore com pontuação e classificação
 */
export function calculateRiskScore(items: UnifiedPendingItem[]): RiskScore {
  let score = 100;
  const breakdown = {
    initial: 100,
    expiredDeduction: 0,
    almostExpiredDeduction: 0,
    pendingDeduction: 0,
    oldExpiredPenalty: 0,
  };

  // Processa cada item
  items.forEach((item) => {
    if (item.status === "Vencido") {
      // -30 por vencido
      breakdown.expiredDeduction -= 30;
      score -= 30;

      // Verifica penalidade extra: vencido há mais de 30 dias
      const daysDiff = calculateDaysDifference(item.validade);
      if (daysDiff < -30) {
        // Vencido há mais de 30 dias
        breakdown.oldExpiredPenalty -= 10;
        score -= 10;
      }
    } else if (item.status === "Prestes a vencer") {
      // -10 por prestes a vencer
      breakdown.almostExpiredDeduction -= 10;
      score -= 10;
    } else if (item.status === "Pendente") {
      // -15 por pendente
      breakdown.pendingDeduction -= 15;
      score -= 15;
    }
  });

  // Limita score entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Determina nível de risco
  let level: RiskLevel = "Controlado";
  if (score <= 29) {
    level = "Crítico";
  } else if (score <= 59) {
    level = "Alto";
  } else if (score <= 84) {
    level = "Atenção";
  }

  return {
    score,
    level,
    breakdown,
  };
}

/**
 * Retorna as cores Tailwind para cada nível de risco
 */
export function getRiskLevelColors(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const colors: Record<
    RiskLevel,
    { bg: string; text: string; border: string; icon: string }
  > = {
    Crítico: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: "text-rose-600",
    },
    Alto: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      icon: "text-orange-600",
    },
    Atenção: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "text-amber-600",
    },
    Controlado: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: "text-emerald-600",
    },
  };

  return colors[level];
}

/**
 * Retorna ícone apropriado para cada nível (nome do ícone Lucide)
 */
export function getRiskLevelIcon(level: RiskLevel): string {
  const icons: Record<RiskLevel, string> = {
    Crítico: "AlertTriangle",
    Alto: "AlertCircle",
    Atenção: "Info",
    Controlado: "CheckCircle2",
  };

  return icons[level];
}
