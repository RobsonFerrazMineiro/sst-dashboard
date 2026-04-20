import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { getAccessFromUser } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);

  if (!auth) {
    return unauthorizedResponse();
  }

  // getAuthenticatedUser já carregou o usuário com papeis e permissoes do banco.
  // Usamos getAccessFromUser (síncrono) para evitar uma segunda query idêntica.
  const access = getAccessFromUser(auth.user);

  return NextResponse.json({
    user: {
      id: auth.user.id,
      nome: auth.user.nome,
      email: auth.user.email,
      empresaId: auth.user.empresaId,
      isAccountOwner: auth.user.isAccountOwner,
      ultimoLoginAt: auth.user.ultimoLoginAt,
      roles: access.roles,
      permissions: access.permissions,
    },
  });
}
