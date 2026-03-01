"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [cargo, setCargo] = useState("");
  const [matricula, setMatricula] = useState("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);

    setNome(initial?.nome ?? "");
    setSetor(initial?.setor ?? "");
    setCargo(initial?.cargo ?? "");
    setMatricula(initial?.matricula ?? "");
  }, [open, initial]);

  const payload = useMemo(() => {
    return {
      nome: nome.trim(),
      setor: setor.trim(),
      cargo: cargo.trim(),
      matricula: matricula.trim() ? matricula.trim() : null,
    };
  }, [nome, setor, cargo, matricula]);

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);

      if (!payload.nome) throw new Error("Nome é obrigatório");
      if (!payload.setor) throw new Error("Setor é obrigatório");
      if (!payload.cargo) throw new Error("Cargo é obrigatório");

      if (isEdit && initial?.id) {
        return api.colaboradores.update(initial.id, payload);
      }

      return api.colaboradores.create(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["colaboradores"] });
      onOpenChange(false);
      await onSaved?.();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Erro ao salvar");
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
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setor">Setor *</Label>
            <Input
              id="setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              placeholder="Ex: Operação"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cargo">Cargo *</Label>
            <Input
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Operador"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ex: MAT-0001 (opcional)"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {error}
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
