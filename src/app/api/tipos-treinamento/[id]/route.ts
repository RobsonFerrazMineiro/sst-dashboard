import { formatNR, parseNRInput } from "@/lib/nr";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function serializeTipoTreinamento(
  item: Awaited<ReturnType<typeof prisma.tipoTreinamento.findFirstOrThrow>>,
) {
  return {
    ...item,
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

    const data: {
      nome?: string;
      nr?: NonNullable<ReturnType<typeof parseNRInput>>;
      validadeMeses?: number | null;
      descricao?: string | null;
    } = {};

    if (body.nome !== undefined) {
      const v = String(body.nome).trim();
      if (!v) {
        return NextResponse.json({ error: "nome invalido" }, { status: 400 });
      }
      data.nome = v;
    }

    if (body.nr !== undefined) {
      const nr = parseNRInput(body.nr);
      if (!nr) {
        return NextResponse.json({ error: "nr invalido" }, { status: 400 });
      }
      data.nr = nr;
    }

    if (body.validadeMeses !== undefined) {
      if (body.validadeMeses === null || body.validadeMeses === "") {
        data.validadeMeses = null;
      } else {
        const n = Number(body.validadeMeses);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json(
            { error: "validadeMeses invalido" },
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

    const exists = await prisma.tipoTreinamento.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    const updated = await prisma.tipoTreinamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeTipoTreinamento(updated));
  } catch (err: any) {
    console.error("PATCH /api/tipos-treinamento/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();
    const exists = await prisma.tipoTreinamento.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
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
