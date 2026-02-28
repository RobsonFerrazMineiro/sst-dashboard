import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.tipoASO.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const nome = String(body.nome ?? "").trim();
  if (!nome) {
    return NextResponse.json(
      { error: "Campo obrigatório: nome" },
      { status: 400 },
    );
  }

  const validadeMeses =
    body.validadeMeses !== undefined && body.validadeMeses !== null
      ? Number(body.validadeMeses)
      : null;

  if (validadeMeses !== null && Number.isNaN(validadeMeses)) {
    return NextResponse.json(
      { error: "validadeMeses inválido" },
      { status: 400 },
    );
  }

  const descricao =
    body.descricao !== undefined && body.descricao !== null
      ? String(body.descricao).trim()
      : null;

  const data: Prisma.TipoASOCreateInput = {
    nome,
    validadeMeses,
    descricao,
  };

  const created = await prisma.tipoASO.create({ data });

  return NextResponse.json(created, { status: 201 });
}
