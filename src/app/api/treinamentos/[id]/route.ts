import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

// PATCH
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const body = await req.json();

    const data: {
      data_treinamento?: Date;
      validade?: Date | null;
      carga_horaria?: number | null;
    } = {};

    if (body.data_treinamento !== undefined) {
      data.data_treinamento = new Date(body.data_treinamento);
    }

    if (body.validade !== undefined) {
      data.validade = body.validade ? new Date(body.validade) : null;
    }

    if (body.carga_horaria !== undefined) {
      data.carga_horaria =
        body.carga_horaria !== null ? Number(body.carga_horaria) : null;
    }

    const updated = await prisma.treinamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}

// DELETE
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;

    await prisma.treinamento.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}
