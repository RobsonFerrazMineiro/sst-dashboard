"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Shield } from "lucide-react";
import { useState } from "react";

import ASOPanel from "@/components/dashboard/ASOPanel";
import TabNavigation from "@/components/dashboard/TabNavigation";
import TreinamentoPanel from "@/components/dashboard/TreinamentoPanel";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"asos" | "treinamentos">("asos");

  const {
    data: asos = [],
    isLoading: loadingASOs,
    refetch: refetchASOs,
  } = useQuery({
    queryKey: ["asos"],
    queryFn: api.asos.list,
  });

  const {
    data: treinamentos = [],
    isLoading: loadingTreinamentos,
    refetch: refetchTreinamentos,
  } = useQuery({
    queryKey: ["treinamentos"],
    queryFn: api.treinamentos.list,
  });

  const { data: tiposTreinamento = [] } = useQuery({
    queryKey: ["tipotreinamento"],
    queryFn: api.tiposTreinamento.list,
  });

  const handleRefresh = () => {
    refetchASOs();
    refetchTreinamentos();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                <Shield className="w-8 h-8 text-white" />
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

            <Button
              variant="outline"
              onClick={handleRefresh}
              className="gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
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
    </div>
  );
}
