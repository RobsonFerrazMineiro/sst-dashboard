"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    setNome(initial?.nome ?? "");
    setValidadeMeses(
      initial?.validadeMeses !== null && initial?.validadeMeses !== undefined
        ? String(initial.validadeMeses)
        : "",
    );
    setDescricao(initial?.descricao ?? "");
    setFieldErrors({});
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
      const nextErrors: Record<string, string> = {};
      if (!payload.nome) nextErrors.nome = "Nome é obrigatório";

      if (payload.validadeMeses !== null) {
        if (
          !Number.isFinite(payload.validadeMeses) ||
          payload.validadeMeses < 0
        ) {
          nextErrors.validadeMeses = "Validade inválida";
        }
      }
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        throw new Error(Object.values(nextErrors)[0]);
      }
      setFieldErrors({});

      if (isEdit) {
        return api.tiposASO.update(initial!.id, payload);
      }

      return api.tiposASO.create(payload);
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Tipo de ASO atualizado!" : "Tipo de ASO criado!");
      await qc.invalidateQueries({ queryKey: ["tiposASO"] });
      await onSaved();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar tipo");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tipo de ASO" : "Novo tipo de ASO"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Cadastre o tipo de ASO para usar nos ASOs. Validade é obrigatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-aso-nome">Nome *</Label>
            <Input
              id="tipo-aso-nome"
              name="nomeTipoASO"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Admissional"
              className="bg-slate-50 border-slate-200"
            />
            {fieldErrors.nome && (
              <p className="text-xs text-rose-600">{fieldErrors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo-aso-validade">Validade (meses)</Label>
            <Input
              id="tipo-aso-validade"
              name="validadeMesesTipoASO"
              value={validadeMeses}
              onChange={(e) => setValidadeMeses(e.target.value)}
              placeholder="Ex: 12"
              inputMode="numeric"
              className="bg-slate-50 border-slate-200"
            />
            <p className="text-xs text-slate-500">
              Deixe vazio para “sem validade definida”.
            </p>
            {fieldErrors.validadeMeses && (
              <p className="text-xs text-rose-600">
                {fieldErrors.validadeMeses}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Descrição
            </label>
            <Textarea
              id="tipo-aso-descricao"
              name="descricaoTipoASO"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Observações sobre o tipo de ASO..."
              className="bg-slate-50 border-slate-200 min-h-22.5"
            />
          </div>

          <p className="text-xs text-slate-500">* Campos obrigatórios</p>
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
