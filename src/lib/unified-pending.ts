import {
  getAsoStatus,
  getTrainingStatus,
  type ValidityStatus,
} from "@/lib/validity";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

/**
 * Item unificado de pendência (ASO ou Treinamento)
 */
export type UnifiedPendingItem = {
  id: string;
  type: "aso" | "treinamento";
  colaborador: string;
  descricao: string;
  validade: string | null;
  status: ValidityStatus;
  originalData: AsoRecord | TreinamentoRecord;
};

/**
 * Converte ASO para item unificado
 */
function asoToUnified(aso: AsoRecord): UnifiedPendingItem {
  return {
    id: aso.id,
    type: "aso",
    colaborador: aso.colaborador_nome || "Desconhecido",
    descricao: aso.tipoASO_nome || "ASO",
    validade: aso.validade_aso ?? null,
    status: getAsoStatus(aso.validade_aso, aso.data_aso),
    originalData: aso,
  };
}

/**
 * Converte Treinamento para item unificado
 */
function treinamentoToUnified(tre: TreinamentoRecord): UnifiedPendingItem {
  return {
    id: tre.id,
    type: "treinamento",
    colaborador: tre.colaborador_nome || "Desconhecido",
    descricao: `${tre.tipoTreinamento_nome || "Treinamento"} (${tre.nr || "N/A"})`,
    validade: tre.validade ?? null,
    status: getTrainingStatus(tre.validade),
    originalData: tre,
  };
}

/**
 * Define prioridade do status para ordenação
 */
function getStatusPriority(status: ValidityStatus): number {
  const priorities: Record<ValidityStatus, number> = {
    Vencido: 0,
    "Prestes a vencer": 1,
    "Em dia": 2,
    Pendente: 3,
    "Sem vencimento": 4,
  };
  return priorities[status];
}

/**
 * Cria lista unificada de pendências
 */
export function createUnifiedPendingsList(
  asos: AsoRecord[],
  treinamentos: TreinamentoRecord[],
): UnifiedPendingItem[] {
  const asoItems = asos.map(asoToUnified);
  const treinamentoItems = treinamentos.map(treinamentoToUnified);
  const unified = [...asoItems, ...treinamentoItems];

  // Ordena por status (prioridade) e depois por data de validade
  unified.sort((a, b) => {
    const priorityDiff =
      getStatusPriority(a.status) - getStatusPriority(b.status);
    if (priorityDiff !== 0) return priorityDiff;

    if (a.validade && b.validade) {
      return new Date(a.validade).getTime() - new Date(b.validade).getTime();
    }

    return 0;
  });

  return unified;
}

/**
 * Filtra pendências por tipo de status
 */
export function filterPendingsByStatus(
  items: UnifiedPendingItem[],
  filterType: "todos" | "vencidos" | "vencendo" | "pendencias",
): UnifiedPendingItem[] {
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
 * Retorna cores baseada no status
 */
export function getStatusColorClasses(status: ValidityStatus): {
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
    "Em dia": {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    Pendente: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    "Sem vencimento": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
  };
  return colors[status];
}

/**
 * Status que são considerados pendências reais (não "Em dia" ou "Sem vencimento")
 */
const REAL_PENDING_STATUS: ValidityStatus[] = [
  "Vencido",
  "Prestes a vencer",
  "Pendente",
];

/**
 * Verifica se um status é uma pendência real
 */
function isRealPending(status: ValidityStatus): boolean {
  return REAL_PENDING_STATUS.includes(status);
}

/**
 * Cria lista de apenas pendências reais (exclui "Em dia" e "Sem vencimento")
 */
export function createRealPendingsList(
  asos: AsoRecord[],
  treinamentos: TreinamentoRecord[],
): UnifiedPendingItem[] {
  const allItems = createUnifiedPendingsList(asos, treinamentos);
  return allItems.filter((item) => isRealPending(item.status));
}

/**
 * Grupo de pendências agrupado por colaborador
 */
export type PendingsByColaborador = {
  colaboradorId: string | null;
  colaborador: string;
  totalCount: number;
  vencidosCount: number;
  vendoCount: number;
  pendentesCount: number;
  items: UnifiedPendingItem[];
};

/**
 * Agrupa pendências por colaborador e ordena por gravidade
 */
export function groupPendingsByColaborador(
  items: UnifiedPendingItem[],
): PendingsByColaborador[] {
  const grouped = new Map<string, UnifiedPendingItem[]>();

  // Agrupa por colaborador (usando nome como chave)
  items.forEach((item) => {
    const key = item.colaborador;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  // Transforma em array com metadados
  const groups: PendingsByColaborador[] = Array.from(grouped.entries()).map(
    ([colaborador, items]) => {
      const vencidosCount = items.filter((i) => i.status === "Vencido").length;
      const vendoCount = items.filter(
        (i) => i.status === "Prestes a vencer",
      ).length;
      const pendentesCount = items.filter((i) => i.status === "Pendente").length;

      return {
        colaboradorId: items[0]?.originalData.colaborador_id || null,
        colaborador,
        totalCount: items.length,
        vencidosCount,
        vendoCount,
        pendentesCount,
        items,
      };
    },
  );

  // Ordena por gravidade: vencidos DESC, vendo DESC, pendentes DESC, depois alfabético
  groups.sort((a, b) => {
    if (a.vencidosCount !== b.vencidosCount) {
      return b.vencidosCount - a.vencidosCount;
    }
    if (a.vendoCount !== b.vendoCount) {
      return b.vendoCount - a.vendoCount;
    }
    if (a.pendentesCount !== b.pendentesCount) {
      return b.pendentesCount - a.pendentesCount;
    }
    return a.colaborador.localeCompare(b.colaborador);
  });

  return groups;
}

/**
 * Filtra grupos de pendências por tipo de status
 */
export function filterGroupsByStatus(
  groups: PendingsByColaborador[],
  filterType: "todos" | "vencidos" | "vencendo" | "pendencias",
): PendingsByColaborador[] {
  if (filterType === "todos") return groups;

  return groups
    .map((group) => {
      let filteredItems = group.items;

      switch (filterType) {
        case "vencidos":
          filteredItems = group.items.filter((item) => item.status === "Vencido");
          break;
        case "vencendo":
          filteredItems = group.items.filter(
            (item) => item.status === "Prestes a vencer",
          );
          break;
        case "pendencias":
          filteredItems = group.items.filter((item) => item.status === "Pendente");
          break;
      }

      // Retorna null se o grupo ficar vazio
      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
        totalCount: filteredItems.length,
      };
    })
    .filter((g) => g !== null) as PendingsByColaborador[];
}
