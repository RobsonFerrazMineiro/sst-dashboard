import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { setAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ip, userAgent } = extractRequestMeta(req);

  try {
    const body = await req.json();

    // Aceita "login" (matrícula ou e-mail) ou "email" para compatibilidade retroativa
    const loginInput = String(body?.login ?? body?.email ?? "")
      .trim()
      .toLowerCase();
    const senha = String(body?.senha ?? "");

    if (!loginInput || !senha) {
      return NextResponse.json(
        { error: "Login e senha são obrigatórios" },
        { status: 400 },
      );
    }

    const user = await prisma.usuario.findFirst({
      where: {
        login: loginInput,
        status: "ATIVO",
        empresa: { status: "ATIVA" },
      },
      include: {
        usuarioPapeis: {
          include: {
            papel: true,
          },
        },
      },
    });

    if (!user) {
      void createAuditLog({
        acao: AUDIT_ACTIONS.LOGIN_FAILED,
        entidade: "usuario",
        descricao: `Tentativa de login inválida para o login: ${loginInput}`,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const senhaOk = await verifyPassword(senha, user.senhaHash);
    if (!senhaOk) {
      void createAuditLog({
        acao: AUDIT_ACTIONS.LOGIN_FAILED,
        empresaId: user.empresaId,
        usuarioId: user.id,
        entidade: "usuario",
        entidadeId: user.id,
        descricao: `Senha incorreta para o login: ${loginInput}`,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoLoginAt: new Date() },
    });

    void createAuditLog({
      empresaId: user.empresaId,
      usuarioId: user.id,
      acao: AUDIT_ACTIONS.LOGIN_SUCCESS,
      entidade: "usuario",
      entidadeId: user.id,
      descricao: `Login realizado: ${user.nome}`,
      ip,
      userAgent,
    });

    const token = await signAuthToken({
      userId: user.id,
      empresaId: user.empresaId,
      roles: user.usuarioPapeis.map((item) => item.papel.codigo),
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        login: user.login,
        empresaId: user.empresaId,
        roles: user.usuarioPapeis.map((item) => item.papel.codigo),
      },
    });

    return setAuthCookie(response, token);
  } catch (err: any) {
    console.error("POST /api/auth/login ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
