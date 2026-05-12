import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotificationBatch } from "@/lib/notifications";
import {
  getAsoStatusWithTemporal,
  getTrainingStatusWithTemporal,
} from "@/lib/temporal-status";
import { NextResponse } from "next/server";

// ─── GET /api/solicitacoes ────────────────────────────────────────────────────
// SST/Admin/Gestor: lista todas da empresa
// Colaborador: lista apenas as suas
export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;
  const { searchParams } = new URL(req.url);

  const roles: string[] = user.usuarioPapeis.map(
    (up: { papel: { codigo: string } }) => up.papel.codigo,
  );
  const isColaborador = roles.length === 1 && roles.includes("COLABORADOR");

  // Colaborador só vê suas próprias solicitações
  const colaboradorFilter = isColaborador
    ? { colaboradorId: user.colaboradorId ?? "__none__" }
    : {};

  const status = searchParams.get("status") ?? undefined;
  const tipo = searchParams.get("tipo") ?? undefined;
  const colaboradorId = isColaborador
    ? undefined
    : (searchParams.get("colaboradorId") ?? undefined);

  try {
    const solicitacoes = await prisma.solicitacaoRegularizacao.findMany({
      where: {
        empresaId: session.empresaId,
        ...colaboradorFilter,
        ...(status ? { status: status as never } : {}),
        ...(tipo ? { tipo: tipo as never } : {}),
        ...(colaboradorId ? { colaboradorId } : {}),
      },
      include: {
        colaborador: {
          select: { id: true, nome: true, cargo: true, setor: true },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    });

    // Resolve nomes das referências (ASO ou Treinamento)
    const asoIds = solicitacoes
      .filter((s) => s.tipo === "ASO" && s.referenciaId)
      .map((s) => s.referenciaId!);
    const treinamentoIds = solicitacoes
      .filter((s) => s.tipo === "TREINAMENTO" && s.referenciaId)
      .map((s) => s.referenciaId!);

    const [asos, treinamentos] = await Promise.all([
      asoIds.length
        ? prisma.aSO.findMany({
            where: { id: { in: asoIds } },
            select: { id: true, tipoASO_nome: true },
          })
        : [],
      treinamentoIds.length
        ? prisma.treinamento.findMany({
            where: { id: { in: treinamentoIds } },
            select: {
              id: true,
              tipoTreinamentoRel: { select: { nome: true } },
            },
          })
        : [],
    ]);

    const asoMap = Object.fromEntries(
      asos.map((a) => [a.id, a.tipoASO_nome ?? "ASO"]),
    );
    const treinamentoMap = Object.fromEntries(
      treinamentos.map((t) => [
        t.id,
        t.tipoTreinamentoRel?.nome ?? "Treinamento",
      ]),
    );

    const result = solicitacoes.map((s) => ({
      ...s,
      referenciaNome:
        s.tipo === "ASO"
          ? (asoMap[s.referenciaId ?? ""] ?? "ASO")
          : (treinamentoMap[s.referenciaId ?? ""] ?? "Treinamento"),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/solicitacoes]", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar solicitações" },
      { status: 500 },
    );
  }
}

// ─── POST /api/solicitacoes ───────────────────────────────────────────────────
// Colaborador ou SST solicita regularização de ASO/Treinamento vencido
export async function POST(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;
  const { ip, userAgent } = extractRequestMeta(req);

  const body = await req.json().catch(() => ({}));
  const tipo: string = body?.tipo ?? "";
  const referenciaId: string = body?.referenciaId ?? "";
  const observacao: string = body?.observacao ?? "";

  if (tipo !== "ASO" && tipo !== "TREINAMENTO") {
    return NextResponse.json(
      { error: "tipo deve ser ASO ou TREINAMENTO" },
      { status: 400 },
    );
  }
  if (!referenciaId) {
    return NextResponse.json(
      { error: "referenciaId é obrigatório" },
      { status: 400 },
    );
  }

  // ── Valida se a referência existe e pertence à empresa ──────────────────
  let colaboradorId: string;
  let descricaoItem: string;
  if (tipo === "ASO") {
    const aso = await prisma.aSO.findFirst({
      where: { id: referenciaId, empresaId: session.empresaId },
    });
    if (!aso) {
      return NextResponse.json(
        { error: "ASO não encontrado" },
        { status: 404 },
      );
    }
    if (!aso.colaboradorId) {
      return NextResponse.json(
        { error: "ASO sem colaborador associado" },
        { status: 422 },
      );
    }
    // Permite apenas quando há pendência real: vencido ou prestes a vencer.
    const asoStatus = getAsoStatusWithTemporal(aso.validade_aso, aso.data_aso);
    if (
      asoStatus.status !== "Vencido" &&
      asoStatus.status !== "Prestes a vencer"
    ) {
      return NextResponse.json(
        { error: "ASO ainda está vigente, regularização não necessária" },
        { status: 422 },
      );
    }
    colaboradorId = aso.colaboradorId;
    descricaoItem = `ASO ${aso.tipoASO_nome ?? aso.id}`;
  } else {
    const treinamento = await prisma.treinamento.findFirst({
      where: { id: referenciaId, empresaId: session.empresaId },
    });
    if (!treinamento) {
      return NextResponse.json(
        { error: "Treinamento não encontrado" },
        { status: 404 },
      );
    }
    if (!treinamento.colaboradorId) {
      return NextResponse.json(
        { error: "Treinamento sem colaborador associado" },
        { status: 422 },
      );
    }
    // Permite apenas quando há pendência real: vencido ou prestes a vencer.
    const treinamentoStatus = getTrainingStatusWithTemporal(
      treinamento.validade,
    );
    if (
      treinamentoStatus.status !== "Vencido" &&
      treinamentoStatus.status !== "Prestes a vencer"
    ) {
      return NextResponse.json(
        {
          error: "Treinamento ainda está vigente, regularização não necessária",
        },
        { status: 422 },
      );
    }
    colaboradorId = treinamento.colaboradorId;
    descricaoItem = `Treinamento ${treinamento.colaborador_nome ?? treinamento.id}`;
  }

  // ── RBAC: colaborador só pode solicitar para si mesmo ────────────────────
  const roles: string[] = user.usuarioPapeis.map(
    (up: { papel: { codigo: string } }) => up.papel.codigo,
  );
  const isColaborador = roles.length === 1 && roles.includes("COLABORADOR");
  if (isColaborador && user.colaboradorId !== colaboradorId) {
    return NextResponse.json(
      {
        error:
          "Sem permissão para solicitar regularização de outro colaborador",
      },
      { status: 403 },
    );
  }

  // ── Anti-duplicidade: bloqueia se já existe solicitação aberta ──────────
  const abertos = ["PENDENTE", "EM_ANALISE", "AGENDADA"];
  const existente = await prisma.solicitacaoRegularizacao.findFirst({
    where: {
      empresaId: session.empresaId,
      colaboradorId,
      tipo: tipo as never,
      referenciaId,
      status: { in: abertos as never[] },
    },
  });
  if (existente) {
    return NextResponse.json(
      {
        error: "Já existe uma solicitação aberta para este item",
        id: existente.id,
      },
      { status: 409 },
    );
  }

  // ── Cria a solicitação ───────────────────────────────────────────────────
  const solicitacao = await prisma.solicitacaoRegularizacao.create({
    data: {
      empresaId: session.empresaId,
      colaboradorId,
      solicitadoPorId: user.id,
      tipo: tipo as never,
      referenciaId,
      observacao: observacao || null,
      status: "PENDENTE",
    },
  });

  void createAuditLog({
    empresaId: session.empresaId,
    usuarioId: user.id,
    acao: AUDIT_ACTIONS.SOLICITACAO_CRIADA,
    entidade: "solicitacao_regularizacao",
    entidadeId: solicitacao.id,
    descricao: `Solicitação criada: ${descricaoItem} (tipo: ${tipo})`,
    ip,
    userAgent,
  });

  // Notifica SST/Admin/Gestor da empresa sobre a nova solicitação
  void (async () => {
    try {
      const colaboradorRecord = await prisma.colaborador.findUnique({
        where: { id: colaboradorId },
        select: { nome: true },
      });
      const nomeColaborador = colaboradorRecord?.nome ?? "Colaborador";

      const gestores = await prisma.usuario.findMany({
        where: {
          empresaId: session.empresaId,
          status: "ATIVO",
          usuarioPapeis: {
            some: {
              papel: { codigo: { in: ["ADMIN", "TECNICO_SST", "GESTOR"] } },
            },
          },
        },
        select: { id: true },
      });

      const idsGestores = gestores
        .map((g) => g.id)
        .filter((id) => id !== user.id);

      await createNotificationBatch({
        empresaId: session.empresaId,
        usuarioIds: idsGestores,
        titulo: "Nova solicitação de regularização",
        mensagem: `Nova solicitação de ${tipo === "ASO" ? "ASO" : "Treinamento"} criada por ${nomeColaborador}.`,
        tipo: "SOLICITACAO",
      });
    } catch (err) {
      console.error("[solicitacoes POST] Falha ao enviar notificações:", err);
    }
  })();

  return NextResponse.json(solicitacao, { status: 201 });
}
