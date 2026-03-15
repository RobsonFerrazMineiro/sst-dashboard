"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import React from "react";

interface RefreshButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  showLabel?: boolean;
  label?: string;
}

export default function RefreshButton({
  isLoading = false,
  showLabel = true,
  label = "Atualizar",
  disabled,
  onClick,
  className,
  ...props
}: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`gap-2 transition-all duration-300 ${className || ""}`}
      title={isLoading ? "Atualizando..." : "Clique para atualizar"}
      {...props}
    >
      <RefreshCw
        className={`w-4 h-4 transition-all duration-500 ${
          isLoading
            ? "animate-spin text-emerald-600"
            : "text-slate-600 group-hover:text-slate-700"
        }`}
      />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
