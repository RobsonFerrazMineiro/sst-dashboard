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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { TipoASO } from "@/types/dashboard";
import { toast } from "sonner";

type ASOEdit = {
  id: string;
  tipoASO_id?: string | null;
  data_aso?: string | null;
  validade_aso?: string | null;
  clinica?: string | null;
  observacao?: string | null;
};

export default function AddASOModal({
  open,
  onOpenChange,
  colaborador,
  tiposASO,
  onSaved,
  aso,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  colaborador: { id: string; nome: string; setor: string; cargo: string };
  tiposASO: TipoASO[];
  onSaved: () => Promise<void> | void;
  aso?: ASOEdit | null;
}) {
  const isEdit = !!aso?.id;

  const [tipoId, setTipoId] = useState("");
  const [dataASO, setDataASO] = useState("");
  const [validade, setValidade] = useState("");
  const [clinica, setClinica] = useState("");
  const [observacao, setObservacao] = useState("");

  // ✅ Preenche o formulário quando abrir (e quando mudar o ASO selecionado)
  useEffect(() => {
    if (!open) return;

    if (aso) {
      setTipoId(aso.tipoASO_id ?? "");
      setDataASO(aso.data_aso ? aso.data_aso.slice(0, 10) : "");
      setValidade(aso.validade_aso ? aso.validade_aso.slice(0, 10) : "");
      setClinica(aso.clinica ?? "");
      setObservacao(aso.observacao ?? "");
    } else {
      setTipoId("");
      setDataASO("");
      setValidade("");
      setClinica("");
      setObservacao("");
    }
  }, [open, aso]);

  const tipoSelecionado = useMemo(() => {
    return tiposASO.find((t) => t.id === tipoId) ?? null;
  }, [tipoId, tiposASO]);

  const canSave = useMemo(() => {
    return !!tipoId && !!dataASO;
  }, [tipoId, dataASO]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        colaborador_id: colaborador.id,
        colaborador_nome: colaborador.nome,
        setor: colaborador.setor,
        cargo: colaborador.cargo,

        tipoASO_id: tipoId,
        tipoASO_nome: tipoSelecionado?.nome ?? null,

        data_aso: dataASO,
        validade_aso: validade || null,
        clinica: clinica.trim() ? clinica.trim() : null,
        observacao: observacao.trim() ? observacao.trim() : null,
      };

      return isEdit
        ? api.asos.update(aso!.id, payload as any)
        : api.asos.create(payload as any);
    },
    onSuccess: async () => {
      toast.success(aso?.id ? "ASO atualizado!" : "ASO criado!");
      await onSaved();
      onOpenChange(false);
      // limpa
      setTipoId("");
      setDataASO("");
      setValidade("");
      setClinica("");
      setObservacao("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ASO" : "Adicionar ASO"}</DialogTitle>
          <DialogDescription>
            Informe os dados do ASO realizado pelo colaborador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de ASO *
            </label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {tiposASO.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Data do ASO *
              </label>
              <Input
                type="date"
                value={dataASO}
                onChange={(e) => setDataASO(e.target.value)}
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Clínica
            </label>
            <Input
              value={clinica}
              onChange={(e) => setClinica(e.target.value)}
              placeholder="Nome da clínica"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Observação
            </label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações..."
            />
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
