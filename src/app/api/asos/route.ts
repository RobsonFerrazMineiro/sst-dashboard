import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseLocalDate } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  return parseLocalDate(String(value));
}

function serializeASO(
  item: Awaited<ReturnType<typeof prisma.aSO.findFirstOrThrow>>,
) {
  return {
    ...item,
    colaborador_id: item.colaboradorId,
    tipoASO_id: item.tipoASOId,
  };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();
    const { searchParams } = new URL(req.url);
    const colaboradorId = searchParams.get("colaboradorId");

    const itens = await prisma.aSO.findMany({
      where: {
        empresaId: auth.session.empresaId,
        ...(colaboradorId ? { colaboradorId } : {}),
      },
      orderBy: { data_aso: "desc" },
    });

    return NextResponse.json(itens.map(serializeASO));
  } catch (err: any) {
    console.error("GET /api/asos ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ip, userAgent } = extractRequestMeta(req);
    const auth = await getAuthenticatedUser(req);
    if (!auth) return unauthorizedResponse();

    const colaboradorId = body.colaboradorId
      ? String(body.colaboradorId)
      : body.colaborador_id
        ? String(body.colaborador_id)
        : null;

    const tipoASOId = body.tipoASOId
      ? String(body.tipoASOId)
      : body.tipoASO_id
        ? String(body.tipoASO_id)
        : null;

    const data_aso = parseDateOrNull(body.data_aso);
    if (!data_aso) {
      return NextResponse.json(
        { error: "Campo obrigatorio: data_aso (data valida)" },
        { status: 400 },
      );
    }

    let colaborador_nome = String(body.colaborador_nome ?? "").trim();
    let setor = body.setor !== undefined ? String(body.setor).trim() : null;
    let cargo = body.cargo !== undefined ? String(body.cargo).trim() : null;

    if (colaboradorId) {
      const colab = await prisma.colaborador.findFirst({
        where: { id: colaboradorId, empresaId: auth.session.empresaId },
      });
      if (!colab) {
        return NextResponse.json(
          { error: "colaborador_id invalido" },
          { status: 400 },
        );
      }
      colaborador_nome = colab.nome;
      setor = colab.setor;
      cargo = colab.cargo;
    }

    if (!colaborador_nome) {
      return NextResponse.json(
        {
          error:
            "Campo obrigatorio: colaborador_nome (ou informe colaborador_id valido)",
        },
        { status: 400 },
      );
    }

    let tipoASO_nome: string | null = body.tipoASO_nome
      ? String(body.tipoASO_nome).trim()
      : null;

    let validade_aso = parseDateOrNull(body.validade_aso);

    if (tipoASOId) {
      const tipo = await prisma.tipoASO.findFirst({
        where: { id: tipoASOId, empresaId: auth.session.empresaId },
      });

      if (!tipo) {
        return NextResponse.json(
          { error: "tipoASO_id invalido" },
          { status: 400 },
        );
      }

      tipoASO_nome = tipo.nome;

      if (!validade_aso && tipo.validadeMeses && tipo.validadeMeses > 0) {
        const d = new Date(data_aso);
        d.setMonth(d.getMonth() + tipo.validadeMeses);
        validade_aso = d;
      }
    }

    const clinica =
      body.clinica === undefined || body.clinica === null
        ? null
        : String(body.clinica).trim() || null;

    const observacao =
      body.observacao === undefined || body.observacao === null
        ? null
        : String(body.observacao).trim() || null;

    const data: Prisma.ASOUncheckedCreateInput = {
      empresaId: auth.session.empresaId,
      colaboradorId,
      colaborador_nome,
      setor,
      cargo,
      tipoASOId,
      tipoASO_nome,
      data_aso,
      validade_aso,
      clinica,
      observacao,
    };

    const created = await prisma.aSO.create({ data });

    void createAuditLog({
      empresaId: auth.session.empresaId,
      usuarioId: auth.session.userId,
      acao: AUDIT_ACTIONS.ASO_CREATED,
      entidade: "aso",
      entidadeId: created.id,
      descricao: `ASO criado para: ${colaborador_nome} (tipo: ${tipoASO_nome ?? "avulso"})`,
      ip,
      userAgent,
    });

    return NextResponse.json(serializeASO(created), { status: 201 });
  } catch (err: any) {
    console.error("POST /api/asos ->", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
