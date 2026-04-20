import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const items = await prisma.tipoASO.findMany({
    where: { empresaId: auth.session.empresaId },
    orderBy: [{ nome: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const nome = String(body.nome ?? "").trim();
  if (!nome) {
    return NextResponse.json({ error: "nome invalido" }, { status: 400 });
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
        { error: "validadeMeses invalido" },
        { status: 400 },
      );
    }
    validadeMeses = n;
  }

  const descricaoRaw =
    body.descricao !== undefined ? String(body.descricao).trim() : "";
  const descricao = descricaoRaw ? descricaoRaw : null;

  const created = await prisma.tipoASO.create({
    data: {
      empresaId: auth.session.empresaId,
      nome,
      validadeMeses,
      descricao,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
