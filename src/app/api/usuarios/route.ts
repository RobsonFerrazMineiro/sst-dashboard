import {
  forbiddenResponse,
  getAuthenticatedUser,
  hashPassword,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessFromUser, hasRole } from "@/lib/permissions";
import { getPrimaryRole, USER_ROLE_ORDER } from "@/lib/user-management";
import { Prisma, StatusUsuario } from "@prisma/client";
import { NextResponse } from "next/server";

type UsuarioAdminPayload = Prisma.UsuarioGetPayload<{
  include: {
    usuarioPapeis: {
      include: {
        papel: true;
      };
    };
    colaborador: {
      select: { cargo: true; setor: true; matricula: true };
    };
  };
}>;

function serializeUsuario(user: UsuarioAdminPayload) {
  const papeis = user.usuarioPapeis.map((item) => item.papel);
  const papelPrincipal = getPrimaryRole(papeis);

  return {
    id: user.id,
    nome: user.nome,
    login: user.login,
    email: user.email,
    status: user.status,
    isAccountOwner: user.isAccountOwner,
    ultimoLoginAt: user.ultimoLoginAt,
    papel: papelPrincipal
      ? {
          id: papelPrincipal.id,
          codigo: papelPrincipal.codigo,
          nome: papelPrincipal.nome,
        }
      : null,
    colaborador: user.colaborador
      ? {
          cargo: user.colaborador.cargo,
          setor: user.colaborador.setor,
          matricula: user.colaborador.matricula,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: auth.session.empresaId },
    include: {
      usuarioPapeis: {
        include: {
          papel: true,
        },
      },
      colaborador: {
        select: { cargo: true, setor: true, matricula: true },
      },
    },
    orderBy: [{ isAccountOwner: "desc" }, { nome: "asc" }],
  });

  return NextResponse.json(usuarios.map(serializeUsuario));
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  const body = await req.json();

  const nome = String(body?.nome ?? "").trim();
  // "login" é o identificador principal (email ou matrícula).
  // Por compatibilidade, aceita "email" como fallback para fluxos legados.
  const loginRaw = String(body?.login ?? body?.email ?? "")
    .trim()
    .toLowerCase();
  const emailRaw = body?.email ? String(body.email).trim().toLowerCase() : null;
  const senha = String(body?.senha ?? "");
  const papelCodigo = String(body?.papelCodigo ?? "")
    .trim()
    .toUpperCase();
  const colaboradorId = body?.colaboradorId
    ? String(body.colaboradorId).trim()
    : null;

  if (!nome || !loginRaw || !senha || !papelCodigo) {
    return NextResponse.json(
      {
        error:
          "Campos obrigatorios: nome, login (ou email), senha, papelCodigo",
      },
      { status: 400 },
    );
  }

  if (senha.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres" },
      { status: 400 },
    );
  }

  if (
    !USER_ROLE_ORDER.includes(papelCodigo as (typeof USER_ROLE_ORDER)[number])
  ) {
    return NextResponse.json(
      { error: "papelCodigo invalido" },
      { status: 400 },
    );
  }

  // login único por empresa
  const loginExistente = await prisma.usuario.findFirst({
    where: { empresaId: auth.session.empresaId, login: loginRaw },
  });
  if (loginExistente) {
    return NextResponse.json(
      { error: "Ja existe usuario com este login na empresa" },
      { status: 409 },
    );
  }

  // email único por empresa (se fornecido)
  if (emailRaw) {
    const emailExistente = await prisma.usuario.findFirst({
      where: { empresaId: auth.session.empresaId, email: emailRaw },
    });
    if (emailExistente) {
      return NextResponse.json(
        { error: "Ja existe usuario com este email na empresa" },
        { status: 409 },
      );
    }
  }

  const papel = await prisma.papel.findFirst({
    where: { empresaId: auth.session.empresaId, codigo: papelCodigo },
  });
  if (!papel) {
    return NextResponse.json(
      { error: "Papel nao encontrado" },
      { status: 404 },
    );
  }

  // Valida colaboradorId se fornecido
  if (colaboradorId) {
    const colaborador = await prisma.colaborador.findFirst({
      where: { id: colaboradorId, empresaId: auth.session.empresaId },
    });
    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador nao encontrado" },
        { status: 404 },
      );
    }
    // Garante que o colaborador ainda não tem usuario vinculado
    const vinculoExistente = await prisma.usuario.findFirst({
      where: { colaboradorId },
    });
    if (vinculoExistente) {
      return NextResponse.json(
        { error: "Este colaborador ja possui usuario vinculado" },
        { status: 409 },
      );
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        empresaId: auth.session.empresaId,
        nome,
        login: loginRaw,
        email: emailRaw ?? undefined,
        senhaHash: await hashPassword(senha),
        // Colaboradores iniciam INATIVO; demais perfis ATIVO por padrão
        status:
          papelCodigo === "COLABORADOR"
            ? StatusUsuario.INATIVO
            : StatusUsuario.ATIVO,
        isAccountOwner: false,
        colaboradorId: colaboradorId ?? undefined,
      },
      include: {
        usuarioPapeis: {
          include: { papel: true },
        },
      },
    });

    await tx.usuarioPapel.create({
      data: { usuarioId: usuario.id, papelId: papel.id },
    });

    return tx.usuario.findFirstOrThrow({
      where: { id: usuario.id },
      include: {
        usuarioPapeis: {
          include: { papel: true },
        },
        colaborador: {
          select: { cargo: true, setor: true, matricula: true },
        },
      },
    });
  });

  return NextResponse.json(serializeUsuario(created), { status: 201 });
}
