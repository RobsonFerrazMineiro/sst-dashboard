import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.tipoASO.findMany({
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();

  const nome = String(body?.nome ?? "").trim();
  const validadeMesesRaw = body?.validadeMeses;
  const descricaoRaw = body?.descricao;

  if (!nome) {
    return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });
  }

  const data: {
    nome: string;
    validadeMeses?: number | null;
    descricao?: string | null;
  } = { nome };

  if (validadeMesesRaw !== undefined) {
    const n = Number(validadeMesesRaw);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "validadeMeses inválido" },
        { status: 400 },
      );
    }
    data.validadeMeses = n;
  }

  if (descricaoRaw !== undefined) {
    const d = String(descricaoRaw).trim();
    data.descricao = d ? d : null;
  }

  const created = await prisma.tipoASO.create({ data });
  return NextResponse.json(created, { status: 201 });
}
