import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessFromUser, hasRole } from "@/lib/permissions";
import { USER_ROLE_ORDER } from "@/lib/user-management";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  const papeis = await prisma.papel.findMany({
    where: {
      empresaId: auth.session.empresaId,
      codigo: { in: [...USER_ROLE_ORDER] },
    },
    orderBy: { nome: "asc" },
  });

  const ordered = [...papeis].sort((a, b) => {
    const aIndex = USER_ROLE_ORDER.indexOf(a.codigo as (typeof USER_ROLE_ORDER)[number]);
    const bIndex = USER_ROLE_ORDER.indexOf(b.codigo as (typeof USER_ROLE_ORDER)[number]);
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
