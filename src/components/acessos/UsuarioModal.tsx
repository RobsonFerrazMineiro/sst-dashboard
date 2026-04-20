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

/** Papéis disponíveis no fluxo manual — COLABORADOR é excluído aqui */
const CODIGO_COLABORADOR = "COLABORADOR";

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

  // Filtra COLABORADOR da lista de papéis manuais
  const papeisManual = papeis.filter((p) => p.codigo !== CODIGO_COLABORADOR);

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papelCodigo, setPapelCodigo] = useState("TECNICO_SST");
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");

  useEffect(() => {
    if (!open) return;

    setNome(initial?.nome ?? "");
    setLogin(initial?.login ?? "");
    setEmail(initial?.email ?? "");
    setSenha("");
    // No edit: mantém o papel atual; se for COLABORADOR, não deixa editar aqui
    const codigoAtual = initial?.papel?.codigo ?? "TECNICO_SST";
    setPapelCodigo(
      codigoAtual === CODIGO_COLABORADOR ? "TECNICO_SST" : codigoAtual,
    );
    setStatus(initial?.status === "INATIVO" ? "INATIVO" : "ATIVO");
  }, [open, initial]);

  const payload = useMemo(
    () => ({
      nome: nome.trim(),
      login: login.trim().toLowerCase(),
      email: email.trim().toLowerCase() || undefined,
      senha,
      papelCodigo,
      status,
    }),
    [email, login, nome, papelCodigo, senha, status],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payload.nome || !payload.login) {
        throw new Error("Nome e login são obrigatórios");
      }

      if (!isEdit && payload.senha.trim().length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }

      if (isEdit && initial) {
        return api.usuarios.update(initial.id, {
          nome: payload.nome,
          login: isOwner ? undefined : payload.login,
          email: payload.email,
          papelCodigo: isOwner ? undefined : payload.papelCodigo,
          status: isOwner ? undefined : payload.status,
        });
      }

      return api.usuarios.create({
        nome: payload.nome,
        login: payload.login,
        email: payload.email,
        senha: payload.senha,
        papelCodigo: payload.papelCodigo,
      });
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Usuário atualizado!" : "Usuário criado!");
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar usuário",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar usuário" : "Novo usuário"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados, perfil e status do usuário da empresa."
              : 'Crie um acesso administrativo/técnico para a empresa. Para colaboradores, use o botão "Ativar primeiro acesso" na linha correspondente.'}
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
            <Label htmlFor="usuario-login">
              Login{" "}
              <span className="text-slate-400 text-xs font-normal">
                (e-mail ou matrícula)
              </span>
            </Label>
            <Input
              id="usuario-login"
              name="loginUsuarioEmpresa"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="maria@empresa.com ou MAT-1001"
              disabled={isOwner}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="usuario-email">
              E-mail de contato{" "}
              <span className="text-slate-400 text-xs font-normal">
                (opcional)
              </span>
            </Label>
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
                placeholder="Mínimo de 8 caracteres"
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
                aria-label="Selecionar perfil do usuário"
                className="w-full"
              >
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {papeisManual.map((papel) => (
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
                onValueChange={(value) =>
                  setStatus(value as "ATIVO" | "INATIVO")
                }
                disabled={isOwner}
              >
                <SelectTrigger
                  id="usuario-status"
                  aria-label="Selecionar status do usuário"
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Salvando..."
              : isEdit
                ? "Salvar"
                : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
