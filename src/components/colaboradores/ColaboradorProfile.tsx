"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { api } from "@/lib/api";
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    "Em dia": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Prestes a vencer": "bg-amber-100 text-amber-700 border-amber-200",
    Vencido: "bg-rose-100 text-rose-700 border-rose-200",
    Pendente: "bg-slate-100 text-slate-700 border-slate-200",
    "Sem vencimento": "bg-blue-100 text-blue-700 border-blue-200",
  };
  return map[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function getStatus(validadeISO?: string | null) {
  if (!validadeISO) return "Sem vencimento";

  const hoje = new Date();
  const validade = new Date(validadeISO);
  const diffDays = Math.ceil(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "Vencido";
  if (diffDays <= 30) return "Prestes a vencer";
  return "Em dia";
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
  dataFmt: string;
  validadeFmt: string;
};

type AsoProfileRow = AsoRecord & {
  status: string;
  dataFmt: string;
  validadeFmt: string;
};

export default function ColaboradorProfile({ id }: { id: string }) {
  const qc = useQueryClient();

  const [openTreinamento, setOpenTreinamento] = useState(false);
  const [openASO, setOpenASO] = useState(false);
  const [editingTreinamento, setEditingTreinamento] =
    useState<TreinamentoRecord | null>(null);
  const [editingASO, setEditingASO] = useState<AsoRecord | null>(null);

  // ==================== ESTADO DE FILTRO GLOBAL ====================

  const [buscaGlobal, setBuscaGlobal] = useState("");
  const [statusGlobalFiltro, setStatusGlobalFiltro] = useState<string | null>(null);
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

  const treinamentosDoColab = useMemo(() => {
    const filtered = (treinamentos as TreinamentoRecord[])
      .filter((t) => t.colaborador_id === id)
      .map((t) => ({
        ...t,
        status: getStatus(t.validade ?? null),
        dataFmt: t.data_treinamento
          ? format(parseISO(t.data_treinamento), "dd/MM/yyyy", { locale: ptBR })
          : "-",
        validadeFmt: t.validade
          ? format(parseISO(t.validade), "dd/MM/yyyy", { locale: ptBR })
          : "Indeterminada",
      }))
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
      .map((a) => ({
        ...a,
        status: getStatus(a.validade_aso ?? null),
        dataFmt: a.data_aso
          ? format(parseISO(a.data_aso), "dd/MM/yyyy", { locale: ptBR })
          : "-",
        validadeFmt: a.validade_aso
          ? format(parseISO(a.validade_aso), "dd/MM/yyyy", { locale: ptBR })
          : "Indeterminada",
      }));
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
  }, [treinamentosHistorico, statusGlobalFiltro, buscaGlobal, visualizacaoGlobal]);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="space-y-3">
        <Link
          href="/colaboradores"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para colaboradores
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 grid grid-rows-2 grid-cols-1 gap-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <UserRound className="w-6 h-6 text-slate-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {colaborador.nome}
          </h1>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Setor:</span>{" "}
            {colaborador.setor || "-"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <BriefcaseBusiness className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Cargo:</span>{" "}
            {colaborador.cargo || "-"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Matrícula:</span>{" "}
            {colaborador.matricula ?? "-"}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {/* Filtro Global - Posicionado acima do título */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Busca Global */}
            <input
              type="text"
              placeholder="Buscar por nome ou NR..."
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Filtro de Status Global */}
            <select
              value={statusGlobalFiltro ?? ""}
              onChange={(e) =>
                setStatusGlobalFiltro(e.target.value || null)
              }
              className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os status</option>
              <option value="Em dia">Em dia</option>
              <option value="Prestes a vencer">Prestes a vencer</option>
              <option value="Vencido">Vencido</option>
              <option value="Pendente">Pendente</option>
            </select>

            {/* Filtro de Visualização Global */}
            <select
              value={visualizacaoGlobal}
              onChange={(e) =>
                setVisualizacaoGlobal(
                  e.target.value as "todos" | "atuais" | "historico",
                )
              }
              className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos (Atuais + Histórico)</option>
              <option value="atuais">Apenas Atuais</option>
              <option value="historico">Apenas Histórico</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            Treinamentos
          </h2>
          <Button onClick={() => setOpenTreinamento(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar treinamento
          </Button>
        </div>

        {/* Treinamentos Atuais */}
        {visualizacaoGlobal !== "historico" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Atuais
              </Badge>
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Treinamento / NR
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Data
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Validade
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Carga (h)
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-sm font-semibold text-slate-600">
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
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="max-w-85 px-4 py-2.5 text-sm font-medium text-slate-900">
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
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {t.dataFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            {t.validadeFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          {t.carga_horaria ?? "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`font-medium ${statusBadge(t.status)}`}
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setEditingTreinamento(t);
                                setOpenTreinamento(true);
                              }}
                              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Treinamento / NR
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Data
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Validade
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Carga (h)
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right text-sm font-semibold text-slate-600">
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
                      treinamentosHistoricoFiltrados.map((t: TreinamentoProfileRow) => (
                      <tr
                        key={t.id}
                        className="border-t border-slate-100 hover:bg-slate-50 opacity-75"
                      >
                        <td className="max-w-85 px-4 py-2.5 text-sm font-medium text-slate-900">
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
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {t.dataFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            {t.validadeFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          {t.carga_horaria ?? "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`font-medium ${statusBadge(t.status)}`}
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setEditingTreinamento(t);
                                setOpenTreinamento(true);
                              }}
                              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">ASOs</h2>
          <Button onClick={() => setOpenASO(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar ASO
          </Button>
        </div>

        {/* ASOs Atuais */}
        {visualizacaoGlobal !== "historico" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Atuais
              </Badge>
            </h3>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Tipo de ASO
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Data
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Validade
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Clinica
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-sm font-semibold text-slate-600">
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
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5 text-sm text-slate-900 whitespace-nowrap">
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
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {a.dataFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            {a.validadeFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          {a.clinica ?? "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`font-medium ${statusBadge(a.status)}`}
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setEditingASO(a);
                                setOpenASO(true);
                              }}
                              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Tipo de ASO
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Data
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Validade
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Clinica
                      </th>
                      <th className="px-4 py-2.5 text-left text-sm font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right text-sm font-semibold text-slate-600">
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
                        className="border-t border-slate-100 hover:bg-slate-50 opacity-75"
                      >
                        <td className="px-4 py-2.5 text-sm text-slate-900 whitespace-nowrap">
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
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {a.dataFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            {a.validadeFmt}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                          {a.clinica ?? "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`font-medium ${statusBadge(a.status)}`}
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setEditingASO(a);
                                setOpenASO(true);
                              }}
                              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
