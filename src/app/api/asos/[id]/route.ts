import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(_: Request, { params }: Params) {
  const row = await prisma.aSO.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();

  const data: Prisma.ASOUncheckedUpdateInput = {};

  // se trocar colaborador_id, atualiza snapshot automaticamente
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
      data.setor = colab.setor;
      data.cargo = colab.cargo;
    }
  }

  // permite editar snapshot manualmente também (se quiser)
  if (body.colaborador_nome !== undefined)
    data.colaborador_nome = String(body.colaborador_nome).trim();
  if (body.setor !== undefined)
    data.setor = body.setor ? String(body.setor).trim() : null;
  if (body.cargo !== undefined)
    data.cargo = body.cargo ? String(body.cargo).trim() : null;

  if (body.tipoASO_id !== undefined) {
    const tipoASO_id = body.tipoASO_id ? String(body.tipoASO_id) : null;
    data.tipoASO_id = tipoASO_id;

    if (tipoASO_id) {
      const tipo = await prisma.tipoASO.findUnique({
        where: { id: tipoASO_id },
      });
      if (!tipo)
        return NextResponse.json(
          { error: "tipoASO_id inválido" },
          { status: 400 },
        );
      data.tipoASO_nome = tipo.nome;
    } else {
      data.tipoASO_nome = null;
    }
  }

  if (body.tipoASO_nome !== undefined)
    data.tipoASO_nome = body.tipoASO_nome
      ? String(body.tipoASO_nome).trim()
      : null;

  if (body.data_aso !== undefined) {
    const d = parseDateOrNull(body.data_aso);
    if (!d)
      return NextResponse.json({ error: "data_aso inválida" }, { status: 400 });
    data.data_aso = d;
  }

  if (body.validade_aso !== undefined) {
    const d = parseDateOrNull(body.validade_aso);
    data.validade_aso = d;
  }

  if (body.clinica !== undefined)
    data.clinica = body.clinica ? String(body.clinica).trim() : null;
  if (body.observacao !== undefined)
    data.observacao = body.observacao ? String(body.observacao).trim() : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.aSO.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  await prisma.aSO.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
