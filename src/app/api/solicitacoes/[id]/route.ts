import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { formatDate, parseLocalDate } from "@/lib/utils";
import { NextResponse } from "next/server";

const STATUS_VALIDOS = [
  "PENDENTE",
  "EM_ANALISE",
  "AGENDADA",
  "CONCLUIDA",
  "CANCELADA",
];

// ─── PATCH /api/solicitacoes/[id] ────────────────────────────────────────────
// SST/Admin/Gestor altera status + observação. Colaborador pode apenas cancelar a sua.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;
  const { ip, userAgent } = extractRequestMeta(req);
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const novoStatus: string = body?.status ?? "";
  const observacao: string | undefined = body?.observacao;
  const dataAgendadaRaw: string | undefined = body?.dataAgendada;

  if (!STATUS_VALIDOS.includes(novoStatus)) {
    return NextResponse.json(
      {
        error: `Status inválido. Valores aceitos: ${STATUS_VALIDOS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validação: dataAgendada obrigatória quando status = AGENDADA
  let dataAgendada: Date | null = null;
  if (novoStatus === "AGENDADA") {
    if (!dataAgendadaRaw) {
      return NextResponse.json(
        { error: "dataAgendada é obrigatória quando status for AGENDADA" },
        { status: 400 },
      );
    }
    const parsed = parseLocalDate(dataAgendadaRaw);
    if (!parsed) {
      return NextResponse.json(
        { error: "dataAgendada inválida" },
        { status: 400 },
      );
    }
    dataAgendada = parsed;
  }

  // Busca e valida pertencimento à empresa
  const solicitacao = await prisma.solicitacaoRegularizacao.findFirst({
    where: { id, empresaId: session.empresaId },
  });
  if (!solicitacao) {
    return NextResponse.json(
      { error: "Solicitação não encontrada" },
      { status: 404 },
    );
  }

  // RBAC: colaborador só pode cancelar a própria solicitação
  const roles: string[] = user.usuarioPapeis.map(
    (up: { papel: { codigo: string } }) => up.papel.codigo,
  );
  const isColaborador = roles.length === 1 && roles.includes("COLABORADOR");
  if (isColaborador) {
    if (solicitacao.colaboradorId !== user.colaboradorId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (novoStatus !== "CANCELADA") {
      return NextResponse.json(
        { error: "Colaborador só pode cancelar a solicitação" },
        { status: 403 },
      );
    }
  }

  // Bloqueia alteração de solicitações já finalizadas
  if (
    solicitacao.status === "CONCLUIDA" ||
    solicitacao.status === "CANCELADA"
  ) {
    return NextResponse.json(
      { error: "Solicitação já finalizada não pode ser alterada" },
      { status: 422 },
    );
  }

  const atualizada = await prisma.solicitacaoRegularizacao.update({
    where: { id },
    data: {
      status: novoStatus as never,
      ...(observacao !== undefined ? { observacao } : {}),
      // AGENDADA: salva data; CANCELADA: limpa; demais: mantém
      ...(novoStatus === "AGENDADA"
        ? { dataAgendada }
        : novoStatus === "CANCELADA"
          ? { dataAgendada: null }
          : {}),
    },
  });

  const acaoAudit =
    novoStatus === "CONCLUIDA"
      ? AUDIT_ACTIONS.SOLICITACAO_CONCLUIDA
      : novoStatus === "AGENDADA"
        ? AUDIT_ACTIONS.SOLICITACAO_AGENDADA
        : AUDIT_ACTIONS.SOLICITACAO_ATUALIZADA;

  const descricaoAudit =
    novoStatus === "AGENDADA" && dataAgendada
      ? `Status alterado para AGENDADA. Data agendada: ${formatDate(dataAgendada, "-")}`
      : `Status alterado para ${novoStatus}`;

  void createAuditLog({
    empresaId: session.empresaId,
    usuarioId: user.id,
    acao: acaoAudit,
    entidade: "solicitacao_regularizacao",
    entidadeId: id,
    descricao: descricaoAudit,
    ip,
    userAgent,
  });

  // Notifica o usuário vinculado ao colaborador sobre a mudança de status
  void (async () => {
    try {
      const colaborador = await prisma.colaborador.findUnique({
        where: { id: solicitacao.colaboradorId },
        select: { usuario: { select: { id: true } } },
      });
      const usuarioColaboradorId = colaborador?.usuario?.id;
      if (usuarioColaboradorId && usuarioColaboradorId !== user.id) {
        const tipoLabel = solicitacao.tipo === "ASO" ? "ASO" : "Treinamento";
        let mensagem: string;
        if (novoStatus === "AGENDADA" && dataAgendada) {
          const dataFmt = formatDate(dataAgendada, "-");
          mensagem = `Seu ${tipoLabel} está agendado para ${dataFmt}. Programe-se!`;
        } else {
          const statusLabel: Record<string, string> = {
            EM_ANALISE: "Em análise",
            AGENDADA: "Agendada",
            CONCLUIDA: "Concluída",
            CANCELADA: "Cancelada",
          };
          mensagem = `Sua solicitação de ${tipoLabel} foi atualizada para "${statusLabel[novoStatus] ?? novoStatus}".`;
        }
        await createNotification({
          empresaId: session.empresaId,
          usuarioId: usuarioColaboradorId,
          titulo:
            novoStatus === "AGENDADA"
              ? "Agendamento confirmado"
              : "Solicitação atualizada",
          mensagem,
          tipo: "STATUS",
        });
      }
    } catch (err) {
      console.error("[solicitacoes PATCH] Falha ao enviar notificação:", err);
    }
  })();

  return NextResponse.json(atualizada);
}
