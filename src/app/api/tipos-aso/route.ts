import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.tipoASO.findMany({
    orderBy: [{ nome: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();

  const nome = String(body.nome ?? "").trim();
  if (!nome) {
    return NextResponse.json({ error: "nome inválido" }, { status: 400 });
  }

  let validadeMeses: number | null = null;
  if (
    body.validadeMeses !== undefined &&
    body.validadeMeses !== null &&
    body.validadeMeses !== ""
  ) {
    const n = Number(body.validadeMeses);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "validadeMeses inválido" },
        { status: 400 },
      );
    }
    validadeMeses = n;
  }

  const descricaoRaw =
    body.descricao !== undefined ? String(body.descricao).trim() : "";
  const descricao = descricaoRaw ? descricaoRaw : null;

  const created = await prisma.tipoASO.create({
    data: { nome, validadeMeses, descricao },
  });

  return NextResponse.json(created, { status: 201 });
}
