"use client";

import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type TipoTreinamento = {
  id: string;
  nome: string;
  nr: string;
  validadeMeses: number | null;
  descricao: string | null;
};

export default function TipoTreinamentoModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: TipoTreinamento | null;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!initial;

  const [nome, setNome] = useState("");
  const [nr, setNr] = useState("");
  const [validadeMeses, setValidadeMeses] = useState<string>("");
  const [descricao, setDescricao] = useState("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setNome(initial?.nome ?? "");
    setNr(initial?.nr ?? "");
    setValidadeMeses(
      initial?.validadeMeses === null || initial?.validadeMeses === undefined
        ? ""
        : String(initial.validadeMeses),
    );
    setDescricao(initial?.descricao ?? "");
  }, [open, initial]);

  const payload = useMemo(() => {
    const v = validadeMeses.trim();
    return {
      nome: nome.trim(),
      nr: nr.trim(),
      validadeMeses: v === "" ? null : Number(v),
      descricao: descricao.trim() === "" ? null : descricao.trim(),
    };
  }, [nome, nr, validadeMeses, descricao]);

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);

      if (!payload.nome) throw new Error("Nome é obrigatório.");
      if (!payload.nr) throw new Error("NR é obrigatória.");

      if (payload.validadeMeses !== null) {
        if (
          !Number.isFinite(payload.validadeMeses) ||
          payload.validadeMeses < 0
        ) {
          throw new Error("Validade em meses inválida.");
        }
      }

      if (isEdit && initial) {
        return api.tiposTreinamento.update(initial.id, payload);
      }
      return api.tiposTreinamento.create(payload);
    },
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
    onError: (e: any) => {
      setError(e?.message ?? "Erro ao salvar.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tipo" : "Novo tipo de treinamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do tipo (NR) que será usado nos registros de
            treinamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium text-slate-700">NR</label>
              <Input
                value={nr}
                onChange={(e) => setNr(e.target.value)}
                placeholder="NR-35"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nome</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Trabalho em Altura"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium text-slate-700">
                Validade (meses)
              </label>
              <Input
                value={validadeMeses}
                onChange={(e) => setValidadeMeses(e.target.value)}
                placeholder="24"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Descrição
              </label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do treinamento..."
                className="min-h-22.5"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            className="gap-2"
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
