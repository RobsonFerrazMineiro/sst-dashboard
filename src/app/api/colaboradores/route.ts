import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await prisma.colaborador.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error("GET /api/colaboradores ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
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
