import { parseISO } from "date-fns";

export type ValidityStatus =
  | "Em dia"
  | "Prestes a vencer"
  | "Vencido"
  | "Pendente"
  | "Sem vencimento";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDaysTo(date: Date): number {
  const hoje = startOfToday();
  return Math.ceil((date.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAsoStatus(
  validadeStr?: string | null,
  dataStr?: string | null,
): ValidityStatus {
  if (!validadeStr || !dataStr) return "Pendente";
  const validade = parseISO(validadeStr);
  const diffDays = diffDaysTo(validade);
  if (diffDays < 0) return "Vencido";
  if (diffDays <= 30) return "Prestes a vencer";
  return "Em dia";
}

export function getTrainingStatus(validadeStr?: string | null): ValidityStatus {
  if (!validadeStr) return "Sem vencimento";
  const validade = parseISO(validadeStr);
  const diffDays = diffDaysTo(validade);
  if (diffDays < 0) return "Vencido";
  if (diffDays <= 30) return "Prestes a vencer";
  return "Em dia";
}
