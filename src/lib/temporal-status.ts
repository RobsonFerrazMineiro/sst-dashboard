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

type DateLike = Date | string | null | undefined;

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

function normalizeDateInput(value: DateLike): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    const copy = new Date(value);
    return Number.isNaN(copy.getTime()) ? null : copy;
  }

  return parseLocalDate(value);
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
  validadeStr?: DateLike,
  dataStr?: DateLike,
): StatusWithTemporal {
  if (!validadeStr || !dataStr) {
    return {
      status: "Pendente",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const validade = normalizeDateInput(validadeStr);
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
  validadeStr?: DateLike,
): StatusWithTemporal {
  if (!validadeStr) {
    return {
      status: "Sem vencimento",
      diffDays: 0,
      temporalLabel: "",
    };
  }

  const validade = normalizeDateInput(validadeStr);
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
export function getTemporalLabelFromDate(validadeStr?: DateLike): string {
  if (!validadeStr) return "";

  const validade = normalizeDateInput(validadeStr);
  if (!validade) return "";

  const diffDays = diffDaysTo(validade);
  return getTemporalLabel(diffDays);
}
