import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.tipoTreinamento.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const nome = String(body.nome ?? "").trim();
  const nr = String(body.nr ?? "").trim();

  if (!nome || !nr) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome e nr" },
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

  const data: Prisma.TipoTreinamentoCreateInput = {
    nome,
    nr,
    validadeMeses,
    descricao,
  };

  const created = await prisma.tipoTreinamento.create({ data });

  return NextResponse.json(created, { status: 201 });
}
