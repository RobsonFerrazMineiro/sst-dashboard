import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const items = await prisma.colaborador.findMany({
      where: { empresaId: auth.session.empresaId },
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
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const nome = String(body.nome ?? "").trim();
  const setor = String(body.setor ?? "").trim();
  const cargo = String(body.cargo ?? "").trim();
  const matriculaRaw = body.matricula ?? null;
  const matricula = matriculaRaw ? String(matriculaRaw).trim() : null;

  if (!nome || !setor || !cargo) {
    return NextResponse.json(
      { error: "Campos obrigatorios: nome, setor, cargo" },
      { status: 400 },
    );
  }

  const created = await prisma.colaborador.create({
    data: {
      empresaId: auth.session.empresaId,
      nome,
      setor,
      cargo,
      matricula,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
