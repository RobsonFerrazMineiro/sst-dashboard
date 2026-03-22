import { parseLocalDate } from "@/lib/utils";

export type ValidityStatus =
  | "Em dia"
  | "Prestes a vencer"
  | "Vencido"
  | "Pendente"
  | "Sem vencimento";

/**
 * Informações de status com contexto temporal
 */
export interface StatusWithTemporal {
  status: ValidityStatus;
  diffDays: number;
  temporalLabel: string; // ex: "há 5 dias", "em 10 dias", "45 dias restantes"
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDaysTo(date: Date): number {
  const hoje = startOfToday();
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Gera rótulo temporal baseado em diffDays
 * Ex: "há 5 dias", "em 10 dias", "45 dias restantes"
 */
function getTemporalLabel(diffDays: number): string {
  if (diffDays < 0) {
    // Vencido há X dias
    const absDays = Math.abs(diffDays);
    return `há ${absDays} ${absDays === 1 ? "dia" : "dias"}`;
  } else if (diffDays === 0) {
    // Vence hoje
    return "vence hoje";
  } else if (diffDays <= 30) {
    // Prestes a vencer
    return `em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } else {
    // Em dia
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} restantes`;
  }
}

/**
 * Calcula status e informação temporal para ASO
 */
export function getAsoStatusWithTemporal(
  validadeStr?: string | null,
  dataStr?: string | null,
): StatusWithTemporal {
  if (!validadeStr || !dataStr) {
    return {
      status: "Pendente",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const validade = parseLocalDate(validadeStr);
  if (!validade) {
    return {
      status: "Pendente",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const diffDays = diffDaysTo(validade);
  let status: ValidityStatus;

  if (diffDays < 0) {
    status = "Vencido";
  } else if (diffDays <= 30) {
    status = "Prestes a vencer";
  } else {
    status = "Em dia";
  }

  return {
    status,
    diffDays,
    temporalLabel: getTemporalLabel(diffDays),
  };
}

/**
 * Calcula status e informação temporal para Treinamento
 */
export function getTrainingStatusWithTemporal(
  validadeStr?: string | null,
): StatusWithTemporal {
  if (!validadeStr) {
    return {
      status: "Sem vencimento",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const validade = parseLocalDate(validadeStr);
  if (!validade) {
    return {
      status: "Sem vencimento",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const diffDays = diffDaysTo(validade);
  let status: ValidityStatus;

  if (diffDays < 0) {
    status = "Vencido";
  } else if (diffDays <= 30) {
    status = "Prestes a vencer";
  } else {
    status = "Em dia";
  }

  return {
    status,
    diffDays,
    temporalLabel: getTemporalLabel(diffDays),
  };
}

/**
 * Apenas retorna o rótulo temporal sem calcular status
 * Útil para quando você já tem o status e só quer o label
 */
export function getTemporalLabelFromDate(validadeStr?: string | null): string {
  if (!validadeStr) return "";

  const validade = parseLocalDate(validadeStr);
  if (!validade) return "";

  const diffDays = diffDaysTo(validade);
  return getTemporalLabel(diffDays);
}
