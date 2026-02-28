import type { ReactNode } from "react";

export type ColumnDef<T extends Record<string, unknown>> = {
  header: string;
  accessor: keyof T;
  render?: (row: T) => ReactNode;
};

export type AsoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;
  setor?: string | null;
  cargo?: string | null;
  data_aso?: string | null;
  validade_aso?: string | null;
};

export type TipoASO = {
  id: string;
  nome: string;
  validadeMeses: number | null;
  descricao: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TipoTreinamento = {
  id: string;
  nome: string;
  nr: string;
  validadeMeses?: number | null;
  descricao?: string | null;
};

export type TreinamentoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;

  tipoTreinamento?: string | null;
  nr?: string | null;

  data_treinamento?: string | null;
  validade?: string | null;
  carga_horaria?: number | null;
};
