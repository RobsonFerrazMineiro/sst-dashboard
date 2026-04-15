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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { AccessRoleOption, EmpresaUser } from "@/types/access";
import { toast } from "sonner";

export default function UsuarioModal({
  open,
  onOpenChange,
  initial,
  papeis,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EmpresaUser | null;
  papeis: AccessRoleOption[];
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;
  const isOwner = initial?.isAccountOwner ?? false;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papelCodigo, setPapelCodigo] = useState("LEITOR");
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");

  useEffect(() => {
    if (!open) return;

    setNome(initial?.nome ?? "");
    setEmail(initial?.email ?? "");
    setSenha("");
    setPapelCodigo(initial?.papel?.codigo ?? "LEITOR");
    setStatus(initial?.status === "INATIVO" ? "INATIVO" : "ATIVO");
  }, [open, initial]);

  const payload = useMemo(
    () => ({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      papelCodigo,
      status,
    }),
    [email, nome, papelCodigo, senha, status],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payload.nome || !payload.email) {
        throw new Error("Nome e email sao obrigatorios");
      }

      if (!isEdit && payload.senha.trim().length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }

      if (isEdit && initial) {
        return api.usuarios.update(initial.id, {
          nome: payload.nome,
          email: payload.email,
          papelCodigo: isOwner ? undefined : payload.papelCodigo,
          status: isOwner ? undefined : payload.status,
        });
      }

      return api.usuarios.create({
        nome: payload.nome,
        email: payload.email,
        senha: payload.senha,
        papelCodigo: payload.papelCodigo,
      });
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Usuario atualizado!" : "Usuario criado!");
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar usuario",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar usuario" : "Novo usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados, perfil e status do usuario da empresa."
              : "Crie um novo usuario para a empresa autenticada."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="usuario-nome">Nome</Label>
            <Input
              id="usuario-nome"
              name="nomeUsuarioEmpresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Oliveira"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="usuario-email">Email</Label>
            <Input
              id="usuario-email"
              name="emailUsuarioEmpresa"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@empresa.com"
            />
          </div>

          {!isEdit ? (
            <div className="grid gap-2">
              <Label htmlFor="usuario-senha">Senha inicial</Label>
              <Input
                id="usuario-senha"
                name="senhaUsuarioEmpresa"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Minimo de 8 caracteres"
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="usuario-papel">Perfil</Label>
            <Select
              value={papelCodigo}
              onValueChange={setPapelCodigo}
              disabled={isOwner}
            >
              <SelectTrigger
                id="usuario-papel"
                aria-label="Selecionar perfil do usuario"
                className="w-full"
              >
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {papeis.map((papel) => (
                  <SelectItem key={papel.id} value={papel.codigo}>
                    {papel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit ? (
            <div className="grid gap-2">
              <Label htmlFor="usuario-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "ATIVO" | "INATIVO")}
                disabled={isOwner}
              >
                <SelectTrigger
                  id="usuario-status"
                  aria-label="Selecionar status do usuario"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {isOwner ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              O proprietario da conta permanece protegido nesta fase. Perfil e
              status nao podem ser alterados.
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
