import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const item = await prisma.colaborador.findUnique({ where: { id } });
    if (!item)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(item);
  } catch (err: any) {
    console.error("GET /api/colaboradores/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

// PATCH
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const body = await req.json();

    const data: {
      nome?: string;
      setor?: string;
      cargo?: string;
      matricula?: string | null;
    } = {};

    if (body.nome !== undefined) {
      const v = String(body.nome).trim();
      if (!v)
        return NextResponse.json({ error: "nome inválido" }, { status: 400 });
      data.nome = v;
    }

    if (body.setor !== undefined) data.setor = String(body.setor).trim();
    if (body.cargo !== undefined) data.cargo = String(body.cargo).trim();

    if (body.matricula !== undefined) {
      data.matricula = body.matricula ? String(body.matricula).trim() : null;
    }

    const updated = await prisma.colaborador.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/colaboradores/[id] ->", err);
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

    await prisma.colaborador.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/colaboradores/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 },
    );
  }
}
