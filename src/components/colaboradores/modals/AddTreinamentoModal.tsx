"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { TipoTreinamento, TreinamentoRecord } from "@/types/dashboard";

export default function AddTreinamentoModal({
  open,
  onOpenChange,
  colaborador,
  tiposTreinamento,
  onSaved,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  colaborador: { id: string; nome: string; setor: string; cargo: string };
  tiposTreinamento: TipoTreinamento[];
  onSaved: () => Promise<void> | void;
  initial?: TreinamentoRecord | null;
}) {
  const [tipoId, setTipoId] = useState<string>("");
  const [dataTreinamento, setDataTreinamento] = useState<string>("");
  const [validade, setValidade] = useState<string>("");
  const [carga, setCarga] = useState<string>("");

  // ✅ Prefill quando abrir pra editar
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setTipoId(initial.tipoTreinamento ?? "");

      setDataTreinamento(
        initial.data_treinamento ? initial.data_treinamento.slice(0, 10) : "",
      );

      setValidade(initial.validade ? initial.validade.slice(0, 10) : "");

      setCarga(
        initial.carga_horaria !== null && initial.carga_horaria !== undefined
          ? String(initial.carga_horaria)
          : "",
      );
    } else {
      setTipoId("");
      setDataTreinamento("");
      setValidade("");
      setCarga("");
    }
  }, [open, initial]);

  const tipoSelecionado = useMemo(() => {
    return tiposTreinamento.find((t) => t.id === tipoId) ?? null;
  }, [tipoId, tiposTreinamento]);

  const canSave = useMemo(
    () => !!tipoId && !!dataTreinamento,
    [tipoId, dataTreinamento],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<TreinamentoRecord> = {
        colaborador_id: colaborador.id,
        colaborador_nome: colaborador.nome,
        // setor/cargo não existem no schema de TreinamentoRecord (ok não mandar)

        tipoTreinamento: tipoId,
        nr: tipoSelecionado?.nr ?? null,

        data_treinamento: dataTreinamento,
        validade: validade || null,
        carga_horaria: carga ? Number(carga) : null,
      };

      // ✅ Se tem initial.id -> UPDATE, senão CREATE
      if (initial?.id) {
        return api.treinamentos.update(initial.id, payload);
      }

      return api.treinamentos.create(payload);
    },
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Editar Treinamento" : "Adicionar Treinamento"}
          </DialogTitle>
          <DialogDescription>
            Informe os dados do treinamento realizado pelo colaborador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de Treinamento *
            </label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {tiposTreinamento.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nr} – {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Data do Treinamento *
              </label>
              <Input
                type="date"
                value={dataTreinamento}
                onChange={(e) => setDataTreinamento(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Validade
              </label>
              <Input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Carga horária (h)
              </label>
              <Input
                inputMode="numeric"
                value={carga}
                onChange={(e) => setCarga(e.target.value)}
                placeholder="Ex.: 8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Info do tipo
              </label>
              <Input
                value={
                  tipoSelecionado
                    ? `Validade: ${tipoSelecionado.validadeMeses ?? "—"} mês(es)`
                    : "Selecione um tipo"
                }
                readOnly
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!canSave || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-rose-600">
              {(mutation.error as Error)?.message || "Erro ao salvar"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
