/**
 * Ordem de precedência dos papéis para exibição/ordenação.
 * COLABORADOR é excluído do fluxo de "Novo usuário" manual —
 * ele só é atribuído pelo fluxo de "Ativar primeiro acesso".
 * A regra real de acesso é baseada em permissões, não nesta lista.
 */
export const USER_ROLE_ORDER = [
  "ADMIN",
  "GESTOR",
  "TECNICO_SST",
  "COLABORADOR",
] as const;

/** Papéis disponíveis para criação manual de usuário (Novo usuário). */
export const MANUAL_USER_ROLES = ["ADMIN", "GESTOR", "TECNICO_SST"] as const;

type PapelLike = {
  codigo: string;
  nome: string;
};

export function getPrimaryRole<T extends PapelLike>(roles: T[]): T | null {
  const ranked = [...roles].sort((a, b) => {
    const aIndex = USER_ROLE_ORDER.indexOf(
      a.codigo as (typeof USER_ROLE_ORDER)[number],
    );
    const bIndex = USER_ROLE_ORDER.indexOf(
      b.codigo as (typeof USER_ROLE_ORDER)[number],
    );

    const safeAIndex = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const safeBIndex = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

    if (safeAIndex !== safeBIndex) return safeAIndex - safeBIndex;
    return a.nome.localeCompare(b.nome);
  });

  return ranked[0] ?? null;
}

export function isAdminRoleCode(roleCode: string | null | undefined) {
  return roleCode === "ADMIN";
}
