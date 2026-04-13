import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();
    const item = await prisma.colaborador.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!item) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error("GET /api/colaboradores/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();
    const exists = await prisma.colaborador.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    const body = await req.json();

    const data: {
      nome?: string;
      setor?: string;
      cargo?: string;
      matricula?: string | null;
    } = {};

    if (body.nome !== undefined) {
      const v = String(body.nome).trim();
      if (!v) {
        return NextResponse.json({ error: "nome invalido" }, { status: 400 });
      }
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

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const exists = await prisma.colaborador.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

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
