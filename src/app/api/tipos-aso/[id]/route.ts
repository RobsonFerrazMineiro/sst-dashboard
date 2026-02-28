import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const item = await prisma.tipoASO.findUnique({
    where: { id: params.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();

  const data: {
    nome?: string;
    validadeMeses?: number | null;
    descricao?: string | null;
  } = {};

  if (body.nome !== undefined) {
    const nome = String(body.nome).trim();
    if (!nome) {
      return NextResponse.json({ error: "nome inválido" }, { status: 400 });
    }
    data.nome = nome;
  }

  if (body.validadeMeses !== undefined) {
    const n = Number(body.validadeMeses);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "validadeMeses inválido" },
        { status: 400 },
      );
    }
    data.validadeMeses = n;
  }

  if (body.descricao !== undefined) {
    const d = String(body.descricao).trim();
    data.descricao = d ? d : null;
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

export async function DELETE(_req: Request, { params }: Params) {
  await prisma.tipoASO.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
