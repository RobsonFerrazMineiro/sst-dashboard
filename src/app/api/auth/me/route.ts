import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { getUserAccess } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);

  if (!auth) {
    return unauthorizedResponse();
  }

  const access = await getUserAccess(auth.session);

  return NextResponse.json({
    user: {
      id: auth.user.id,
      nome: auth.user.nome,
      email: auth.user.email,
      empresaId: auth.user.empresaId,
      ultimoLoginAt: auth.user.ultimoLoginAt,
      roles: access.roles,
      permissions: access.permissions,
    },
  });
}
