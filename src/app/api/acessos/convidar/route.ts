import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import {
  forbiddenResponse,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInviteToken } from "@/lib/invite-token";
import { getAccessFromUser, hasRole } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ip, userAgent } = extractRequestMeta(req);
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) return forbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const colaboradorId = body?.colaboradorId
    ? String(body.colaboradorId).trim()
    : null;
  const loginSugerido = body?.loginSugerido
    ? String(body.loginSugerido).trim().toLowerCase()
    : null;

  if (!colaboradorId) {
    return NextResponse.json(
      { error: "colaboradorId é obrigatório" },
      { status: 400 },
    );
  }

  // Valida que o colaborador pertence à empresa e ainda não tem usuário
  const colaborador = await prisma.colaborador.findFirst({
    where: { id: colaboradorId, empresaId: auth.session.empresaId },
    include: { usuario: { select: { id: true, status: true } } },
  });

  if (!colaborador) {
    return NextResponse.json(
      { error: "Colaborador não encontrado" },
      { status: 404 },
    );
  }

  if (colaborador.usuario) {
    return NextResponse.json(
      { error: "Este colaborador já possui um acesso cadastrado" },
      { status: 409 },
    );
  }

  // Invalida convites anteriores pendentes deste colaborador (evita acúmulo)
  await prisma.conviteAcesso.updateMany({
    where: {
      colaboradorId,
      empresaId: auth.session.empresaId,
      usadoEm: null,
    },
    data: { usadoEm: new Date() }, // marca como "usado" para invalidar
  });

  const { token, hash, expiresAt } = generateInviteToken();

  await prisma.conviteAcesso.create({
    data: {
      empresaId: auth.session.empresaId,
      colaboradorId,
      criadoPorId: auth.session.userId,
      loginSugerido: loginSugerido ?? colaborador.matricula ?? null,
      tokenHash: hash,
      expiresAt,
    },
  });

  // Monta a URL do convite usando a origem do request
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const inviteUrl = `${origin}/convite/${token}`;

  void createAuditLog({
    empresaId: auth.session.empresaId,
    usuarioId: auth.session.userId,
    acao: AUDIT_ACTIONS.INVITE_CREATED,
    entidade: "convite_acesso",
    entidadeId: colaboradorId,
    descricao: `Convite gerado para colaborador: ${colaborador.nome}`,
    ip,
    userAgent,
  });

  return NextResponse.json({ inviteUrl, expiresAt }, { status: 201 });
}
