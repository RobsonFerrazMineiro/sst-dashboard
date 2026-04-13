import { prisma } from "@/lib/db";
import { formatNR, parseNRInput } from "@/lib/nr";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function serializeTreinamento(
  item: Awaited<ReturnType<typeof prisma.treinamento.findFirstOrThrow>>,
) {
  return {
    ...item,
    colaborador_id: item.colaboradorId,
    tipoTreinamento: item.tipoTreinamentoId,
    nr: formatNR(item.nr),
  };
}

export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId");

  const itens = await prisma.treinamento.findMany({
    where: {
      empresaId: auth.session.empresaId,
      ...(colaboradorId ? { colaboradorId } : {}),
    },
    orderBy: { data_treinamento: "desc" },
  });

  return NextResponse.json(itens.map(serializeTreinamento));
}

export async function POST(req: Request) {
  const body = await req.json();
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const colaboradorId = body.colaboradorId
    ? String(body.colaboradorId)
    : body.colaborador_id
      ? String(body.colaborador_id)
      : null;

  const tipoTreinamentoId = body.tipoTreinamentoId
    ? String(body.tipoTreinamentoId)
    : body.tipoTreinamento
      ? String(body.tipoTreinamento)
      : null;

  const data_treinamento = parseDateOrNull(body.data_treinamento);
  if (!data_treinamento) {
    return NextResponse.json(
      { error: "Campo obrigatorio: data_treinamento (data valida)" },
      { status: 400 },
    );
  }

  let colaborador_nome = String(body.colaborador_nome ?? "").trim();

  if (colaboradorId) {
    const colab = await prisma.colaborador.findFirst({
      where: { id: colaboradorId, empresaId: auth.session.empresaId },
    });
    if (!colab) {
      return NextResponse.json(
        { error: "colaborador_id invalido" },
        { status: 400 },
      );
    }
    colaborador_nome = colab.nome;
  }

  if (!colaborador_nome) {
    return NextResponse.json(
      {
        error:
          "Campo obrigatorio: colaborador_nome (ou informe colaborador_id valido)",
      },
      { status: 400 },
    );
  }

  let validade = parseDateOrNull(body.validade);
  let nr = parseNRInput(body.nr);

  if (tipoTreinamentoId) {
    const tipo = await prisma.tipoTreinamento.findFirst({
      where: { id: tipoTreinamentoId, empresaId: auth.session.empresaId },
    });
    if (!tipo) {
      return NextResponse.json(
        { error: "tipoTreinamento invalido" },
        { status: 400 },
      );
    }

    if (!nr) nr = tipo.nr;

    if (!validade && tipo.validadeMeses && tipo.validadeMeses > 0) {
      const d = new Date(data_treinamento);
      d.setMonth(d.getMonth() + tipo.validadeMeses);
      validade = d;
    }
  }

  const carga_horaria =
    body.carga_horaria === undefined ||
    body.carga_horaria === null ||
    body.carga_horaria === ""
      ? null
      : Math.trunc(Number(body.carga_horaria));

  if (carga_horaria !== null && Number.isNaN(carga_horaria)) {
    return NextResponse.json(
      { error: "carga_horaria invalida" },
      { status: 400 },
    );
  }

  const data: Prisma.TreinamentoUncheckedCreateInput = {
    empresaId: auth.session.empresaId,
    colaboradorId,
    colaborador_nome,
    tipoTreinamentoId,
    nr,
    data_treinamento,
    validade,
    carga_horaria,
  };

  const created = await prisma.treinamento.create({ data });
  return NextResponse.json(serializeTreinamento(created), { status: 201 });
}
