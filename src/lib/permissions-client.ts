"use client";

import { useQuery } from "@tanstack/react-query";

type AuthMeResponse = {
  user: {
    id: string;
    nome: string;
    email: string;
    empresaId: string;
    empresaNome: string | null;
    isAccountOwner: boolean;
    ultimoLoginAt?: string | null;
    roles: string[];
    permissions: string[];
  };
};

async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Falha ao carregar permissões do usuário");
  }

  return res.json();
}

export function useAuthPermissions() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
    staleTime: 60_000,
    retry: false,
  });

  const permissions = query.data?.user.permissions ?? [];
  const roles = query.data?.user.roles ?? [];

  const hasPermission = (permissionCode: string) =>
    permissions.includes(permissionCode);

  const hasRole = (roleCode: string) => roles.includes(roleCode);

  return {
    ...query,
    user: query.data?.user ?? null,
    permissions,
    roles,
    hasPermission,
    hasRole,
  };
}
