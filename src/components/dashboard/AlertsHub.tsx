"use client";

import { Bell } from "lucide-react";
import { useEffect, useMemo } from "react";

import AlertsModalContent from "@/components/dashboard/AlertsModalContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastNotification } from "@/lib/notification-manager";
import {
  createRealPendingsList,
  groupPendingsByColaborador,
} from "@/lib/unified-pending";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";
import { useState } from "react";

interface AlertsHubProps {
  asos: AsoRecord[];
  treinamentos: TreinamentoRecord[];
  isLoading?: boolean;
}

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  colaborador?: string;
  type: "vencido" | "volume" | "soon_expire";
};

export default function AlertsHub({
  asos,
  treinamentos,
  isLoading = false,
}: AlertsHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  const alerts = useMemo<Alert[]>(() => {
    if (isLoading) return [];

    const allPendings = createRealPendingsList(asos, treinamentos);
    const grouped = groupPendingsByColaborador(allPendings);

    const generatedAlerts: Alert[] = [];

    // Alert Type 1: Colaboradores críticos (>=2 vencidos) - CRITICAL
    const colaboradorCriticos = grouped.filter(
      (group) => group.vencidosCount >= 2,
    );

    colaboradorCriticos.slice(0, 5).forEach((group) => {
      generatedAlerts.push({
        id: `critico-${group.colaborador}`,
        severity: "critical",
        type: "vencido",
        message: `${group.colaborador} tem ${group.vencidosCount} pendência${group.vencidosCount > 1 ? "s" : ""} crítica${group.vencidosCount > 1 ? "s" : ""}`,
        colaborador: group.colaborador,
      });
    });

    // Alert Type 2: Volume crítico (>5 vencidos no total) - WARNING
    const totalVencidos = grouped.reduce((sum, g) => sum + g.vencidosCount, 0);
    if (totalVencidos > 5) {
      generatedAlerts.push({
        id: "volume-critico",
        severity: "warning",
        type: "volume",
        message: `${totalVencidos} registros vencidos na equipe`,
      });
    }

    // Alert Type 3: Itens vencendo em até 7 dias - WARNING
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
      generatedAlerts.push({
        id: "soon-expire",
        severity: "warning",
        type: "soon_expire",
        message: `${colaboradoresSoon.size} colaborador${colaboradoresSoon.size > 1 ? "es" : ""} com pendência${soon.length > 1 ? "s" : ""} vencendo em até 7 dias`,
      });
    }

    // Sort by severity: critical first, then warning
    generatedAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return generatedAlerts;
  }, [asos, treinamentos, isLoading]);

  // Show toasts with deduplication
  useEffect(() => {
    if (alerts.length === 0 || isLoading) return;

    // Show only critical alerts or first 2 most important
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    const toShow =
      criticalAlerts.length > 0
        ? criticalAlerts.slice(0, 1)
        : alerts.slice(0, 2);

    toShow.forEach((alert) => {
      // Use alert.id directly with hash for uniqueness
      const hash = btoa(`${alert.id}|${alert.message}`).substring(0, 8);
      const notificationId = `alert_${alert.id}_${hash}`;

      toastNotification[alert.severity === "critical" ? "error" : "warning"](
        alert.message,
        {
          id: notificationId,
          description: alert.colaborador
            ? `Colaborador: ${alert.colaborador}`
            : undefined,
          deduplicateFor: 24 * 60 * 60 * 1000, // 24 horas
        },
      );
    });
  }, [alerts, isLoading]);

  if (alerts.length === 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative mr-2"
        title="Ver alertas"
      >
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-rose-600 rounded-full">
            {alerts.length}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas ({alerts.length})
            </DialogTitle>
          </DialogHeader>

          <AlertsModalContent alerts={alerts} />
        </DialogContent>
      </Dialog>
    </>
  );
}
