import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { hashToken, isInviteExpired } from "@/lib/invite-token";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { ip, userAgent } = extractRequestMeta(req);
  const { token } = await params;

  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Convite inválido" }, { status: 400 });
  }

  const hash = hashToken(token);

  const convite = await prisma.conviteAcesso.findUnique({
    where: { tokenHash: hash },
  });

  if (!convite) {
    void createAuditLog({
      acao: AUDIT_ACTIONS.INVITE_INVALID,
      entidade: "convite_acesso",
      descricao: "Token de convite não encontrado",
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  }

  if (convite.usadoEm) {
    return NextResponse.json(
      { error: "Este convite já foi utilizado" },
      { status: 410 },
    );
  }

  if (isInviteExpired(convite.expiresAt)) {
    void createAuditLog({
      empresaId: convite.empresaId,
      acao: AUDIT_ACTIONS.INVITE_EXPIRED,
      entidade: "convite_acesso",
      entidadeId: convite.id,
      descricao: `Convite expirado para colaboradorId: ${convite.colaboradorId}`,
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "Este convite expirou" },
      { status: 410 },
    );
  }

  // Busca dados do colaborador para exibir na página
  const colaborador = await prisma.colaborador.findUnique({
    where: { id: convite.colaboradorId },
    select: { id: true, nome: true, cargo: true, setor: true, matricula: true },
  });

  if (!colaborador) {
    return NextResponse.json(
      { error: "Colaborador não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    colaborador,
    loginSugerido: convite.loginSugerido,
    expiresAt: convite.expiresAt,
  });
}
