import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { parseLocalDate } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  return parseLocalDate(String(value));
}

function serializeASO(item: Awaited<ReturnType<typeof prisma.aSO.findFirstOrThrow>>) {
  return {
    ...item,
    colaborador_id: item.colaboradorId,
    tipoASO_id: item.tipoASOId,
  };
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const row = await prisma.aSO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!row) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeASO(row));
  } catch (err: any) {
    console.error("GET /api/asos/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const exists = await prisma.aSO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    const data: Prisma.ASOUncheckedUpdateInput = {};

    const colaboradorBodyValue =
      body.colaboradorId !== undefined
        ? body.colaboradorId
        : body.colaborador_id;

    if (colaboradorBodyValue !== undefined) {
      const colaboradorId = colaboradorBodyValue
        ? String(colaboradorBodyValue)
        : null;

      data.colaboradorId = colaboradorId;

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

        data.colaborador_nome = colab.nome;
        data.setor = colab.setor;
        data.cargo = colab.cargo;
      } else {
        data.colaborador_nome = exists.colaborador_nome;
        data.setor = null;
        data.cargo = null;
      }
    }

    if (body.colaborador_nome !== undefined) {
      data.colaborador_nome = String(body.colaborador_nome).trim();
    }

    if (body.setor !== undefined) {
      data.setor = body.setor ? String(body.setor).trim() : null;
    }

    if (body.cargo !== undefined) {
      data.cargo = body.cargo ? String(body.cargo).trim() : null;
    }

    const tipoASOBodyValue =
      body.tipoASOId !== undefined ? body.tipoASOId : body.tipoASO_id;

    if (tipoASOBodyValue !== undefined) {
      const tipoASOId = tipoASOBodyValue ? String(tipoASOBodyValue) : null;
      data.tipoASOId = tipoASOId;

      if (tipoASOId) {
        const tipo = await prisma.tipoASO.findFirst({
          where: { id: tipoASOId, empresaId: auth.session.empresaId },
        });

        if (!tipo) {
          return NextResponse.json(
            { error: "tipoASO_id invalido" },
            { status: 400 },
          );
        }

        data.tipoASO_nome = tipo.nome;
      } else {
        data.tipoASO_nome = null;
      }
    }

    if (body.tipoASO_nome !== undefined) {
      data.tipoASO_nome = body.tipoASO_nome
        ? String(body.tipoASO_nome).trim()
        : null;
    }

    if (body.data_aso !== undefined) {
      const d = parseDateOrNull(body.data_aso);
      if (!d) {
        return NextResponse.json(
          { error: "data_aso invalida" },
          { status: 400 },
        );
      }
      data.data_aso = d;
    }

    if (body.validade_aso !== undefined) {
      data.validade_aso = parseDateOrNull(body.validade_aso);
    }

    if (body.clinica !== undefined) {
      data.clinica = body.clinica ? String(body.clinica).trim() : null;
    }

    if (body.observacao !== undefined) {
      data.observacao = body.observacao ? String(body.observacao).trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nada para atualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.aSO.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeASO(updated));
  } catch (err: any) {
    console.error("PATCH /api/asos/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const exists = await prisma.aSO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    await prisma.aSO.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/asos/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}
