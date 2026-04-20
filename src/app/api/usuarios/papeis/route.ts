import {
  forbiddenResponse,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessFromUser, hasRole } from "@/lib/permissions";
import { MANUAL_USER_ROLES, USER_ROLE_ORDER } from "@/lib/user-management";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  // ?manual=true → apenas papéis para criação manual (exclui COLABORADOR)
  const url = new URL(req.url);
  const manualOnly = url.searchParams.get("manual") === "true";
  const allowedCodes = manualOnly
    ? [...MANUAL_USER_ROLES]
    : [...USER_ROLE_ORDER];

  const papeis = await prisma.papel.findMany({
    where: {
      empresaId: auth.session.empresaId,
      codigo: { in: allowedCodes },
    },
    orderBy: { nome: "asc" },
  });

  const ordered = [...papeis].sort((a, b) => {
    const order = manualOnly ? MANUAL_USER_ROLES : USER_ROLE_ORDER;
    const aIndex = (order as readonly string[]).indexOf(a.codigo);
    const bIndex = (order as readonly string[]).indexOf(b.codigo);
    return aIndex - bIndex;
  });

  return NextResponse.json(
    ordered.map((papel) => ({
      id: papel.id,
      codigo: papel.codigo,
      nome: papel.nome,
      descricao: papel.descricao,
    })),
  );
}
