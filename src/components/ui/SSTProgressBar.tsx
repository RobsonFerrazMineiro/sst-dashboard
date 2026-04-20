"use client";

import { cn } from "@/lib/utils";

type SSTProgressBarProps = {
  /** Score SST de 0 a 100 */
  score: number;
  /** Exibe o percentual ao lado da barra (padrão: true) */
  showLabel?: boolean;
  className?: string;
};

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-rose-500";
}

function getTrackColor(score: number): string {
  if (score >= 80) return "bg-emerald-100";
  if (score >= 50) return "bg-amber-100";
  return "bg-rose-100";
}

function getLabel(score: number): string {
  if (score >= 80) return "Bom";
  if (score >= 50) return "Regular";
  return "Crítico";
}

/**
 * Barra de progresso visual para o Score SST (0–100).
 * Acessível via role="progressbar" com aria-valuenow.
 */
export function SSTProgressBar({
  score,
  showLabel = true,
  className,
}: SSTProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const barColor = getBarColor(clamped);
  const trackColor = getTrackColor(clamped);
  const label = getLabel(clamped);

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Score SST</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              clamped >= 80
                ? "text-emerald-600"
                : clamped >= 50
                  ? "text-amber-600"
                  : "text-rose-600",
            )}
          >
            {clamped}%{" "}
            <span className="font-normal text-slate-400">— {label}</span>
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score SST: ${clamped}% — ${label}`}
        className={cn("h-3 w-full rounded-full overflow-hidden", trackColor)}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            barColor,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
