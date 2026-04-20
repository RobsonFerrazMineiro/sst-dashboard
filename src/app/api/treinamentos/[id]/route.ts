import { prisma } from "@/lib/db";
import { formatNR } from "@/lib/nr";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const body = await req.json();
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const current = await prisma.treinamento.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!current) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    const data: Prisma.TreinamentoUncheckedUpdateInput = {};

    if (body.data_treinamento !== undefined) {
      const d = parseDateOrNull(body.data_treinamento);
      if (!d) {
        return NextResponse.json(
          { error: "data_treinamento invalida" },
          { status: 400 },
        );
      }
      data.data_treinamento = d;
    }

    if (body.validade !== undefined) {
      data.validade = parseDateOrNull(body.validade);
    }

    if (body.carga_horaria !== undefined) {
      data.carga_horaria =
        body.carga_horaria === null || body.carga_horaria === ""
          ? null
          : Math.trunc(Number(body.carga_horaria));

      if (data.carga_horaria !== null && Number.isNaN(data.carga_horaria)) {
        return NextResponse.json(
          { error: "carga_horaria invalida" },
          { status: 400 },
        );
      }
    }

    const tipoTreinamentoBodyValue =
      body.tipoTreinamentoId !== undefined
        ? body.tipoTreinamentoId
        : body.tipoTreinamento;

    if (tipoTreinamentoBodyValue !== undefined) {
      const tipoTreinamentoId = tipoTreinamentoBodyValue
        ? String(tipoTreinamentoBodyValue)
        : null;

      data.tipoTreinamentoId = tipoTreinamentoId;

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

        data.nr = tipo.nr;

        const baseDateValue =
          (typeof data.data_treinamento === "object" &&
          data.data_treinamento instanceof Date
            ? data.data_treinamento
            : null) ??
          current.data_treinamento;

        if (
          body.validade === undefined &&
          !data.validade &&
          baseDateValue &&
          tipo.validadeMeses &&
          tipo.validadeMeses > 0
        ) {
          const d = new Date(baseDateValue);
          d.setMonth(d.getMonth() + tipo.validadeMeses);
          data.validade = d;
        }
      } else {
        data.nr = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nada para atualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.treinamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeTreinamento(updated));
  } catch (err: unknown) {
    console.error("PATCH /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      {
        error: "Erro interno",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const auth = await getAuthenticatedUser(_req);
    if (!auth) return unauthorizedResponse();
    const exists = await prisma.treinamento.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    await prisma.treinamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      {
        error: "Erro interno",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
