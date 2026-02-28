import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const rows = await prisma.aSO.findMany({
    orderBy: [{ validade_aso: "desc" }, { data_aso: "desc" }],
  });

  return NextResponse.json(
    rows.map((a) => ({
      ...a,
      data_aso: a.data_aso?.toISOString?.() ?? a.data_aso,
      validade_aso: a.validade_aso ? a.validade_aso.toISOString() : null,
    })),
  );
}

export async function POST(req: Request) {
  const body = await req.json();

  const colaborador_id = body.colaborador_id
    ? String(body.colaborador_id)
    : null;
  const tipoASO_id = body.tipoASO_id ? String(body.tipoASO_id) : null;

  const data_aso = parseDateOrNull(body.data_aso);
  if (!data_aso) {
    return NextResponse.json(
      { error: "Campo obrigatório: data_aso (data válida)" },
      { status: 400 },
    );
  }

  // snapshot inicial (pode vir do body, mas se tiver colaborador_id, vamos sobrescrever)
  let colaborador_nome = String(body.colaborador_nome ?? "").trim();
  let setor = body.setor !== undefined ? String(body.setor).trim() : null;
  let cargo = body.cargo !== undefined ? String(body.cargo).trim() : null;

  // se veio colaborador_id, busca e preenche snapshot
  if (colaborador_id) {
    const colab = await prisma.colaborador.findUnique({
      where: { id: colaborador_id },
    });
    if (!colab) {
      return NextResponse.json(
        { error: "colaborador_id inválido" },
        { status: 400 },
      );
    }
    colaborador_nome = colab.nome;
    setor = colab.setor;
    cargo = colab.cargo;
  }

  if (!colaborador_nome) {
    return NextResponse.json(
      {
        error:
          "Campo obrigatório: colaborador_nome (ou informe colaborador_id válido)",
      },
      { status: 400 },
    );
  }

  // tipoASO cache
  let tipoASO_nome: string | null = body.tipoASO_nome
    ? String(body.tipoASO_nome).trim()
    : null;

  // validade
  let validade_aso = parseDateOrNull(body.validade_aso);

  if (tipoASO_id) {
    const tipo = await prisma.tipoASO.findUnique({ where: { id: tipoASO_id } });
    if (!tipo)
      return NextResponse.json(
        { error: "tipoASO_id inválido" },
        { status: 400 },
      );

    tipoASO_nome = tipo.nome;

    // se não veio validade_aso mas o tipo tem validadeMeses, calculamos
    if (!validade_aso && tipo.validadeMeses && tipo.validadeMeses > 0) {
      const d = new Date(data_aso);
      d.setMonth(d.getMonth() + tipo.validadeMeses);
      validade_aso = d;
    }
  }

  const clinica = body.clinica ? String(body.clinica).trim() : null;
  const observacao = body.observacao ? String(body.observacao).trim() : null;

  const data: Prisma.ASOUncheckedCreateInput = {
    colaborador_id,
    colaborador_nome,
    setor,
    cargo,
    tipoASO_id,
    tipoASO_nome,
    data_aso,
    validade_aso,
    clinica,
    observacao,
  };

  const created = await prisma.aSO.create({ data });
  return NextResponse.json(created, { status: 201 });
}
