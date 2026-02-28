"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type TipoASO = {
  id: string;
  nome: string;
  validadeMeses: number | null;
  descricao: string | null;
};

export default function TipoASOModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: TipoASO | null;
  onSaved: () => Promise<void> | void;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;

  const [nome, setNome] = useState("");
  const [validadeMeses, setValidadeMeses] = useState<string>("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (!open) return;

    setNome(initial?.nome ?? "");
    setValidadeMeses(
      initial?.validadeMeses !== null && initial?.validadeMeses !== undefined
        ? String(initial.validadeMeses)
        : "",
    );
    setDescricao(initial?.descricao ?? "");
  }, [open, initial]);

  const payload = useMemo(() => {
    return {
      nome: nome.trim(),
      validadeMeses: validadeMeses.trim() === "" ? null : Number(validadeMeses),
      descricao: descricao.trim() === "" ? null : descricao.trim(),
    };
  }, [nome, validadeMeses, descricao]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payload.nome) throw new Error("Nome é obrigatório");

      if (payload.validadeMeses !== null) {
        if (
          !Number.isFinite(payload.validadeMeses) ||
          payload.validadeMeses < 0
        ) {
          throw new Error("Validade inválida");
        }
      }

      if (isEdit) {
        return api.tiposASO.update(initial!.id, payload);
      }

      return api.tiposASO.create(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tiposASO"] });
      await onSaved();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tipo de ASO" : "Novo tipo de ASO"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Admissional"
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Validade (meses)
            </label>
            <Input
              value={validadeMeses}
              onChange={(e) => setValidadeMeses(e.target.value)}
              placeholder="Ex: 12"
              inputMode="numeric"
              className="bg-slate-50 border-slate-200"
            />
            <p className="text-xs text-slate-500">
              Deixe vazio para “sem validade definida”.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Descrição
            </label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Observações sobre o tipo de ASO..."
              className="bg-slate-50 border-slate-200 min-h-22.5"
            />
          </div>

          {mutation.isError && (
            <div className="text-sm text-rose-600">
              {(mutation.error as Error).message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
