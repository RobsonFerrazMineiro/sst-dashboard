"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import type { Alert } from "./AlertsHub";

interface AlertsModalContentProps {
  alerts: Alert[];
}

export default function AlertsModalContent({
  alerts,
}: AlertsModalContentProps) {
  const getSeverityIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-rose-50 border-rose-200 border-l-4 border-l-rose-500";
      case "warning":
        return "bg-amber-50 border-amber-200 border-l-4 border-l-amber-500";
      case "info":
        return "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500";
    }
  };

  const getSeverityLabel = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "Crítico";
      case "warning":
        return "Aviso";
      case "info":
        return "Informação";
    }
  };

  const getSeverityBadgeColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-rose-100 text-rose-800";
      case "warning":
        return "bg-amber-100 text-amber-800";
      case "info":
        return "bg-blue-100 text-blue-800";
    }
  };

  // Renderizar mensagem com nome do colaborador como link clicável
  const renderAlertMessage = (alert: Alert) => {
    if (!alert.colaborador) {
      return (
        <span className="text-sm font-medium text-slate-900">
          {alert.message}
        </span>
      );
    }

    // Extrair o nome do colaborador da mensagem e criar um link
    const parts = alert.message.split(alert.colaborador);

    return (
      <p className="text-sm text-slate-900">
        {parts[0]}
        <Link
          href={`/colaboradores?search=${encodeURIComponent(alert.colaborador)}`}
          className="font-semibold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
          title={`Ver perfil de ${alert.colaborador}`}
        >
          {alert.colaborador}
        </Link>
        {parts[1]}
      </p>
    );
  };

  // Group alerts by severity
  const alertsBySeverity = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = [];
      }
      acc[alert.severity].push(alert);
      return acc;
    },
    {} as Record<Alert["severity"], Alert[]>,
  );

  const severityOrder: Alert["severity"][] = ["critical", "warning", "info"];

  return (
    <div className="space-y-4">
      {severityOrder.map((severity) => {
        const severityAlerts = alertsBySeverity[severity];
        if (!severityAlerts || severityAlerts.length === 0) return null;

        return (
          <div key={severity}>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              {getSeverityIcon(severity)}
              {getSeverityLabel(severity)} ({severityAlerts.length})
            </h3>

            <div className="space-y-2">
              {severityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-4 ${getSeverityColor(severity)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">{renderAlertMessage(alert)}</div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${getSeverityBadgeColor(
                        severity,
                      )}`}
                    >
                      {getSeverityLabel(severity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {alerts.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700 text-center">
            Nenhum alerta ativo. Sistema operando normalmente.
          </p>
        </div>
      )}
    </div>
  );
}
