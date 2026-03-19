"use client";

import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createRealPendingsList,
  filterGroupsByStatus,
  getStatusColorClasses,
  groupPendingsByColaborador,
} from "@/lib/unified-pending";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

interface GeneralPendenciesProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
  isLoading?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Vencido":
      return <AlertCircle className="w-4 h-4" />;
    case "Prestes a vencer":
      return <Clock className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "Vencido":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Prestes a vencer":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function GeneralPendencies({
  asos,
  treinamentos,
  isLoading = false,
}: GeneralPendenciesProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<
    "todos" | "vencidos" | "vencendo" | "pendencias"
  >("todos");
  const [expandedColaboradores, setExpandedColaboradores] = useState<
    Set<string>
  >(new Set());

  // Cria lista de apenas pendências reais
  const realPendingsList = useMemo(
    () => createRealPendingsList(asos, treinamentos),
    [asos, treinamentos],
  );

  // Agrupa por colaborador
  const groupedPendencies = useMemo(
    () => groupPendingsByColaborador(realPendingsList),
    [realPendingsList],
  );

  // Filtra grupos por tipo de status
  const filteredGroups = useMemo(
    () => filterGroupsByStatus(groupedPendencies, filterType),
    [groupedPendencies, filterType],
  );

  const toggleExpandir = (colaboradorId: string | null) => {
    if (colaboradorId) {
      const newSet = new Set(expandedColaboradores);
      if (newSet.has(colaboradorId)) {
        newSet.delete(colaboradorId);
      } else {
        newSet.add(colaboradorId);
      }
      setExpandedColaboradores(newSet);
    }
  };

  const handleNavegaColaborador = (colaboradorId: string | null) => {
    if (colaboradorId) {
      router.push(`/colaboradores/${colaboradorId}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm mb-6">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            Pendências Gerais
          </h2>
          <div className="flex flex-wrap gap-2">
            {["todos", "vencidos", "vencendo", "pendencias"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setFilterType(filter as typeof filterType);
                  setExpandedColaboradores(new Set());
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === filter
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {filter === "todos" && "Todos"}
                {filter === "vencidos" && "Vencidos"}
                {filter === "vencendo" && "Vencendo"}
                {filter === "pendencias" && "Pendências"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            Carregando pendências...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">Nenhuma pendência</p>
            <p className="text-slate-500 text-sm mt-1">
              Todos os colaboradores estão em dia!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredGroups.map((group) => {
              const isExpanded = expandedColaboradores.has(
                group.colaboradorId || "",
              );

              return (
                <div key={group.colaboradorId || group.colaborador}>
                  {/* Linha compacta do colaborador */}
                  <div className="px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      {/* Info do colaborador */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {/* Nome clicável */}
                          <button
                            onClick={() =>
                              handleNavegaColaborador(group.colaboradorId)
                            }
                            className="text-sm font-semibold text-slate-900 hover:text-emerald-600 hover:underline transition-colors text-left"
                          >
                            {group.colaborador}
                          </button>

                          {/* Total de pendências */}
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                            {group.totalCount}{" "}
                            {group.totalCount === 1 ? "item" : "itens"}
                          </span>
                        </div>

                        {/* Resumo de status */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.vencidosCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-rose-50 text-rose-700 border-rose-200 text-xs"
                            >
                              {group.vencidosCount} vencido
                              {group.vencidosCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {group.vendoCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            >
                              {group.vendoCount} vencendo
                            </Badge>
                          )}
                          {group.pendentesCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-700 border-slate-200 text-xs"
                            >
                              {group.pendentesCount} pendente
                              {group.pendentesCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Botão de expandir */}
                      <Button
                        onClick={() => toggleExpandir(group.colaboradorId)}
                        variant="ghost"
                        size="sm"
                        className="shrink-0 p-2 hover:bg-slate-100"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-600" />
                        )}
                      </Button>
                    </div>

                    {/* Painel expandido com itens horizontais */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="overflow-x-auto">
                          <div className="flex gap-3 min-w-min pb-2">
                            {group.items.map((item) => {
                              const colors = getStatusColorClasses(item.status);
                              return (
                                <div
                                  key={`${item.type}-${item.id}`}
                                  className={`shrink-0 p-3 rounded-lg border w-72 ${colors.bg}`}
                                >
                                  <div className="space-y-2">
                                    {/* Tipo e Status */}
                                    <div className="flex items-center justify-between gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {item.type === "aso"
                                          ? "ASO"
                                          : "Treinamento"}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <div className={colors.text}>
                                          {getStatusIcon(item.status)}
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${getStatusBadgeColor(
                                            item.status,
                                          )}`}
                                        >
                                          {item.status}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Descrição */}
                                    <p className="text-sm font-medium text-slate-900">
                                      {item.descricao}
                                    </p>

                                    {/* Validade */}
                                    <p className="text-xs text-slate-600">
                                      Validade:{" "}
                                      <span className="font-semibold">
                                        {formatDate(item.validade)}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
