"use client";

import { AlertTriangle, Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";

import IndicatorCard from "@/components/dashboard/IndicatorCard";
import PendingList from "@/components/dashboard/PendingList";
import {
  calculateIndicators,
  createUnifiedPendingsList,
  filterPendingItems,
  type PendingFilterType,
} from "@/lib/dashboard-analytics";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";

interface DashboardPanelProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
  isLoadingASOs?: boolean;
  isLoadingTreinamentos?: boolean;
}

export default function DashboardPanel({
  asos,
  treinamentos,
  isLoadingASOs = false,
  isLoadingTreinamentos = false,
}: DashboardPanelProps) {
  const [filterType, setFilterType] = useState<PendingFilterType>("todos");

  // Calcula indicadores
  const indicators = useMemo(() => {
    return calculateIndicators(asos, treinamentos);
  }, [asos, treinamentos]);

  // Cria lista unificada de pendências
  const unifiedPendingsList = useMemo(() => {
    return createUnifiedPendingsList(asos, treinamentos);
  }, [asos, treinamentos]);

  // Filtra pendências baseado no filtro selecionado
  const filteredPendingsList = useMemo(() => {
    return filterPendingItems(unifiedPendingsList, filterType);
  }, [unifiedPendingsList, filterType]);

  const isLoading = isLoadingASOs || isLoadingTreinamentos;

  return (
    <div className="space-y-6">
      {/* Seção de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <IndicatorCard
          label="ASOs Vencidos"
          value={indicators.asoVencidos}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          onClick={() => setFilterType("vencidos")}
          isClickable
        />

        <IndicatorCard
          label="Treinamentos Vencidos"
          value={indicators.treinamentosVencidos}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          onClick={() => setFilterType("vencidos")}
          isClickable
        />

        <IndicatorCard
          label="Vencendo Próx. 30 dias"
          value={indicators.vencendoProximos30Dias}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
          onClick={() => setFilterType("vencendo")}
          isClickable
        />

        <IndicatorCard
          label="Colabs. com Pendências"
          value={indicators.colaboradoresComPendencias}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          onClick={() => setFilterType("pendencias")}
          isClickable
        />
      </div>

      {/* Seção de Pendências */}
      <PendingList
        items={filteredPendingsList}
        filterType={filterType}
        onFilterChange={setFilterType}
        isLoading={isLoading}
      />
    </div>
  );
}
