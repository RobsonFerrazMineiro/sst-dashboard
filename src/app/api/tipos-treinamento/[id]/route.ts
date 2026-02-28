import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const body = await req.json();

    const data: {
      nome?: string;
      nr?: string;
      validadeMeses?: number | null;
      descricao?: string | null;
    } = {};

    if (body.nome !== undefined) {
      const v = String(body.nome).trim();
      if (!v)
        return NextResponse.json({ error: "nome inválido" }, { status: 400 });
      data.nome = v;
    }

    if (body.nr !== undefined) {
      const v = String(body.nr).trim();
      if (!v)
        return NextResponse.json({ error: "nr inválido" }, { status: 400 });
      data.nr = v;
    }

    if (body.validadeMeses !== undefined) {
      if (body.validadeMeses === null || body.validadeMeses === "") {
        data.validadeMeses = null;
      } else {
        const n = Number(body.validadeMeses);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json(
            { error: "validadeMeses inválido" },
            { status: 400 },
          );
        }
        data.validadeMeses = n;
      }
    }

    if (body.descricao !== undefined) {
      const v = String(body.descricao).trim();
      data.descricao = v ? v : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nada para atualizar" },
        { status: 400 },
      );
    }

    const exists = await prisma.tipoTreinamento.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const updated = await prisma.tipoTreinamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/tipos-treinamento/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const exists = await prisma.tipoTreinamento.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.tipoTreinamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/tipos-treinamento/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
