"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Hash,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import AddASOModal from "@/components/colaboradores/modals/AddASOModal";
import AddTreinamentoModal from "@/components/colaboradores/modals/AddTreinamentoModal";
import RiskScoreBadge from "@/components/dashboard/RiskScoreBadge";
import RiskScoreHoverCard from "@/components/dashboard/RiskScoreHoverCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadgeWithTemporal } from "@/components/ui/status-badge-with-temporal";
import { api } from "@/lib/api";
import { useAuthPermissions } from "@/lib/permissions-client";
import { calculateRiskScore } from "@/lib/risk-score";
import { createRealPendingsList } from "@/lib/unified-pending";
import { formatDate, parseLocalDate } from "@/lib/utils";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";
import { toast } from "sonner";

// ==================== HELPERS PARA NÍVEL 2 ====================

/**
 * Converte data ISO para Date, retorna epoch 0 se inválida
 */
function getDateTime(dateISO?: string | null): number {
  if (!dateISO) return 0;
  try {
    return new Date(dateISO).getTime();
  } catch {
    return 0;
  }
}

/**
 * Separa registros em "Atual" e "Histórico"
 * Atual = mais recente por chave (ex: tipoTreinamento)
 */
function splitLatestByKey<T extends Record<string, unknown>>(
  records: T[],
  keyField: keyof T,
  dateField: keyof T,
): { atual: T[]; historico: T[] } {
  const seenKeys = new Set<unknown>();
  const atual: T[] = [];

  // Ordena por data DESC (mais recente primeiro)
  const sorted = [...records].sort(
    (a, b) =>
      getDateTime(b[dateField] as string) - getDateTime(a[dateField] as string),
  );

  // Coleta apenas o primeiro registro por chave
  for (const record of sorted) {
    const key = record[keyField];
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      atual.push(record);
    }
  }

  // Histórico = todos os demais
  const historico = records.filter((r) => !atual.includes(r));

  return { atual, historico };
}

/**
 * Separa registros em "Atual" (apenas o mais recente) e "Histórico"
 * Usado para ASOs onde queremos apenas 1 registro "Atual"
 */
function splitLatestSingle<T extends Record<string, unknown>>(
  records: T[],
  dateField: keyof T,
): { atual: T[]; historico: T[] } {
  // Se vazio, retorna vazio
  if (records.length === 0) {
    return { atual: [], historico: [] };
  }

  // Ordena por data DESC (mais recente primeiro)
  const sorted = [...records].sort(
    (a, b) =>
      getDateTime(b[dateField] as string) - getDateTime(a[dateField] as string),
  );

  // Atual = apenas o primeiro (mais recente)
  const atual = [sorted[0]];

  // Histórico = todos os demais
  const historico = sorted.slice(1);

  return { atual, historico };
}

// =========== FIM DOS HELPERS PARA NÍVEL 2 ===========

function getStatus(validadeISO?: string | null) {
  if (!validadeISO) return "Sem vencimento";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const validade = parseLocalDate(validadeISO);
  if (!validade) return "Sem vencimento";

  validade.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "Vencido";
  if (diffDays <= 30) return "Prestes a vencer";
  return "Em dia";
}

