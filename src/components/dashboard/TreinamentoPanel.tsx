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
import { getTrainingStatus } from "@/lib/validity";
import type {
  ColumnDef,
  TipoTreinamento,
  TreinamentoRecord,
} from "@/types/dashboard";
import { exportToCSV } from "@/utils/csvExport";

type StatusTreino =
  | "Em dia"
  | "Prestes a vencer"
  | "Vencido"
  | "Sem vencimento";

type ProcessedTreinamento = TreinamentoRecord & {
  status: StatusTreino;
  data_treinamento_formatted: string;
  validade_formatted: string;
  tipo_display: string;
  tipo_nr: string;
};

function getStatus(validadeStr?: string | null): StatusTreino {
  return (
    (getTrainingStatus(validadeStr) as unknown as StatusTreino) ||
    "Sem vencimento"
  );
}

export default function TreinamentoPanel({
  data,
  isLoading,
  tiposTreinamento = [],
}: {
  data: TreinamentoRecord[];
  isLoading: boolean;
  tiposTreinamento?: TipoTreinamento[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [nrFilter, setNrFilter] = useState("todos");
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

  const handleNrFilterChange = (value: string) => {
    setNrFilter(value);
    setCurrentPage(1);
  };

  const tiposMap = useMemo(() => {
    const map: Record<string, TipoTreinamento> = {};
    tiposTreinamento.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [tiposTreinamento]);

  // ✅ pega apenas o último treinamento por (colaborador + tipoTreinamento/nr)
  const processedData: ProcessedTreinamento[] = useMemo(() => {
    const grouped = new Map<string, TreinamentoRecord>();

    for (const treinamento of data) {
      if (!treinamento.colaborador_id) continue;

      const key = `${treinamento.colaborador_id}-${treinamento.tipoTreinamento ?? treinamento.nr ?? "sem-tipo"}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, treinamento);
        continue;
      }

      let currentDate: Date | null = null;
      let existingDate: Date | null = null;
      try {
        currentDate = treinamento.data_treinamento
          ? parseISO(treinamento.data_treinamento)
          : null;
        existingDate = existing.data_treinamento
          ? parseISO(existing.data_treinamento)
          : null;
      } catch {
        // ignore parsing errors
      }

      if (!currentDate) continue;
      if (!existingDate || currentDate > existingDate) {
        grouped.set(key, treinamento);
      }
    }

    return Array.from(grouped.values()).map((treinamento) => {
      const tipo = treinamento.tipoTreinamento
        ? tiposMap[treinamento.tipoTreinamento]
        : null;

      return {
        ...treinamento,
        status: getStatus(treinamento.validade),
        data_treinamento_formatted: formatDate(
          treinamento.data_treinamento,
          "-",
        ),
        validade_formatted: formatDate(treinamento.validade, "Indeterminada"),
        tipo_display: tipo
          ? `${tipo.nr} – ${tipo.nome}`
          : (treinamento.nr ?? "-"),
        tipo_nr: tipo ? tipo.nr : (treinamento.nr ?? "-"),
      };
    });
  }, [data, tiposMap]);

  const stats = useMemo(() => {
    const validData = processedData.filter(
      (t) => t.status !== "Sem vencimento",
    );
    const total = validData.length;
    const emDia = validData.filter((t) => t.status === "Em dia").length;
    const prestesVencer = validData.filter(
      (t) => t.status === "Prestes a vencer",
    ).length;
    const vencidos = validData.filter((t) => t.status === "Vencido").length;

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

  const nrs = useMemo(() => {
    const unique = [
      ...new Set(processedData.map((t) => t.tipo_nr).filter(Boolean)),
    ].sort();
    return [
      { value: "todos", label: "Todas as NRs" },
      ...unique.map((nr) => ({ value: nr, label: nr })),
    ];
  }, [processedData]);

  const filteredData = useMemo(() => {
    return processedData.filter((treinamento) => {
      const matchSearch = (treinamento.colaborador_nome ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "todos" || treinamento.status === statusFilter;
      const matchNR = nrFilter === "todos" || treinamento.tipo_nr === nrFilter;
      const matchCard = !activeCard || treinamento.status === activeCard;
      return matchSearch && matchStatus && matchNR && matchCard;
    });
  }, [processedData, searchTerm, statusFilter, nrFilter, activeCard]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const columns: ColumnDef<ProcessedTreinamento>[] = [
    { header: "Colaborador", accessor: "colaborador_nome" },
    { header: "Treinamento / NR", accessor: "tipo_display" },
    {
      header: "Data Treinamento",
      accessor: "data_treinamento_formatted",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {row.data_treinamento_formatted}
        </span>
      ),
    },
    {
      header: "Validade",
      accessor: "validade_formatted",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
          {row.validade_formatted}
        </span>
      ),
    },
    { header: "Status", accessor: "status" },
  ];

  const filters = [
    {
      value: nrFilter,
      onChange: handleNrFilterChange,
      placeholder: "NR",
      options: nrs,
    },
    {
      value: statusFilter,
      onChange: handleStatusFilterChange,
      placeholder: "Status",
      options: [
        { value: "todos", label: "Todos os status" },
        { value: "Em dia", label: "Em dia" },
        { value: "Prestes a vencer", label: "Prestes a vencer" },
        { value: "Vencido", label: "Vencido" },
        { value: "Sem vencimento", label: "Sem vencimento" },
      ],
    },
  ];

  const handleExportCSV = () =>
    exportToCSV(filteredData, "treinamentos", columns);

  const handleCardClick = (status: string) => {
    setActiveCard(activeCard === status ? null : status);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setNrFilter("todos");
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
          emptyMessage="Nenhum treinamento encontrado com os filtros selecionados"
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
