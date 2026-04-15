import { hashPassword } from "@/lib/auth";
import {
  forbiddenResponse,
  getAuthenticatedUser,
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
  };
}>;

function serializeUsuario(
  user: UsuarioAdminPayload,
) {
  const papeis = user.usuarioPapeis.map((item) => item.papel);
  const papelPrincipal = getPrimaryRole(papeis);

  return {
    id: user.id,
    nome: user.nome,
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
  const email = String(body?.email ?? "").trim().toLowerCase();
  const senha = String(body?.senha ?? "");
  const papelCodigo = String(body?.papelCodigo ?? "").trim().toUpperCase();

  if (!nome || !email || !senha || !papelCodigo) {
    return NextResponse.json(
      { error: "Campos obrigatorios: nome, email, senha, papelCodigo" },
      { status: 400 },
    );
  }

  if (senha.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres" },
      { status: 400 },
    );
  }

  if (!USER_ROLE_ORDER.includes(papelCodigo as (typeof USER_ROLE_ORDER)[number])) {
    return NextResponse.json({ error: "papelCodigo invalido" }, { status: 400 });
  }

  const emailExistente = await prisma.usuario.findFirst({
    where: {
      empresaId: auth.session.empresaId,
      email,
    },
  });

  if (emailExistente) {
    return NextResponse.json(
      { error: "Ja existe usuario com este email na empresa" },
      { status: 409 },
    );
  }

  const papel = await prisma.papel.findFirst({
    where: {
      empresaId: auth.session.empresaId,
      codigo: papelCodigo,
    },
  });

  if (!papel) {
    return NextResponse.json({ error: "Papel nao encontrado" }, { status: 404 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        empresaId: auth.session.empresaId,
        nome,
        email,
        senhaHash: await hashPassword(senha),
        status: StatusUsuario.ATIVO,
        isAccountOwner: false,
      },
      include: {
        usuarioPapeis: {
          include: {
            papel: true,
          },
        },
      },
    });

    await tx.usuarioPapel.create({
      data: {
        usuarioId: usuario.id,
        papelId: papel.id,
      },
    });

    return tx.usuario.findFirstOrThrow({
      where: { id: usuario.id },
      include: {
        usuarioPapeis: {
          include: {
            papel: true,
          },
        },
      },
    });
  });

  return NextResponse.json(serializeUsuario(created), { status: 201 });
}