function getDiffDays(validadeISO?: string | null): number {
  if (!validadeISO) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const validade = parseLocalDate(validadeISO);
  if (!validade) return 0;

  validade.setHours(0, 0, 0, 0);

  return Math.ceil(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getTemporalLabel(diffDays: number): string {
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `há ${absDays} ${absDays === 1 ? "dia" : "dias"}`;
  } else if (diffDays === 0) {
    return "vence hoje";
  } else if (diffDays <= 30) {
    return `em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } else {
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} restantes`;
  }
}

const statusRank: Record<string, number> = {
  Vencido: 0,
  "Prestes a vencer": 1,
  "Em dia": 2,
  "Sem vencimento": 3,
  Pendente: 4,
};

function byStatusThenDate(
  aStatus: string,
  aDate?: string | null,
  bStatus?: string,
  bDate?: string | null,
) {
  const ra = statusRank[aStatus] ?? 99;
  const rb = statusRank[bStatus ?? ""] ?? 99;
  if (ra !== rb) return ra - rb;

  const da = aDate ? new Date(aDate).getTime() : 0;
  const db = bDate ? new Date(bDate).getTime() : 0;
  return db - da; // mais recente primeiro
}

type TreinamentoProfileRow = TreinamentoRecord & {
  status: string;
  diffDays: number;
  temporalLabel: string;
  dataFmt: string;
  validadeFmt: string;
};

type AsoProfileRow = AsoRecord & {
  status: string;
  diffDays: number;
  temporalLabel: string;
  dataFmt: string;
  validadeFmt: string;
};

export default function ColaboradorProfile({ id }: { id: string }) {
  const qc = useQueryClient();
  const { hasPermission } = useAuthPermissions();
  const canManageTreinamentos = hasPermission("treinamentos.gerenciar");
  const canManageASOs = hasPermission("asos.gerenciar");

  const [openTreinamento, setOpenTreinamento] = useState(false);
  const [openASO, setOpenASO] = useState(false);
  const [editingTreinamento, setEditingTreinamento] =
    useState<TreinamentoRecord | null>(null);
  const [editingASO, setEditingASO] = useState<AsoRecord | null>(null);

  // ==================== ESTADO DE FILTRO GLOBAL ====================

  const [buscaGlobal, setBuscaGlobal] = useState("");
  const [statusGlobalFiltro, setStatusGlobalFiltro] = useState<string | null>(
    null,
  );
  const [visualizacaoGlobal, setVisualizacaoGlobal] = useState<
    "todos" | "atuais" | "historico"
  >("todos");

  // ==================== FIM ESTADO DE FILTRO GLOBAL ====================

  const { data: colaborador, isLoading: loadingColab } = useQuery({
    queryKey: ["colaborador", id],
    queryFn: () => api.colaboradores.get(id),
  });

  const { data: treinamentos = [], isLoading: loadingTre } = useQuery({
    queryKey: ["treinamentos", id],
    queryFn: () => api.treinamentos.list(id),
  });

  const { data: asos = [], isLoading: loadingAso } = useQuery({
    queryKey: ["asos", id],
    queryFn: () => api.asos.list(id),
  });

  const { data: tiposTreinamento = [] } = useQuery({
    queryKey: ["tiposTreinamento"],
    queryFn: api.tiposTreinamento.list,
  });

  const { data: tiposASO = [] } = useQuery({
    queryKey: ["tiposASO"],
    queryFn: api.tiposASO.list,
  });

  // Calcula o score de risco
  const riskScore = useMemo(() => {
    const pendingsList = createRealPendingsList(asos, treinamentos);
    return calculateRiskScore(pendingsList);
  }, [asos, treinamentos]);

  const treinamentosDoColab = useMemo(() => {
    const filtered = (treinamentos as TreinamentoRecord[])
      .filter((t) => t.colaborador_id === id)
      .map((t) => {
        const diffDays = getDiffDays(t.validade ?? null);
        return {
          ...t,
          status: getStatus(t.validade ?? null),
          diffDays,
          temporalLabel: getTemporalLabel(diffDays),
          dataFmt: formatDate(t.data_treinamento, "-"),
          validadeFmt: formatDate(t.validade, "Indeterminada"),
        };
      })
      .sort((a, b) =>
        byStatusThenDate(a.status, a.validade, b.status, b.validade),
      );
    return filtered;
  }, [treinamentos, id]);

  const { atual: treinamentosAtuais, historico: treinamentosHistorico } =
    useMemo(() => {
      const keyField = "tipoTreinamento" as const;
      const dateField = "data_treinamento" as const;

      const result = splitLatestByKey(treinamentosDoColab, keyField, dateField);

      return {
        atual: result.atual.sort((a, b) =>
          byStatusThenDate(a.status, a.validade, b.status, b.validade),
        ),
        historico: result.historico.sort((a, b) =>
          byStatusThenDate(a.status, a.validade, b.status, b.validade),
        ),
      };
    }, [treinamentosDoColab]);

  const asosDoColab = useMemo(() => {
    return (asos as AsoRecord[])
      .filter((a) => a.colaborador_id === id)
      .map((a) => {
        const diffDays = getDiffDays(a.validade_aso ?? null);
        return {
          ...a,
          status: getStatus(a.validade_aso ?? null),
          diffDays,
          temporalLabel: getTemporalLabel(diffDays),
          dataFmt: formatDate(a.data_aso, "-"),
          validadeFmt: formatDate(a.validade_aso, "Indeterminada"),
        };
      });
  }, [asos, id]);

  const { atual: asosAtuais, historico: asosHistorico } = useMemo(() => {
    // Nova regra: apenas o registro mais recente em "Atual"
    // Todos os demais em "Histórico", independentemente do tipo de ASO
    const dateField = "data_aso" as const;

    const result = splitLatestSingle(asosDoColab, dateField);

    return {
      atual: result.atual,
      historico: result.historico,
    };
  }, [asosDoColab]);

  // ==================== FILTROS PARA TREINAMENTOS ====================

  const treinamentosFiltrados = useMemo(() => {
    // Apenas Treinamentos Atuais - aplicar filtros globais (status, busca e visualização)
    let resultado = treinamentosAtuais;

    // Filtro de status global
    if (statusGlobalFiltro) {
      resultado = resultado.filter((t) => t.status === statusGlobalFiltro);
    }

    // Filtro de busca global
    if (buscaGlobal.trim()) {
      const needle = buscaGlobal.toLowerCase();
      resultado = resultado.filter((t) => {
        const nome = (t.tipoTreinamento_nome ?? "").toLowerCase();
        const nr = (t.nr ?? "").toLowerCase();
        return nome.includes(needle) || nr.includes(needle);
      });
    }

    // Aplicar visualização
    if (visualizacaoGlobal === "historico") {
      resultado = [];
    }

    return resultado;
  }, [treinamentosAtuais, statusGlobalFiltro, buscaGlobal, visualizacaoGlobal]);

  const treinamentosHistoricoFiltrados = useMemo(() => {
    // Apenas Treinamentos Histórico - aplicar filtros globais (status, busca e visualização)
    let resultado = treinamentosHistorico;

    // Filtro de status global
    if (statusGlobalFiltro) {
      resultado = resultado.filter((t) => t.status === statusGlobalFiltro);
    }

    // Filtro de busca global
    if (buscaGlobal.trim()) {
      const needle = buscaGlobal.toLowerCase();
      resultado = resultado.filter((t) => {
        const nome = (t.tipoTreinamento_nome ?? "").toLowerCase();
        const nr = (t.nr ?? "").toLowerCase();
        return nome.includes(needle) || nr.includes(needle);
      });
    }

    // Aplicar visualização
    if (visualizacaoGlobal === "atuais") {
      resultado = [];
    }

    return resultado;
  }, [
    treinamentosHistorico,
    statusGlobalFiltro,
    buscaGlobal,
    visualizacaoGlobal,
  ]);

  // ==================== FILTROS PARA ASOs ====================

  const asosFiltrados = useMemo(() => {
    // Apenas ASOs atuais - aplicar filtros globais (status e visualização)
    let resultado = asosAtuais;

    // Filtro de status global
    if (statusGlobalFiltro) {
      resultado = resultado.filter((a) => a.status === statusGlobalFiltro);
    }

    if (visualizacaoGlobal === "historico") {
      resultado = [];
    }

    return resultado;
  }, [asosAtuais, statusGlobalFiltro, visualizacaoGlobal]);

  const asosHistoricoFiltrados = useMemo(() => {
    // Apenas ASOs históricos - aplicar filtros globais (status e visualização)
    let resultado = asosHistorico;

    // Filtro de status global
    if (statusGlobalFiltro) {
      resultado = resultado.filter((a) => a.status === statusGlobalFiltro);
    }

    if (visualizacaoGlobal === "atuais") {
      resultado = [];
    }

    return resultado;
  }, [asosHistorico, statusGlobalFiltro, visualizacaoGlobal]);

  // ==================== FIM DOS FILTROS ====================

  const delTre = useMutation({
    mutationFn: (treinamentoId: string) =>
      api.treinamentos.remove(treinamentoId),
    onSuccess: async () => {
      toast.success("Treinamento excluído!");
      await qc.invalidateQueries({ queryKey: ["treinamentos"] });
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir treinamento",
      ),
  });

  const delAso = useMutation({
    mutationFn: (asoId: string) => api.asos.remove(asoId),
    onSuccess: async () => {
      toast.success("ASO excluído!");
      await qc.invalidateQueries({ queryKey: ["asos"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Erro ao excluir ASO"),
  });

  if (loadingColab) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            Carregando colaborador...
          </div>
        </div>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <p className="text-slate-600">Colaborador nao encontrado.</p>
          <Link
            href="/colaboradores"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para colaboradores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7">
      <header className="space-y-3">
        <Link
          href="/colaboradores"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para colaboradores
        </Link>
      </header>

      <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-6">
        {/* Header com nome e score */}
        <div className="mb-4 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 shrink-0">
                <UserRound className="w-6 h-6 text-slate-700" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                  {colaborador.nome}
                </h1>
                <p className="mt-1 text-sm text-slate-500 sm:hidden">
                  Perfil do colaborador
                </p>
              </div>
            </div>
          </div>
          {/* Score de Risco ao lado */}
          <div className="self-start sm:self-auto">
            <RiskScoreHoverCard riskScore={riskScore}>
              <RiskScoreBadge riskScore={riskScore} showLabel />
            </RiskScoreHoverCard>
          </div>
        </div>

        {/* Informações básicas */}
        <div className="grid grid-cols-1 gap-2 text-sm sm:flex sm:flex-wrap sm:gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600 sm:bg-transparent sm:px-0 sm:py-0">
            <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="font-medium shrink-0">Setor:</span>{" "}
            {colaborador.setor || "-"}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600 sm:bg-transparent sm:px-0 sm:py-0">
            <BriefcaseBusiness className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="font-medium shrink-0">Cargo:</span>{" "}
            {colaborador.cargo || "-"}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600 sm:bg-transparent sm:px-0 sm:py-0">
            <Hash className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="font-medium shrink-0">Matrícula:</span>{" "}
            {colaborador.matricula ?? "-"}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {/* Filtro Global - Posicionado acima do título */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Busca Global */}
            <input
              type="text"
              name="buscarPerfilColaborador"
              aria-label="Buscar treinamentos por nome ou NR"
              autoComplete="off"
              placeholder="Buscar por nome ou NR..."
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
              className="min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Filtro de Status Global */}
            <select
              name="statusGlobalPerfil"
              aria-label="Filtrar perfil por status"
              value={statusGlobalFiltro ?? ""}
              onChange={(e) => setStatusGlobalFiltro(e.target.value || null)}
              className="min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os status</option>
              <option value="Em dia">Em dia</option>
              <option value="Prestes a vencer">Prestes a vencer</option>
              <option value="Vencido">Vencido</option>
              <option value="Pendente">Pendente</option>
            </select>

            {/* Filtro de Visualização Global */}
            <select
              name="visualizacaoGlobalPerfil"
              aria-label="Filtrar perfil por visualização"
              value={visualizacaoGlobal}
              onChange={(e) =>
                setVisualizacaoGlobal(
                  e.target.value as "todos" | "atuais" | "historico",
                )
              }
              className="min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos (Atuais + Histórico)</option>
              <option value="atuais">Apenas Atuais</option>
              <option value="historico">Apenas Histórico</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            Treinamentos
          </h2>
          {canManageTreinamentos ? (
            <Button
              onClick={() => setOpenTreinamento(true)}
              className="gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar treinamento
            </Button>
          ) : null}
        </div>

        {/* Treinamentos Atuais */}
        {visualizacaoGlobal !== "historico" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Atuais
              </Badge>
            </h3>
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[220px]">
                        Treinamento / NR
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Validade
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[110px]">
                        Carga (h)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 min-w-[108px]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTre ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Carregando...
                        </td>
                      </tr>
                    ) : treinamentosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum treinamento encontrado.
                        </td>
                      </tr>
                    ) : (
                      treinamentosFiltrados.map((t: TreinamentoProfileRow) => (
                        <tr
                          key={t.id}
                          className="border-t border-slate-200 hover:bg-slate-50"
                        >
                          <td className="max-w-85 px-4 py-3 text-sm font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {t.tipoTreinamento_nome ? (
                                <span>{t.tipoTreinamento_nome}</span>
                              ) : null}
                              {t.nr ? (
                                <Badge
                                  variant="outline"
                                  className="border-sky-200 bg-sky-50 text-sky-700 shadow-none"
                                >
                                  {t.nr}
                                </Badge>
                              ) : !t.tipoTreinamento_nome ? (
                                <span>-</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {t.dataFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                              {t.validadeFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            {t.carga_horaria ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadgeWithTemporal
                              statusInfo={{
                                status: t.status as
                                  | "Em dia"
                                  | "Prestes a vencer"
                                  | "Vencido"
                                  | "Pendente"
                                  | "Sem vencimento",
                                diffDays: t.diffDays,
                                temporalLabel: t.temporalLabel,
                              }}
                              showTemporalBelow={true}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5 sm:gap-2">
                              {canManageTreinamentos ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Editar treinamento ${t.tipoTreinamento_nome ?? t.nr ?? ""}`}
                                    title="Editar"
                                    onClick={() => {
                                      setEditingTreinamento(t);
                                      setOpenTreinamento(true);
                                    }}
                                    className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Pencil aria-hidden="true" className="w-4 h-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Excluir treinamento ${t.tipoTreinamento_nome ?? t.nr ?? ""}`}
                                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      >
                                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Excluir treinamento?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Essa acao e permanente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => delTre.mutate(t.id)}
                                          className="bg-rose-600 hover:bg-rose-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Treinamentos Histórico */}
        {visualizacaoGlobal !== "atuais" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                Histórico
              </Badge>
            </h3>
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[220px]">
                        Treinamento / NR
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Validade
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[110px]">
                        Carga (h)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 min-w-[108px]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {treinamentosHistoricoFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum treinamento encontrado.
                        </td>
                      </tr>
                    ) : (
                      treinamentosHistoricoFiltrados.map(
                        (t: TreinamentoProfileRow) => (
                          <tr
                            key={t.id}
                            className="border-t border-slate-200 hover:bg-slate-50 opacity-75"
                          >
                            <td className="max-w-85 px-4 py-3 text-sm font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                {t.tipoTreinamento_nome ? (
                                  <span>{t.tipoTreinamento_nome}</span>
                                ) : null}
                                {t.nr ? (
                                  <Badge
                                    variant="outline"
                                    className="border-sky-200 bg-sky-50 text-sky-700 shadow-none"
                                  >
                                    {t.nr}
                                  </Badge>
                                ) : !t.tipoTreinamento_nome ? (
                                  <span>-</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                {t.dataFmt}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                                {t.validadeFmt}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              {t.carga_horaria ?? "-"}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadgeWithTemporal
                                statusInfo={{
                                  status: t.status as
                                    | "Em dia"
                                    | "Prestes a vencer"
                                    | "Vencido"
                                    | "Pendente"
                                    | "Sem vencimento",
                                  diffDays: t.diffDays,
                                  temporalLabel: t.temporalLabel,
                                }}
                                showTemporalBelow={true}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1.5 sm:gap-2">
                                {canManageTreinamentos ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Editar treinamento ${t.tipoTreinamento_nome ?? t.nr ?? ""}`}
                                      title="Editar"
                                      onClick={() => {
                                        setEditingTreinamento(t);
                                        setOpenTreinamento(true);
                                      }}
                                      className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                    >
                                      <Pencil aria-hidden="true" className="w-4 h-4" />
                                    </Button>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={`Excluir treinamento ${t.tipoTreinamento_nome ?? t.nr ?? ""}`}
                                          className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        >
                                          <Trash2 aria-hidden="true" className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Excluir treinamento?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Essa acao e permanente.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancelar
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => delTre.mutate(t.id)}
                                            className="bg-rose-600 hover:bg-rose-700"
                                          >
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">ASOs</h2>
          {canManageASOs ? (
            <Button
              onClick={() => setOpenASO(true)}
              className="gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar ASO
            </Button>
          ) : null}
        </div>

        {/* ASOs Atuais */}
        {visualizacaoGlobal !== "historico" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Atuais
              </Badge>
            </h3>
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[200px]">
                        Tipo de ASO
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Validade
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[150px]">
                        Clinica
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 min-w-[108px]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAso ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Carregando...
                        </td>
                      </tr>
                    ) : asosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum ASO para visualizar.
                        </td>
                      </tr>
                    ) : (
                      asosFiltrados.map((a: AsoProfileRow) => (
                        <tr
                          key={a.id}
                          className="border-t border-slate-200 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                            {a.tipoASO_nome ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"
                              >
                                {a.tipoASO_nome}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {a.dataFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                              {a.validadeFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            {a.clinica ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadgeWithTemporal
                              statusInfo={{
                                status: a.status as
                                  | "Em dia"
                                  | "Prestes a vencer"
                                  | "Vencido"
                                  | "Pendente"
                                  | "Sem vencimento",
                                diffDays: a.diffDays,
                                temporalLabel: a.temporalLabel,
                              }}
                              showTemporalBelow={true}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5 sm:gap-2">
                              {canManageASOs ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Editar ASO ${a.tipoASO_nome ?? ""}`}
                                    title="Editar"
                                    onClick={() => {
                                      setEditingASO(a);
                                      setOpenASO(true);
                                    }}
                                    className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Pencil aria-hidden="true" className="w-4 h-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Excluir ASO ${a.tipoASO_nome ?? ""}`}
                                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      >
                                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Excluir ASO?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Essa acao e permanente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => delAso.mutate(a.id)}
                                          className="bg-rose-600 hover:bg-rose-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ASOs Histórico */}
        {visualizacaoGlobal !== "atuais" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                Histórico
              </Badge>
            </h3>
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[200px]">
                        Tipo de ASO
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[120px]">
                        Validade
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[150px]">
                        Clinica
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 min-w-[108px]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {asosHistoricoFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum ASO para visualizar.
                        </td>
                      </tr>
                    ) : (
                      asosHistoricoFiltrados.map((a: AsoProfileRow) => (
                        <tr
                          key={a.id}
                          className="border-t border-slate-200 hover:bg-slate-50 opacity-75"
                        >
                          <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                            {a.tipoASO_nome ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"
                              >
                                {a.tipoASO_nome}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {a.dataFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                              {a.validadeFmt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            {a.clinica ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadgeWithTemporal
                              statusInfo={{
                                status: a.status as
                                  | "Em dia"
                                  | "Prestes a vencer"
                                  | "Vencido"
                                  | "Pendente"
                                  | "Sem vencimento",
                                diffDays: a.diffDays,
                                temporalLabel: a.temporalLabel,
                              }}
                              showTemporalBelow={true}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5 sm:gap-2">
                              {canManageASOs ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Editar ASO ${a.tipoASO_nome ?? ""}`}
                                    title="Editar"
                                    onClick={() => {
                                      setEditingASO(a);
                                      setOpenASO(true);
                                    }}
                                    className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Pencil aria-hidden="true" className="w-4 h-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Excluir ASO ${a.tipoASO_nome ?? ""}`}
                                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      >
                                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Excluir ASO?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Essa acao e permanente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => delAso.mutate(a.id)}
                                          className="bg-rose-600 hover:bg-rose-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {canManageTreinamentos ? (
        <AddTreinamentoModal
          open={openTreinamento}
          onOpenChange={(v) => {
            setOpenTreinamento(v);
            if (!v) setEditingTreinamento(null);
          }}
          colaborador={{
            id,
            nome: colaborador.nome,
            setor: colaborador.setor,
            cargo: colaborador.cargo,
          }}
          tiposTreinamento={tiposTreinamento}
          initial={editingTreinamento}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["treinamentos"] });
          }}
        />
      ) : null}

      {canManageASOs ? (
        <AddASOModal
          open={openASO}
          onOpenChange={(v) => {
            setOpenASO(v);
            if (!v) setEditingASO(null);
          }}
          colaborador={{
            id,
            nome: colaborador.nome,
            setor: colaborador.setor,
            cargo: colaborador.cargo,
          }}
          tiposASO={tiposASO}
          aso={editingASO}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["asos"] });
          }}
        />
      ) : null}
    </div>
  );
}
