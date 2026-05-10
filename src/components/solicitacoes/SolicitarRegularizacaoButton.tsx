"use client";

import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ClipboardCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  tipo: "ASO" | "TREINAMENTO";
  referenciaId: string;
  /** Define o contexto do botão: item vencido ou prestes a vencer */
  modo: "vencido" | "prestes";
  /** Label opcional para mensagem de sucesso/erro */
  label?: string;
  /** Callback chamado após criação bem-sucedida */
  onSuccess?: () => void;
}

export function SolicitarRegularizacaoButton({
  tipo,
  referenciaId,
  modo,
  label,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isVencido = modo === "vencido";
  const texto = isVencido ? "Reportar Vencimento" : "Solicitar Agendamento";
  const Icon = isVencido ? ClipboardCheck : CalendarClock;
  const classes = isVencido
    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-400 focus-visible:ring-red-400"
    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-400 focus-visible:ring-amber-400";

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, referenciaId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        toast.info("Já existe uma solicitação aberta para este item.");
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao criar solicitação");
      }

      toast.success(
        label
          ? `Solicitação para "${label}" enviada!`
          : "Solicitação enviada com sucesso!",
      );

      void queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao solicitar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={handleClick}
      className={`shrink-0 ${classes}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      <span className="ml-1.5">{texto}</span>
    </Button>
  );
}
