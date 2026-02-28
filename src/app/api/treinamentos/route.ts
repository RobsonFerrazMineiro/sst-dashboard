import { prisma } from "@/lib/db";
import { NR, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNR(value: unknown): NR | null {
  if (!value) return null;
  const s = String(value).trim(); // ex: "NR-35"
  const key = s.replace("-", "_") as keyof typeof NR; // "NR_35"
  return NR[key] ?? null;
}

export async function GET() {
  const rows = await prisma.treinamento.findMany({
    orderBy: [{ validade: "desc" }, { data_treinamento: "desc" }],
  });

  return NextResponse.json(
    rows.map((t) => ({
      ...t,
      data_treinamento: t.data_treinamento.toISOString(),
      validade: t.validade ? t.validade.toISOString() : null,
      // opcional: devolver string "NR-35" pro legado
      nr: t.nr ? String(t.nr).replace("_", "-") : null,
    })),
  );
}

export async function POST(req: Request) {
  const body = await req.json();

  const colaborador_id = body.colaborador_id
    ? String(body.colaborador_id)
    : null;
  const tipoTreinamento = body.tipoTreinamento
    ? String(body.tipoTreinamento)
    : null;

  const data_treinamento = parseDateOrNull(body.data_treinamento);
  if (!data_treinamento) {
    return NextResponse.json(
      { error: "Campo obrigatório: data_treinamento (data válida)" },
      { status: 400 },
    );
  }

  let colaborador_nome = String(body.colaborador_nome ?? "").trim();

  // snapshot automático do colaborador
  if (colaborador_id) {
    const colab = await prisma.colaborador.findUnique({
      where: { id: colaborador_id },
    });
    if (!colab)
      return NextResponse.json(
        { error: "colaborador_id inválido" },
        { status: 400 },
      );
    colaborador_nome = colab.nome;
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

  // validade
  let validade = parseDateOrNull(body.validade);

  // nr legado (enum)
  let nr = parseNR(body.nr);

  // se tiver tipoTreinamento, podemos inferir nr (e validade se quiser)
  if (tipoTreinamento) {
    const tipo = await prisma.tipoTreinamento.findUnique({
      where: { id: tipoTreinamento },
    });
    if (!tipo)
      return NextResponse.json(
        { error: "tipoTreinamento inválido" },
        { status: 400 },
      );

    // se não veio nr, tenta inferir do tipo.nr (string "NR-35")
    if (!nr) nr = parseNR(tipo.nr);

    // se não veio validade e o tipo tem validadeMeses, calcula
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
      { error: "carga_horaria inválida" },
      { status: 400 },
    );
  }

  const data: Prisma.TreinamentoUncheckedCreateInput = {
    colaborador_id,
    colaborador_nome,
    tipoTreinamento,
    nr,
    data_treinamento,
    validade,
    carga_horaria,
  };

  const created = await prisma.treinamento.create({ data });
  return NextResponse.json(created, { status: 201 });
}
