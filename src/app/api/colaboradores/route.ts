import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import {
  forbiddenResponse,
  getAuthenticatedUser,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessFromUser, hasPermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const access = getAccessFromUser(auth.user);
    // Qualquer um que possa visualizar ou gerenciar colaboradores pode listar
    if (
      !hasPermission(access, "colaboradores.visualizar") &&
      !hasPermission(access, "colaboradores.gerenciar")
    ) {
      return forbiddenResponse();
    }

    const items = await prisma.colaborador.findMany({
      where: { empresaId: auth.session.empresaId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("GET /api/colaboradores ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { ip, userAgent } = extractRequestMeta(req);
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const access = getAccessFromUser(auth.user);
  if (!hasPermission(access, "colaboradores.gerenciar")) {
    return forbiddenResponse();
  }

  const body = await req.json();

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

  void createAuditLog({
    empresaId: auth.session.empresaId,
    usuarioId: auth.session.userId,
    acao: AUDIT_ACTIONS.COLABORADOR_CREATED,
    entidade: "colaborador",
    entidadeId: created.id,
    descricao: `Colaborador criado: ${nome} (${cargo} / ${setor})`,
    ip,
    userAgent,
  });

  return NextResponse.json(created, { status: 201 });
}
