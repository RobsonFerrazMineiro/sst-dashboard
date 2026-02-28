import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const row = await prisma.tipoASO.findUnique({
    where: { id: params.id },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();

  const data: Prisma.TipoASOUpdateInput = {};

  if (body.nome !== undefined) {
    const nome = String(body.nome).trim();
    if (!nome) {
      return NextResponse.json(
        { error: "nome não pode ser vazio" },
        { status: 400 },
      );
    }
    data.nome = nome;
  }

  if (body.validadeMeses !== undefined) {
    const validadeMeses =
      body.validadeMeses === null ? null : Number(body.validadeMeses);

    if (validadeMeses !== null && Number.isNaN(validadeMeses)) {
      return NextResponse.json(
        { error: "validadeMeses inválido" },
        { status: 400 },
      );
    }

    data.validadeMeses = validadeMeses;
  }

  if (body.descricao !== undefined) {
    data.descricao =
      body.descricao === null ? null : String(body.descricao).trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.tipoASO.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  await prisma.tipoASO.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
