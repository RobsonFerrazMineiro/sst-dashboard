import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.colaborador.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const nome = String(body.nome ?? "").trim();
  const setor = String(body.setor ?? "").trim();
  const cargo = String(body.cargo ?? "").trim();
  const matriculaRaw = body.matricula ?? null;
  const matricula = matriculaRaw ? String(matriculaRaw).trim() : null;

  if (!nome || !setor || !cargo) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome, setor, cargo" },
      { status: 400 },
    );
  }

  const created = await prisma.colaborador.create({
    data: { nome, setor, cargo, matricula },
  });

  return NextResponse.json(created, { status: 201 });
}
