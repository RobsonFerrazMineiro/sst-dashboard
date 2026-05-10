import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createRealPendingsList,
  groupPendingsByColaborador,
} from "@/lib/unified-pending";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";
import { NextResponse } from "next/server";

export type AlertaSST = {
  id: string;
  severity: "critical" | "warning";
  message: string;
};

// ─── GET /api/alertas ─────────────────────────────────────────────────────────
// Retorna alertas SST computados para SST/Admin/Gestor.
// Colaborador recebe array vazio.
export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;

  const roles: string[] = user.usuarioPapeis.map(
    (up: { papel: { codigo: string } }) => up.papel.codigo,
  );
  const isColaborador = roles.length === 1 && roles.includes("COLABORADOR");
  if (isColaborador) {
    return NextResponse.json({ alertas: [] });
  }

  try {
    const [rawAsos, rawTreinamentos] = await Promise.all([
      prisma.aSO.findMany({
        where: { empresaId: session.empresaId },
        select: {
          id: true,
          colaboradorId: true,
          colaborador_nome: true,
          setor: true,
          cargo: true,
          tipoASOId: true,
          tipoASO_nome: true,
          clinica: true,
          data_aso: true,
          validade_aso: true,
        },
        orderBy: { data_aso: "desc" },
      }),
      prisma.treinamento.findMany({
        where: { empresaId: session.empresaId },
        select: {
          id: true,
          colaboradorId: true,
          colaborador_nome: true,
          tipoTreinamentoId: true,
          tipoTreinamentoRel: { select: { nome: true } },
          nr: true,
          data_treinamento: true,
          validade: true,
          carga_horaria: true,
        },
        orderBy: { data_treinamento: "desc" },
      }),
    ]);

    // Mapeia para os tipos esperados pelas funções utilitárias
    const asos: AsoRecord[] = rawAsos.map((a) => ({
      id: a.id,
      colaborador_id: a.colaboradorId,
      colaborador_nome: a.colaborador_nome,
      setor: a.setor,
      cargo: a.cargo,
      tipoASO_id: a.tipoASOId,
      tipoASO_nome: a.tipoASO_nome,
      clinica: a.clinica,
      data_aso: a.data_aso?.toISOString() ?? null,
      validade_aso: a.validade_aso?.toISOString() ?? null,
    }));

    const treinamentos: TreinamentoRecord[] = rawTreinamentos.map((t) => ({
      id: t.id,
      colaborador_id: t.colaboradorId,
      colaborador_nome: t.colaborador_nome,
      tipoTreinamento: t.tipoTreinamentoId,
      tipoTreinamento_nome: t.tipoTreinamentoRel?.nome ?? null,
      nr: t.nr ?? null,
      data_treinamento: t.data_treinamento?.toISOString() ?? null,
      validade: t.validade?.toISOString() ?? null,
      carga_horaria: t.carga_horaria,
    }));

    const allPendings = createRealPendingsList(asos, treinamentos);
    const grouped = groupPendingsByColaborador(allPendings);
    const alertas: AlertaSST[] = [];

    // 1 — Colaboradores com >=2 pendências críticas
    grouped
      .filter((g) => g.vencidosCount >= 2)
      .slice(0, 5)
      .forEach((g) => {
        alertas.push({
          id: `critico-${g.colaborador}`,
          severity: "critical",
          message: `${g.colaborador} tem ${g.vencidosCount} pendência${g.vencidosCount > 1 ? "s" : ""} crítica${g.vencidosCount > 1 ? "s" : ""}`,
        });
      });

    // 2 — Volume crítico (>5 vencidos no total)
    const totalVencidos = grouped.reduce((sum, g) => sum + g.vencidosCount, 0);
    if (totalVencidos > 5) {
      alertas.push({
        id: "volume-critico",
        severity: "warning",
        message: `${totalVencidos} registros vencidos na equipe`,
      });
    }

    // 3 — Colaboradores com vencimentos em ≤7 dias
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Set<string>();
    allPendings.forEach((item) => {
      if (item.status !== "Prestes a vencer" || !item.validade) return;
      const d = new Date(item.validade);
      d.setHours(0, 0, 0, 0);
      const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
      if (days >= 0 && days <= 7) soon.add(item.colaborador);
    });
    if (soon.size > 0) {
      alertas.push({
        id: "prestes-vencer",
        severity: "warning",
        message: `${soon.size} colaborador${soon.size > 1 ? "es" : ""} com pendências vencendo em até 7 dias`,
      });
    }

    return NextResponse.json({ alertas });
  } catch (err) {
    console.error("[GET /api/alertas]", err);
    return NextResponse.json({ alertas: [] });
  }
}
