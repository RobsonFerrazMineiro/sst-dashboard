export type AccessRoleOption = {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
};

export type EmpresaUser = {
  id: string;
  nome: string;
  /** login pode ser e-mail ou matrícula */
  login: string;
  email?: string | null;
  status: "ATIVO" | "INATIVO" | "BLOQUEADO";
  isAccountOwner: boolean;
  ultimoLoginAt?: string | null;
  papel: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
  /** Dados do colaborador vinculado (opcional — admins manuais não têm vínculo). */
  colaborador?: {
    cargo: string;
    setor: string;
    matricula: string | null;
  } | null;
  /** Indica se este usuário é do perfil COLABORADOR e ainda nunca ativou o acesso */
  isPrimeiroAcesso?: boolean;
};

/**
 * Colaborador que ainda não possui usuário vinculado.
 * Aparece na tela de Acessos como "Pendente de ativação".
 */
export type PendingColaborador = {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  matricula: string | null;
};
