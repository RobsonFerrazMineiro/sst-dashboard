"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import ASOPanel from "@/components/dashboard/ASOPanel";
import TabNavigation from "@/components/dashboard/TabNavigation";
import TreinamentoPanel from "@/components/dashboard/TreinamentoPanel";
import RefreshButton from "@/components/ui/refresh-button";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"asos" | "treinamentos">("asos");

  const {
    data: asos = [],
    isLoading: loadingASOs,
    isError: isErrorASOs,
    error: errorASOs,
    refetch: refetchASOs,
    isFetching: fetchingASOs,
  } = useQuery({
    queryKey: ["asos"],
    queryFn: () => api.asos.list(), // ✅ wrapper
  });

  const {
    data: treinamentos = [],
    isLoading: loadingTreinamentos,
    isError: isErrorTreinamentos,
    error: errorTreinamentos,
    refetch: refetchTreinamentos,
    isFetching: fetchingTreinamentos,
  } = useQuery({
    queryKey: ["treinamentos"],
    queryFn: () => api.treinamentos.list(), // ✅ wrapper
  });

  const { data: tiposTreinamento = [] } = useQuery({
    queryKey: ["tipotreinamento"],
    queryFn: () => api.tiposTreinamento.list(), // ✅ wrapper (boa prática)
  });

  const handleRefresh = async () => {
    await Promise.all([refetchASOs(), refetchTreinamentos()]);
  };

  const hasError = isErrorASOs || isErrorTreinamentos;
  const errorMessage =
    (errorASOs as Error | undefined)?.message ||
    (errorTreinamentos as Error | undefined)?.message;

  const isRefreshing = fetchingASOs || fetchingTreinamentos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-linear-to-br from-teal-800 via-teal-300 to-lime-200 shadow-md shadow-emerald-200">
              <ShieldCheck className="w-14 h-14 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Gestão SST
              </h1>
              <p className="text-slate-500 mt-1">
                Controle de ASOs e Treinamentos de NRs
              </p>
            </div>
          </div>

          <RefreshButton
            isLoading={isRefreshing}
            onClick={handleRefresh}
            className="self-start sm:self-auto"
          />
        </div>

        {hasError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm mt-1">
              {errorMessage || "Erro desconhecido"}
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Content Panels */}
      <div className="transition-all duration-300">
        {activeTab === "asos" && (
          <ASOPanel data={asos} isLoading={loadingASOs} />
        )}

        {activeTab === "treinamentos" && (
          <TreinamentoPanel
            data={treinamentos}
            isLoading={loadingTreinamentos}
            tiposTreinamento={tiposTreinamento}
          />
        )}
      </div>
    </div>
  );
}
