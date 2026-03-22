"use client";

import { parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock3,
  FileDown,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import DataTable from "./DataTable";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import StatCard from "./StatCard";

import { formatDate } from "@/lib/utils";
import type { AsoRecord, ColumnDef } from "@/types/dashboard";
import { exportToCSV } from "@/utils/csvExport";

type ProcessedAso = AsoRecord & {
  status: "Em dia" | "Prestes a vencer" | "Vencido" | "Pendente";
  data_aso_formatted: string;
  validade_aso_formatted: string;
};

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function getStatus(
  validadeStr?: string | null,
  dataStr?: string | null,
): ProcessedAso["status"] {
  // Se não tem data_aso, consideramos pendente
  if (!dataStr) return "Pendente";

  // Se não tem validade, também é pendente (ou “Sem registro”, mas você usa Pendente)
  if (!validadeStr) return "Pendente";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  try {
    const validade = parseISO(validadeStr);
    validade.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "Vencido";
    if (diffDays <= 30) return "Prestes a vencer";
    return "Em dia";
  } catch {
    return "Pendente";
  }
}

export default function ASOPanel({
  data,
  isLoading,
}: {
  data: AsoRecord[];
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [setorFilter, setSetorFilter] = useState("todos");
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSetorFilterChange = (value: string) => {
    setSetorFilter(value);
    setCurrentPage(1);
  };

  // ✅ pega apenas o ASO mais recente por colaborador
  const processedData: ProcessedAso[] = useMemo(() => {
    const grouped = new Map<string, AsoRecord>();

    for (const aso of data) {
      if (!aso.colaborador_id) continue;

      const existing = grouped.get(aso.colaborador_id);
      if (!existing) {
        grouped.set(aso.colaborador_id, aso);
        continue;
      }

      const currentDate = toDateSafe(aso.data_aso);
      const existingDate = toDateSafe(existing.data_aso);

      // Se o atual não tem data válida, ignora
      if (!currentDate) continue;

      // Se o existente não tem data válida, substitui
      if (!existingDate || currentDate > existingDate) {
        grouped.set(aso.colaborador_id, aso);
      }
    }

    return Array.from(grouped.values()).map((aso) => ({
      ...aso,
      status: getStatus(aso.validade_aso, aso.data_aso),
      data_aso_formatted: formatDate(aso.data_aso, "Sem registro"),
      validade_aso_formatted: formatDate(aso.validade_aso, "Sem registro"),
    }));
  }, [data]);

  const stats = useMemo(() => {
    const validData = processedData.filter((a) => a.status !== "Pendente");
    const total = validData.length;
    const emDia = validData.filter((a) => a.status === "Em dia").length;
    const prestesVencer = validData.filter(
      (a) => a.status === "Prestes a vencer",
    ).length;
    const vencidos = validData.filter((a) => a.status === "Vencido").length;

    return {
      emDia: {
        count: emDia,
        percentage: total ? Math.round((emDia / total) * 100) : 0,
      },
      prestesVencer: {
        count: prestesVencer,
        percentage: total ? Math.round((prestesVencer / total) * 100) : 0,
      },
      vencidos: {
        count: vencidos,
        percentage: total ? Math.round((vencidos / total) * 100) : 0,
      },
    };
  }, [processedData]);

  const setores = useMemo(() => {
    const unique = [
      ...new Set(data.map((a) => a.setor).filter(Boolean)),
    ] as string[];
    return [
      { value: "todos", label: "Todos os setores" },
      ...unique.map((s) => ({ value: s, label: s })),
    ];
  }, [data]);

  const filteredData = useMemo(() => {
    return processedData.filter((aso) => {
      const matchSearch = (aso.colaborador_nome ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "todos" || aso.status === statusFilter;
      const matchSetor = setorFilter === "todos" || aso.setor === setorFilter;
      const matchCard = !activeCard || aso.status === activeCard;
      return matchSearch && matchStatus && matchSetor && matchCard;
    });
  }, [processedData, searchTerm, statusFilter, setorFilter, activeCard]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const columns: ColumnDef<ProcessedAso>[] = [
    { header: "Colaborador", accessor: "colaborador_nome" },
    { header: "Setor", accessor: "setor" },
    { header: "Cargo", accessor: "cargo" },
    {
      header: "Data ASO",
      accessor: "data_aso_formatted",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {row.data_aso_formatted}
        </span>
      ),
    },
    {
      header: "Validade",
      accessor: "validade_aso_formatted",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
          {row.validade_aso_formatted}
        </span>
      ),
    },
    { header: "Status", accessor: "status" },
  ];

  const filters = [
    {
      value: statusFilter,
      onChange: handleStatusFilterChange,
      placeholder: "Status",
      options: [
        { value: "todos", label: "Todos os status" },
        { value: "Em dia", label: "Em dia" },
        { value: "Prestes a vencer", label: "Prestes a vencer" },
        { value: "Vencido", label: "Vencido" },
        { value: "Pendente", label: "Pendente" },
      ],
    },
    {
      value: setorFilter,
      onChange: handleSetorFilterChange,
      placeholder: "Setor",
      options: setores,
    },
  ];

  const handleExportCSV = () => exportToCSV(filteredData, "asos", columns);

  const handleCardClick = (status: string) => {
    setActiveCard(activeCard === status ? null : status);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setSetorFilter("todos");
    setActiveCard(null);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Total: {filteredData.length} registro(s)
        </h2>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Em dia"
          count={stats.emDia.count}
          percentage={stats.emDia.percentage}
          icon={CheckCircle}
          variant="success"
          onClick={() => handleCardClick("Em dia")}
          isActive={activeCard === "Em dia"}
        />
        <StatCard
          title="Prestes a vencer"
          count={stats.prestesVencer.count}
          percentage={stats.prestesVencer.percentage}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => handleCardClick("Prestes a vencer")}
          isActive={activeCard === "Prestes a vencer"}
        />
        <StatCard
          title="Vencidos"
          count={stats.vencidos.count}
          percentage={stats.vencidos.percentage}
          icon={XCircle}
          variant="danger"
          onClick={() => handleCardClick("Vencido")}
          isActive={activeCard === "Vencido"}
        />
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nome do colaborador..."
        filters={filters}
        onClearFilters={clearFilters}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={isLoading}
          emptyMessage="Nenhum ASO encontrado com os filtros selecionados"
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
