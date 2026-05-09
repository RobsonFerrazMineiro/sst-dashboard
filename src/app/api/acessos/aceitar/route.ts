import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken, isInviteExpired } from "@/lib/invite-token";
import { StatusUsuario } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ip, userAgent } = extractRequestMeta(req);

  const body = await req.json().catch(() => ({}));
  const token = body?.token ? String(body.token).trim() : null;
  const login = body?.login ? String(body.login).trim().toLowerCase() : null;
  const senha = body?.senha ? String(body.senha) : null;

  // Validações básicas de input
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }
  if (!login) {
    return NextResponse.json({ error: "Login é obrigatório" }, { status: 400 });
  }
  if (!senha || senha.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres" },
      { status: 400 },
    );
  }

  const hash = hashToken(token);

  const convite = await prisma.conviteAcesso.findUnique({
    where: { tokenHash: hash },
  });

  if (!convite) {
    void createAuditLog({
      acao: AUDIT_ACTIONS.INVITE_INVALID,
      entidade: "convite_acesso",
      descricao: "Tentativa de aceitar convite com token inexistente",
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
      descricao: "Tentativa de aceitar convite expirado",
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "Este convite expirou" },
      { status: 410 },
    );
  }

  // Valida colaborador e garante que ainda não tem usuário
  const colaborador = await prisma.colaborador.findFirst({
    where: { id: convite.colaboradorId, empresaId: convite.empresaId },
    include: { usuario: { select: { id: true } } },
  });

  if (!colaborador) {
    return NextResponse.json(
      { error: "Colaborador não encontrado" },
      { status: 404 },
    );
  }
  if (colaborador.usuario) {
    return NextResponse.json(
      { error: "Este colaborador já possui acesso" },
      { status: 409 },
    );
  }

  // Verifica se o login já está em uso na empresa
  const loginExistente = await prisma.usuario.findFirst({
    where: { empresaId: convite.empresaId, login },
  });
  if (loginExistente) {
    return NextResponse.json(
      { error: "Este login já está em uso. Escolha outro." },
      { status: 409 },
    );
  }

  // Busca o papel COLABORADOR da empresa
  const papelColaborador = await prisma.papel.findFirst({
    where: { empresaId: convite.empresaId, codigo: "COLABORADOR" },
  });
  if (!papelColaborador) {
    return NextResponse.json(
      { error: "Configuração de perfil ausente. Contate o administrador." },
      { status: 500 },
    );
  }

  // Tudo validado — cria o usuário e invalida o convite em uma transação
  const usuario = await prisma.$transaction(async (tx) => {
    const novoUsuario = await tx.usuario.create({
      data: {
        empresaId: convite.empresaId,
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        login,
        senhaHash: await hashPassword(senha),
        status: StatusUsuario.ATIVO,
        isAccountOwner: false,
      },
    });

    await tx.usuarioPapel.create({
      data: { usuarioId: novoUsuario.id, papelId: papelColaborador.id },
    });

    await tx.conviteAcesso.update({
      where: { id: convite.id },
      data: { usadoEm: new Date() },
    });

    return novoUsuario;
  });

  void createAuditLog({
    empresaId: convite.empresaId,
    usuarioId: usuario.id,
    acao: AUDIT_ACTIONS.INVITE_USED,
    entidade: "convite_acesso",
    entidadeId: convite.id,
    descricao: `Convite aceito por ${colaborador.nome} (login: ${login})`,
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, login }, { status: 201 });
}
