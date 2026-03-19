"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PendingFilterType, PendingItem } from "@/lib/dashboard-analytics";
import { getStatusColor } from "@/lib/dashboard-analytics";

interface PendingListProps {
  items: PendingItem[];
  filterType: PendingFilterType;
  onFilterChange: (filter: PendingFilterType) => void;
  isLoading?: boolean;
}

const filterOptions = [
  { value: "todos" as const, label: "Todos", count: null },
  { value: "vencidos" as const, label: "Vencidos", count: null },
  { value: "vencendo" as const, label: "Vencendo", count: null },
  { value: "pendencias" as const, label: "Pendências", count: null },
];

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

export default function PendingList({
  items,
  filterType,
  onFilterChange,
  isLoading = false,
}: PendingListProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header com filtros */}
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            Pendências Gerais
          </h2>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === option.value
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            Carregando pendências...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">
              Nenhuma pendência nesta categoria
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Todos os registros estão em dia!
            </p>
          </div>
        ) : (
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
              {items.map((item) => {
                const colors = getStatusColor(item.status);
                return (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Status com ícone */}
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

                    {/* Colaborador */}
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {item.colaborador}
                      </p>
                    </td>

                    {/* Tipo */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">
                        {item.type === "aso" ? "ASO" : "Treinamento"}
                      </Badge>
                    </td>

                    {/* Descrição */}
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs">
                        {item.descricao}
                      </p>
                    </td>

                    {/* Validade */}
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
        )}
      </div>
    </div>
  );
}
