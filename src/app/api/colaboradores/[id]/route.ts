import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const row = await prisma.colaborador.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();

  const data: Prisma.ColaboradorUpdateInput = {};
  if (body.nome !== undefined) data.nome = String(body.nome).trim();
  if (body.setor !== undefined) data.setor = String(body.setor).trim();
  if (body.cargo !== undefined) data.cargo = String(body.cargo).trim();
  if (body.matricula !== undefined) {
    data.matricula = body.matricula ? String(body.matricula).trim() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.colaborador.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  await prisma.colaborador.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
