export type AccessRoleOption = {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
};

export type EmpresaUser = {
  id: string;
  nome: string;
  email: string;
  status: "ATIVO" | "INATIVO" | "BLOQUEADO";
  isAccountOwner: boolean;
  ultimoLoginAt?: string | null;
  papel: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
};
