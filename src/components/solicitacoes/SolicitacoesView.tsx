"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type StatusSolicitacao =
  | "PENDENTE"
  | "EM_ANALISE"
  | "AGENDADA"
  | "CONCLUIDA"
  | "CANCELADA";

type Solicitacao = {
  id: string;
  tipo: "ASO" | "TREINAMENTO";
  status: StatusSolicitacao;
  observacao: string | null;
  dataAgendada: string | null;
  criadoEm: string;
  atualizadoEm: string;
  referenciaId: string | null;
  referenciaNome: string;
  colaborador: {
    id: string;
    nome: string;
    cargo: string;
    setor: string;
  } | null;
};

const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  AGENDADA: "Agendada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<StatusSolicitacao, string> = {
  PENDENTE: "border-amber-300 bg-amber-50 text-amber-700",
  EM_ANALISE: "border-blue-300 bg-blue-50 text-blue-700",
  AGENDADA: "border-violet-300 bg-violet-50 text-violet-700",
  CONCLUIDA: "border-emerald-300 bg-emerald-50 text-emerald-700",
  CANCELADA: "border-slate-200 bg-slate-100 text-slate-500",
};

const STATUS_PROXIMOS: Record<StatusSolicitacao, StatusSolicitacao[]> = {
  PENDENTE: ["EM_ANALISE", "AGENDADA", "CANCELADA"],
  EM_ANALISE: ["AGENDADA", "CONCLUIDA", "CANCELADA"],
  AGENDADA: ["CONCLUIDA", "CANCELADA"],
  CONCLUIDA: [],
  CANCELADA: [],
};

function StatusBadge({ status }: { status: StatusSolicitacao }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function toDateInputValue(dateValue?: string | null): string {
  if (!dateValue) return "";
  const match = String(dateValue).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function EditarStatusModal({
  solicitacao,
  onClose,
  onSaved,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<StatusSolicitacao>(solicitacao.status);
  const [observacao, setObservacao] = useState(solicitacao.observacao ?? "");
  const [dataAgendada, setDataAgendada] = useState(
    toDateInputValue(solicitacao.dataAgendada),
  );
  const [loading, setLoading] = useState(false);

  const proximosStatus = STATUS_PROXIMOS[solicitacao.status];
  if (proximosStatus.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
          <h2 className="font-semibold text-slate-800">
            Solicitação finalizada
          </h2>
          <p className="text-sm text-slate-500">
            Esta solicitação já está{" "}
            <strong>{STATUS_LABELS[solicitacao.status]}</strong> e não pode ser
            alterada.
          </p>
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  async function handleSalvar() {
    if (status === "AGENDADA" && !dataAgendada) {
      toast.error("Informe a data agendada");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          observacao,
          ...(status === "AGENDADA" ? { dataAgendada } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Erro ao atualizar");
      toast.success("Solicitação atualizada!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="font-semibold text-slate-800">Atualizar solicitação</h2>
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Colaborador</p>
          <p className="text-sm font-medium text-slate-800">
            {solicitacao.colaborador?.nome ?? "—"}
          </p>
          <p className="text-xs text-slate-400">
            {solicitacao.tipo} · Status atual:{" "}
            <strong>{STATUS_LABELS[solicitacao.status]}</strong>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">
            Novo status
          </label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusSolicitacao)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {proximosStatus.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campo data agendada — exibido somente quando status = AGENDADA */}
        {status === "AGENDADA" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Data agendada <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">
            Observação{" "}
            <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Agendado para 15/05 na Clínica X"
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitacoesView() {
  const queryClient = useQueryClient();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("TODAS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [editando, setEditando] = useState<Solicitacao | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "TODAS") params.set("status", filtroStatus);
      if (filtroTipo !== "TODOS") params.set("tipo", filtroTipo);
      const res = await fetch(`/api/solicitacoes?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      setSolicitacoes(await res.json());
    } catch {
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroTipo]);

  function handleSaved() {
    void carregar();
    void queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
  }

  const pendentes = solicitacoes.filter((s) => s.status === "PENDENTE").length;

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Solicitações
              </h1>
              {pendentes > 0 && !loading && (
                <p className="text-sm text-amber-600 font-medium mt-0.5">
                  {pendentes} solicitaç{pendentes > 1 ? "ões" : "ão"} pendente
                  {pendentes > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <p className="text-slate-500 mt-1">
            Acompanhe e atualize as solicitações de regularização dos
            colaboradores.
          </p>
        </div>

        {/* Filtros e ações à direita */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              <SelectItem value="ASO">ASO</SelectItem>
              <SelectItem value="TREINAMENTO">Treinamento</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => void carregar()}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </header>

      {/* ── Tabela ── */}
      <div className="rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead className="border-b border-slate-300 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Agendado para
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Observação
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardCheck className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Nenhuma solicitação encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                solicitacoes.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">
                        {s.colaborador?.nome ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.colaborador?.cargo} · {s.colaborador?.setor}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 font-medium">
                        {s.referenciaNome}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.tipo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.dataAgendada ? (
                        <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded px-2 py-0.5">
                          {formatDate(s.dataAgendada, "—")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="text-xs text-slate-500 truncate">
                        {s.observacao ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-slate-500">
                        {formatDate(s.criadoEm, "—")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== "CONCLUIDA" && s.status !== "CANCELADA" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditando(s)}
                        >
                          Atualizar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de edição ── */}
      {editando && (
        <EditarStatusModal
          solicitacao={editando}
          onClose={() => setEditando(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
