import { prisma } from "@/lib/db";
import { NR, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNR(value: unknown): NR | null {
  if (!value) return null;
  const s = String(value).trim();
  const key = s.replace("-", "_") as keyof typeof NR;
  return NR[key] ?? null;
}

export async function GET(_: Request, { params }: Params) {
  const row = await prisma.treinamento.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();

  const data: Prisma.TreinamentoUncheckedUpdateInput = {};

  if (body.colaborador_id !== undefined) {
    const colaborador_id = body.colaborador_id
      ? String(body.colaborador_id)
      : null;
    data.colaborador_id = colaborador_id;

    if (colaborador_id) {
      const colab = await prisma.colaborador.findUnique({
        where: { id: colaborador_id },
      });
      if (!colab)
        return NextResponse.json(
          { error: "colaborador_id inválido" },
          { status: 400 },
        );
      data.colaborador_nome = colab.nome;
    }
  }

  if (body.colaborador_nome !== undefined)
    data.colaborador_nome = String(body.colaborador_nome).trim();

  if (body.tipoTreinamento !== undefined) {
    const tipoTreinamento = body.tipoTreinamento
      ? String(body.tipoTreinamento)
      : null;
    data.tipoTreinamento = tipoTreinamento;

    if (tipoTreinamento) {
      const tipo = await prisma.tipoTreinamento.findUnique({
        where: { id: tipoTreinamento },
      });
      if (!tipo)
        return NextResponse.json(
          { error: "tipoTreinamento inválido" },
          { status: 400 },
        );

      // inferir NR se não mandou
      if (body.nr === undefined) data.nr = parseNR(tipo.nr);

      // inferir validade se não mandou e tiver validadeMeses e já houver data_treinamento (ou se body trouxer)
      // (aqui deixamos simples: não recalcula automaticamente se já existir)
    } else {
      // removendo tipo
      // data.nr não precisa ser mexido
    }
  }

  if (body.nr !== undefined) data.nr = parseNR(body.nr);

  if (body.data_treinamento !== undefined) {
    const d = parseDateOrNull(body.data_treinamento);
    if (!d)
      return NextResponse.json(
        { error: "data_treinamento inválida" },
        { status: 400 },
      );
    data.data_treinamento = d;
  }

  if (body.validade !== undefined)
    data.validade = parseDateOrNull(body.validade);

  if (body.carga_horaria !== undefined) {
    const v = body.carga_horaria;
    data.carga_horaria = v === null || v === "" ? null : Math.trunc(Number(v));
    if (data.carga_horaria !== null && Number.isNaN(data.carga_horaria)) {
      return NextResponse.json(
        { error: "carga_horaria inválida" },
        { status: 400 },
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.treinamento.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  await prisma.treinamento.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
