import {
  getAsoStatus,
  getTrainingStatus,
  type ValidityStatus,
} from "@/lib/validity";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

/**
 * Item unificado de pendência (ASO ou Treinamento)
 */
export type PendingItem = {
  id: string;
  type: "aso" | "treinamento";
  colaborador: string;
  descricao: string;
  validade: string | null;
  status: ValidityStatus;
  dataRegistro?: string | null;
  // Dados originais para consultas futuras
  originalData: AsoRecord | TreinamentoRecord;
};

/**
 * Tipo de filtro para pendências
 */
export type PendingFilterType =
  | "todos"
  | "vencidos"
  | "vencendo"
  | "pendencias";

/**
 * Indicadores gerais do dashboard
 */
export type DashboardIndicators = {
  asoVencidos: number;
  treinamentosVencidos: number;
  vencendoProximos30Dias: number;
  colaboradoresComPendencias: number;
};

/**
 * Converte ASO para item unificado de pendência
 */
function asoToPendingItem(aso: AsoRecord): PendingItem {
  const status = getAsoStatus(aso.validade_aso, aso.data_aso);
  return {
    id: aso.id,
    type: "aso",
    colaborador: aso.colaborador_nome || "Desconhecido",
    descricao: aso.tipoASO_nome || "ASO",
    validade: aso.validade_aso ?? null,
    status,
    dataRegistro: aso.data_aso,
    originalData: aso,
  };
}

/**
 * Converte Treinamento para item unificado de pendência
 */
function treinamentoToPendingItem(treinamento: TreinamentoRecord): PendingItem {
  const status = getTrainingStatus(treinamento.validade);
  return {
    id: treinamento.id,
    type: "treinamento",
    colaborador: treinamento.colaborador_nome || "Desconhecido",
    descricao: `${treinamento.tipoTreinamento_nome || "Treinamento"} (${treinamento.nr || "N/A"})`,
    validade: treinamento.validade ?? null,
    status,
    dataRegistro: treinamento.data_treinamento,
    originalData: treinamento,
  };
}

/**
 * Define prioridade do status para ordenação
 * (vencido > prestes a vencer > pendente > em dia > sem vencimento)
 */
function getStatusPriority(status: ValidityStatus): number {
  const priorities: Record<ValidityStatus, number> = {
    Vencido: 0,
    "Prestes a vencer": 1,
    Pendente: 2,
    "Em dia": 3,
    "Sem vencimento": 4,
  };
  return priorities[status];
}

/**
 * Cria lista unificada de pendências a partir de ASOs e Treinamentos
 */
export function createUnifiedPendingsList(
  asos: AsoRecord[],
  treinamentos: TreinamentoRecord[],
): PendingItem[] {
  const asoItems = asos.map(asoToPendingItem);
  const treinamentoItems = treinamentos.map(treinamentoToPendingItem);
  const unified = [...asoItems, ...treinamentoItems];

  // Ordena por prioridade (status) e depois por data de validade (mais próxima primeiro)
  unified.sort((a, b) => {
    const priorityDiff =
      getStatusPriority(a.status) - getStatusPriority(b.status);
    if (priorityDiff !== 0) return priorityDiff;

    // Se mesmo status, ordena por data de validade (mais próxima primeiro)
    if (a.validade && b.validade) {
      return new Date(a.validade).getTime() - new Date(b.validade).getTime();
    }

    return 0;
  });

  return unified;
}

/**
 * Filtra lista de pendências por tipo
 */
export function filterPendingItems(
  items: PendingItem[],
  filterType: PendingFilterType,
): PendingItem[] {
  switch (filterType) {
    case "vencidos":
      return items.filter((item) => item.status === "Vencido");

    case "vencendo":
      return items.filter((item) => item.status === "Prestes a vencer");

    case "pendencias":
      return items.filter((item) => item.status === "Pendente");

    case "todos":
    default:
      return items;
  }
}

/**
 * Calcula indicadores gerais do dashboard
 */
export function calculateIndicators(
  asos: AsoRecord[],
  treinamentos: TreinamentoRecord[],
): DashboardIndicators {
  // ASOs vencidos
  const asoVencidos = asos.filter(
    (aso) => getAsoStatus(aso.validade_aso, aso.data_aso) === "Vencido",
  ).length;

  // Treinamentos vencidos
  const treinamentosVencidos = treinamentos.filter(
    (tre) => getTrainingStatus(tre.validade) === "Vencido",
  ).length;

  // Total vencendo nos próximos 30 dias
  const vencendoProximos30Dias =
    asos.filter(
      (aso) =>
        getAsoStatus(aso.validade_aso, aso.data_aso) === "Prestes a vencer",
    ).length +
    treinamentos.filter(
      (tre) => getTrainingStatus(tre.validade) === "Prestes a vencer",
    ).length;

  // Colaboradores com pendências (ASOs ou Treinamentos com status "Pendente")
  const colaboradoresComPendencias = new Set<string>();

  asos.forEach((aso) => {
    if (getAsoStatus(aso.validade_aso, aso.data_aso) === "Pendente") {
      if (aso.colaborador_id)
        colaboradoresComPendencias.add(aso.colaborador_id);
    }
  });

  treinamentos.forEach((tre) => {
    if (getTrainingStatus(tre.validade) === "Pendente") {
      if (tre.colaborador_id)
        colaboradoresComPendencias.add(tre.colaborador_id);
    }
  });

  return {
    asoVencidos,
    treinamentosVencidos,
    vencendoProximos30Dias,
    colaboradoresComPendencias: colaboradoresComPendencias.size,
  };
}

/**
 * Retorna cor do badge baseada no status
 */
export function getStatusColor(status: ValidityStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    ValidityStatus,
    { bg: string; text: string; border: string }
  > = {
    Vencido: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    "Prestes a vencer": {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    Pendente: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    "Em dia": {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    "Sem vencimento": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
  };
  return colors[status];
}
