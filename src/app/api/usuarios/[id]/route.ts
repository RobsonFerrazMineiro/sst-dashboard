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

type Ctx = { params: Promise<{ id: string }> };

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
  const papelPrincipal = getPrimaryRole(
    user.usuarioPapeis.map((item) => item.papel),
  );

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

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasRole(access, "ADMIN")) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const body = await req.json();

  const target = await prisma.usuario.findFirst({
    where: {
      id,
      empresaId: auth.session.empresaId,
    },
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
  });

  if (!target) {
    return NextResponse.json(
      { error: "Usuario nao encontrado" },
      { status: 404 },
    );
  }

  const data: {
    nome?: string;
    login?: string;
    email?: string | null;
    status?: StatusUsuario;
  } = {};

  if (body.nome !== undefined) {
    const nome = String(body.nome).trim();
    if (!nome) {
      return NextResponse.json({ error: "nome invalido" }, { status: 400 });
    }
    data.nome = nome;
  }

  if (body.login !== undefined) {
    const login = String(body.login).trim().toLowerCase();
    if (!login) {
      return NextResponse.json({ error: "login invalido" }, { status: 400 });
    }
    const loginExistente = await prisma.usuario.findFirst({
      where: {
        empresaId: auth.session.empresaId,
        login,
        id: { not: target.id },
      },
    });
    if (loginExistente) {
      return NextResponse.json(
        { error: "Ja existe usuario com este login na empresa" },
        { status: 409 },
      );
    }
    data.login = login;
  }

  if (body.email !== undefined) {
    // email pode ser limpo (null) ou atualizado
    const emailValue =
      body.email === null
        ? null
        : String(body.email).trim().toLowerCase() || null;

    if (emailValue) {
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          empresaId: auth.session.empresaId,
          email: emailValue,
          id: { not: target.id },
        },
      });
      if (emailExistente) {
        return NextResponse.json(
          { error: "Ja existe usuario com este email na empresa" },
          { status: 409 },
        );
      }
    }

    data.email = emailValue;
  }

  let nextStatus: StatusUsuario | undefined;
  if (body.status !== undefined) {
    const status = String(body.status).trim().toUpperCase();
    if (!["ATIVO", "INATIVO"].includes(status)) {
      return NextResponse.json({ error: "status invalido" }, { status: 400 });
    }
    nextStatus = status as StatusUsuario;

    if (target.isAccountOwner && nextStatus !== StatusUsuario.ATIVO) {
      return NextResponse.json(
        { error: "O proprietario da conta deve permanecer ativo" },
        { status: 403 },
      );
    }

    data.status = nextStatus;
  }

  let nextPapel = getPrimaryRole(
    target.usuarioPapeis.map((item) => item.papel),
  );
  if (body.papelCodigo !== undefined) {
    const papelCodigo = String(body.papelCodigo).trim().toUpperCase();
    if (
      !USER_ROLE_ORDER.includes(papelCodigo as (typeof USER_ROLE_ORDER)[number])
    ) {
      return NextResponse.json(
        { error: "papelCodigo invalido" },
        { status: 400 },
      );
    }

    if (target.isAccountOwner && papelCodigo !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Nao e permitido remover privilegios do proprietario da conta",
        },
        { status: 403 },
      );
    }

    const papel = await prisma.papel.findFirst({
      where: {
        empresaId: auth.session.empresaId,
        codigo: papelCodigo,
      },
    });

    if (!papel) {
      return NextResponse.json(
        { error: "Papel nao encontrado" },
        { status: 404 },
      );
    }

    nextPapel = papel;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.usuario.update({
        where: { id: target.id },
        data,
      });
    }

    if (body.papelCodigo !== undefined && nextPapel) {
      await tx.usuarioPapel.deleteMany({
        where: { usuarioId: target.id },
      });

      await tx.usuarioPapel.create({
        data: {
          usuarioId: target.id,
          papelId: nextPapel.id,
        },
      });
    }

    return tx.usuario.findFirstOrThrow({
      where: { id: target.id },
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
    });
  });

  return NextResponse.json(serializeUsuario(updated));
}
