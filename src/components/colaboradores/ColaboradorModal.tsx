"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Colaborador = {
  id: string;
  nome: string;
  setor: string;
  cargo: string;
  matricula?: string | null;
};

export default function ColaboradorModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Colaborador | null;
  onSaved?: () => Promise<void> | void;
}) {
  const qc = useQueryClient();

  const isEdit = !!initial?.id;

  const [formData, setFormData] = useState({
    nome: "",
    setor: "",
    cargo: "",
    matricula: "",
    error: null as string | null,
  });

  const resetForm = useCallback(() => {
    setFormData({
      nome: initial?.nome ?? "",
      setor: initial?.setor ?? "",
      cargo: initial?.cargo ?? "",
      matricula: initial?.matricula ?? "",
      error: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const payload = useMemo(() => {
    return {
      nome: formData.nome.trim(),
      setor: formData.setor.trim(),
      cargo: formData.cargo.trim(),
      matricula: formData.matricula.trim() ? formData.matricula.trim() : null,
    };
  }, [formData]);

  const mutation = useMutation({
    mutationFn: async () => {
      setFormData((prev) => ({ ...prev, error: null }));

      if (!payload.nome) throw new Error("Nome é obrigatório");
      if (!payload.setor) throw new Error("Setor é obrigatório");
      if (!payload.cargo) throw new Error("Cargo é obrigatório");

      if (isEdit && initial?.id) {
        return api.colaboradores.update(initial.id, payload);
      }

      return api.colaboradores.create(payload);
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Colaborador atualizado!" : "Colaborador criado!");
      await qc.invalidateQueries({ queryKey: ["colaboradores"] });
      onOpenChange(false);
      await onSaved?.();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setFormData((prev) => ({ ...prev, error: message }));
      toast.error(message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar colaborador" : "Novo colaborador"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados básicos do colaborador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setor">Setor *</Label>
            <Input
              id="setor"
              value={formData.setor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, setor: e.target.value }))
              }
              placeholder="Ex: Operação"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cargo">Cargo *</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cargo: e.target.value }))
              }
              placeholder="Ex: Operador"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={formData.matricula}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, matricula: e.target.value }))
              }
              placeholder="Ex: MAT-0001 (opcional)"
            />
          </div>

          {formData.error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {formData.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className={cn(mutation.isPending && "opacity-80")}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
