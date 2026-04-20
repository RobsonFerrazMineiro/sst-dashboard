import { formatNR, parseNRInput } from "@/lib/nr";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

function serializeTipoTreinamento(
  item: Awaited<ReturnType<typeof prisma.tipoTreinamento.findFirstOrThrow>>,
) {
  return {
    ...item,
    nr: formatNR(item.nr),
  };
}

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const items = await prisma.tipoTreinamento.findMany({
    where: { empresaId: auth.session.empresaId },
    orderBy: [{ nr: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(items.map(serializeTipoTreinamento));
}

export async function POST(req: Request) {
  const body = await req.json();
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();
  const nome = String(body?.nome ?? "").trim();
  const nr = parseNRInput(body?.nr);
  const validadeMesesRaw = body?.validadeMeses;
  const descricaoRaw = body?.descricao;

  if (!nome) {
    return NextResponse.json({ error: "nome e obrigatorio" }, { status: 400 });
  }
  if (!nr) {
    return NextResponse.json({ error: "nr e obrigatorio" }, { status: 400 });
  }

  const data: {
    empresaId: string;
    nome: string;
    nr: NonNullable<ReturnType<typeof parseNRInput>>;
    validadeMeses?: number | null;
    descricao?: string | null;
  } = { empresaId: auth.session.empresaId, nome, nr };

  if (validadeMesesRaw !== undefined) {
    const n = Number(validadeMesesRaw);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "validadeMeses invalido" },
        { status: 400 },
      );
    }
    data.validadeMeses = n;
  }

  if (descricaoRaw !== undefined) {
    const d = String(descricaoRaw).trim();
    data.descricao = d ? d : null;
  }

  const created = await prisma.tipoTreinamento.create({ data });
  return NextResponse.json(serializeTipoTreinamento(created), { status: 201 });
}
