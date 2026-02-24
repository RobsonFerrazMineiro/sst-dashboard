export type ColumnDef = { header: string; accessor: string };

export type AsoRecord = {
  id: string;
  colaborador_nome?: string | null;
  setor?: string | null;
  cargo?: string | null;
  data_aso?: string | null;
  validade_aso?: string | null;
};

export type TipoTreinamento = {
  id: string;
  nr: string;
  nome: string;
};

export type TreinamentoRecord = {
  id: string;
  colaborador_nome?: string | null;
  tipoTreinamento?: string | null;
  nr?: string | null;
  data_treinamento?: string | null;
  validade?: string | null;
};
