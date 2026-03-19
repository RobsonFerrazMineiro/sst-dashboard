"use client";

import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  filterPendingsByStatus,
  getStatusColorClasses,
  type UnifiedPendingItem,
} from "@/lib/unified-pending";

interface GeneralPendenciesProps {
  items: UnifiedPendingItem[];
  isLoading?: boolean;
}

const INITIAL_LIMIT = 5;

function getStatusIcon(status: string) {
  switch (status) {
    case "Vencido":
      return <AlertCircle className="w-5 h-5" />;
    case "Prestes a vencer":
      return <Clock className="w-5 h-5" />;
    case "Em dia":
      return <CheckCircle2 className="w-5 h-5" />;
    default:
      return <AlertCircle className="w-5 h-5" />;
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

/**
 * Retorna classe de background baseado no status para destacar linhas
 */
function getRowBgClass(status: string): string {
  switch (status) {
    case "Vencido":
      return "bg-rose-50 hover:bg-rose-100";
    case "Prestes a vencer":
      return "bg-amber-50 hover:bg-amber-100";
    default:
      return "hover:bg-slate-50";
  }
}

export default function GeneralPendencies({
  items,
  isLoading = false,
}: GeneralPendenciesProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<
    "todos" | "vencidos" | "vencendo" | "pendencias"
  >("todos");
  const [expandAll, setExpandAll] = useState(false);

  const filteredItems = useMemo(
    () => filterPendingsByStatus(items, filterType),
    [items, filterType],
  );

  const displayItems = useMemo(
    () => filteredItems.slice(0, expandAll ? filteredItems.length : INITIAL_LIMIT),
    [filteredItems, expandAll],
  );

  const hasMore = filteredItems.length > INITIAL_LIMIT;

  const handleRowClick = (colaboradorId: string | null | undefined) => {
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
                  setExpandAll(false); // Reset ao trocar filtro
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
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Carregando pendências...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">Nenhuma pendência</p>
            <p className="text-slate-500 text-sm mt-1">
              Todos os registros estão em dia!
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Validade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayItems.map((item) => {
                  const colors = getStatusColorClasses(item.status);
                  const bgClass = getRowBgClass(item.status);
                  const colaboradorId = item.originalData.colaborador_id;

                  return (
                    <tr
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleRowClick(colaboradorId)}
                      className={`transition-colors cursor-pointer ${bgClass}`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={colors.text}>
                            {getStatusIcon(item.status)}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`${colors.bg} ${colors.text} border ${colors.border}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {item.colaborador}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">
                          {item.type === "aso" ? "ASO" : "Treinamento"}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs">
                          {item.descricao}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-600">
                          {formatDate(item.validade)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer com botão de "Ver todas" */}
            {hasMore && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Mostrando {displayItems.length} de {filteredItems.length} registros
                </p>
                <Button
                  onClick={() => setExpandAll(!expandAll)}
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  {expandAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Ver todas as pendências
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
