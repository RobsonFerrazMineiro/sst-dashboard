"use client";

import {
  createRealPendingsList,
  groupPendingsByColaborador,
} from "@/lib/unified-pending";
import { AsoRecord, TreinamentoRecord } from "@/types/dashboard";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface AutomaticAlertsProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
  isLoading?: boolean;
}

export function AutomaticAlerts({
  asos,
  treinamentos,
  isLoading,
}: AutomaticAlertsProps) {
  const alerts = useMemo(() => {
    if (isLoading) return [];

    const allPendings = createRealPendingsList(asos, treinamentos);
    const grouped = groupPendingsByColaborador(allPendings);

    const generatedAlerts: string[] = [];

    // Alert 1: Colaboradores críticos (>=2 vencidos)
    const colaboradorCriticos = grouped.filter(
      (group) => group.vencidosCount >= 2,
    );

    colaboradorCriticos.slice(0, 3).forEach((group) => {
      generatedAlerts.push(
        `${group.colaborador} tem ${group.vencidosCount} pendência${group.vencidosCount > 1 ? "s" : ""} crítica${group.vencidosCount > 1 ? "s" : ""}`,
      );
    });

    // Alert 2: Volume crítico (>5 vencidos no total)
    const totalVencidos = grouped.reduce((sum, g) => sum + g.vencidosCount, 0);
    if (totalVencidos > 5) {
      generatedAlerts.push(`${totalVencidos} registros vencidos na equipe`);
    }

    // Alert 3: Itens vencendo em até 7 dias
    const soon = allPendings.filter((item) => {
      if (item.status !== "Prestes a vencer") return false;
      if (!item.validade) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validadeDate = new Date(item.validade);
      validadeDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil(
        (validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntil <= 7 && daysUntil > 0;
    });

    if (soon.length > 0) {
      const colaboradoresSoon = new Set(soon.map((item) => item.colaborador));
      generatedAlerts.push(
        `${colaboradoresSoon.size} colaborador${colaboradoresSoon.size > 1 ? "es" : ""} com pendência${soon.length > 1 ? "s" : ""} vencendo em até 7 dias`,
      );
    }

    return generatedAlerts;
  }, [asos, treinamentos, isLoading]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            Alertas Automáticos
          </h3>
          <ul className="space-y-2">
            {alerts.map((alert, idx) => (
              <li
                key={idx}
                className="text-sm text-amber-800 flex items-start gap-2"
              >
                <span className="text-amber-600 mt-1">•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
