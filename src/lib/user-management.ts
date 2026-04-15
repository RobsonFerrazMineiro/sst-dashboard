export const USER_ROLE_ORDER = ["ADMIN", "GESTOR", "OPERADOR", "LEITOR"] as const;

type PapelLike = {
  codigo: string;
  nome: string;
};

export function getPrimaryRole<T extends PapelLike>(roles: T[]): T | null {
  const ranked = [...roles].sort((a, b) => {
    const aIndex = USER_ROLE_ORDER.indexOf(a.codigo as (typeof USER_ROLE_ORDER)[number]);
    const bIndex = USER_ROLE_ORDER.indexOf(b.codigo as (typeof USER_ROLE_ORDER)[number]);

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
