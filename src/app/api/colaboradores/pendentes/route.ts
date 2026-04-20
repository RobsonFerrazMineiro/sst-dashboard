import {
  forbiddenResponse,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessFromUser, hasRole } from "@/lib/permissions";
import { NextResponse } from "next/server";

/**
 * GET /api/colaboradores/pendentes
 *
 * Retorna colaboradores da empresa autenticada que ainda não possuem
 * um usuário vinculado (colaboradorId = null na tabela Usuario).
 * Somente ADMIN pode acessar.
 */
export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  const pendentes = await prisma.colaborador.findMany({
    where: {
      empresaId: auth.session.empresaId,
      // colaboradores cujo id NÃO aparece como colaboradorId em nenhum usuario
      usuario: null,
    },
    select: {
      id: true,
      nome: true,
      cargo: true,
      setor: true,
      matricula: true,
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(pendentes);
}
