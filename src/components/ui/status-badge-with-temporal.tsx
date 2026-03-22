import { Badge } from "@/components/ui/badge";
import type { StatusWithTemporal } from "@/lib/temporal-status";
import { cn } from "@/lib/utils";

interface StatusBadgeWithTemporalProps {
  statusInfo: StatusWithTemporal;
  className?: string;
  showTemporalBelow?: boolean; // Se true, temporal label fica abaixo em texto menor
}

/**
 * Badge de status com informação temporal integrada
 * Exibe status como badge e informação temporal abaixo ou ao lado
 *
 * Exemplo com showTemporalBelow=true:
 *   [ Em dia ]
 *   45 dias restantes
 *
 * Exemplo com showTemporalBelow=false:
 *   [ Em dia 45 dias restantes ]
 */
export function StatusBadgeWithTemporal({
  statusInfo,
  className,
  showTemporalBelow = true,
}: StatusBadgeWithTemporalProps) {
  const statusStyles: Record<string, string> = {
    "Em dia": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Prestes a vencer": "bg-amber-100 text-amber-700 border-amber-200",
    Vencido: "bg-rose-100 text-rose-700 border-rose-200",
    Pendente: "bg-slate-100 text-slate-700 border-slate-200",
    "Sem vencimento": "bg-blue-100 text-blue-700 border-blue-200",
  };

  const badgeClass = statusStyles[statusInfo.status] || statusStyles.Pendente;

  if (showTemporalBelow) {
    return (
      <div className={cn("flex flex-col items-start gap-1", className)}>
        <Badge variant="outline" className={badgeClass}>
          {statusInfo.status}
        </Badge>
        {statusInfo.temporalLabel && (
          <span className="text-xs text-gray-500 font-normal">
            {statusInfo.temporalLabel}
          </span>
        )}
      </div>
    );
  }

  // Exibe ao lado
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className={badgeClass}>
        {statusInfo.status}
      </Badge>
      {statusInfo.temporalLabel && (
        <span className="text-xs text-gray-500 font-normal">
          {statusInfo.temporalLabel}
        </span>
      )}
    </div>
  );
}
