"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { TipoTreinamento } from "@/types/dashboard";

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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: TipoTreinamento | null;
  onSaved: () => Promise<void> | void;
};

type FormState = {
  nome: string;
  nr: string;
  validadeMeses: string; // string pra Input number
  descricao: string;
};

function normalizeNR(value: string) {
  // aceita "nr-10", "NR10", "10" => "NR-10"
  const raw = value.trim().toUpperCase();
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return raw.replace(/\s+/g, "");
  const n = digits.padStart(2, "0");
  return `NR-${n}`;
}

export default function TipoTreinamentoModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>({
    nome: "",
    nr: "",
    validadeMeses: "",
    descricao: "",
  });

  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTouched(false);

    if (initial) {
      setForm({
        nome: initial.nome ?? "",
        nr: initial.nr ?? "",
        validadeMeses:
          initial.validadeMeses === null || initial.validadeMeses === undefined
            ? ""
            : String(initial.validadeMeses),
        descricao: initial.descricao ?? "",
      });
    } else {
      setForm({ nome: "", nr: "", validadeMeses: "", descricao: "" });
    }
  }, [open, initial]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.nr.trim()) e.nr = "NR é obrigatória";

    // validadeMeses opcional, mas se preencher precisa ser número >= 0
    if (form.validadeMeses.trim()) {
      const n = Number(form.validadeMeses);
      if (!Number.isFinite(n) || n < 0)
        e.validadeMeses = "Informe um número válido";
    }

    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<TipoTreinamento> = {
        nome: form.nome.trim(),
        nr: normalizeNR(form.nr),
        descricao: form.descricao.trim() ? form.descricao.trim() : null,
        validadeMeses: form.validadeMeses.trim()
          ? Number(form.validadeMeses)
          : null,
      };

      if (isEdit && initial?.id) {
        return api.tiposTreinamento.update(initial.id, payload);
      }
      return api.tiposTreinamento.create(payload);
    },
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });

  const onSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Tipo de Treinamento" : "Novo Tipo de Treinamento"}
          </DialogTitle>
          <DialogDescription>
            Cadastre o tipo (NR) para usar nos treinamentos. Validade é
            opcional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nr">NR</Label>
            <Input
              id="nr"
              value={form.nr}
              onChange={(e) => setForm((p) => ({ ...p, nr: e.target.value }))}
              placeholder="Ex.: NR-10"
              className="bg-slate-50 border-slate-200"
              onBlur={() => setTouched(true)}
            />
            {touched && errors.nr && (
              <p className="text-sm text-rose-600">{errors.nr}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex.: Segurança em Instalações Elétricas"
              className="bg-slate-50 border-slate-200"
              onBlur={() => setTouched(true)}
            />
            {touched && errors.nome && (
              <p className="text-sm text-rose-600">{errors.nome}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="validadeMeses">Validade (meses)</Label>
            <Input
              id="validadeMeses"
              inputMode="numeric"
              value={form.validadeMeses}
              onChange={(e) =>
                setForm((p) => ({ ...p, validadeMeses: e.target.value }))
              }
              placeholder="Ex.: 12"
              className="bg-slate-50 border-slate-200"
              onBlur={() => setTouched(true)}
            />
            {touched && errors.validadeMeses && (
              <p className="text-sm text-rose-600">{errors.validadeMeses}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) =>
                setForm((p) => ({ ...p, descricao: e.target.value }))
              }
              placeholder="Opcional…"
              className="bg-slate-50 border-slate-200 min-h-27.5"
            />
          </div>

          {saveMutation.isError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {(saveMutation.error as Error)?.message || "Erro ao salvar."}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
