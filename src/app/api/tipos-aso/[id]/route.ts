import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const item = await prisma.tipoASO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });

    if (!item) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error("GET /api/tipos-aso/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();
    const body = await req.json();

    const data: {
      nome?: string;
      validadeMeses?: number | null;
      descricao?: string | null;
    } = {};

    if (body.nome !== undefined) {
      const nome = String(body.nome).trim();
      if (!nome) {
        return NextResponse.json({ error: "nome invalido" }, { status: 400 });
      }
      data.nome = nome;
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
      const d = String(body.descricao).trim();
      data.descricao = d ? d : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nada para atualizar" },
        { status: 400 },
      );
    }

    const exists = await prisma.tipoASO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    const updated = await prisma.tipoASO.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/tipos-aso/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const exists = await prisma.tipoASO.findFirst({
      where: { id, empresaId: auth.session.empresaId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }

    await prisma.tipoASO.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/tipos-aso/[id] ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
