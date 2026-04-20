"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
import { api } from "@/lib/api";
import type { PendingColaborador } from "@/types/access";
import { toast } from "sonner";

/**
 * Modal de "Ativar primeiro acesso" para um colaborador pendente.
 *
 * O admin define o login (matrícula ou e-mail) e uma senha inicial.
 * O usuário é criado com perfil COLABORADOR e status INATIVO.
 * A ativação efetiva (ATIVO) fica para o segundo passo normal de edição.
 */
export default function AtivarColaboradorModal({
  colaborador,
  open,
  onOpenChange,
}: {
  colaborador: PendingColaborador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();

  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function resetForm() {
    setLogin("");
    setEmail("");
    setSenha("");
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!colaborador) throw new Error("Colaborador não selecionado");

      const loginInput = login.trim().toLowerCase();
      if (!loginInput) {
        throw new Error("Informe o login (e-mail ou matrícula) do colaborador");
      }
      if (senha.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }

      return api.usuarios.ativarColaborador({
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        login: loginInput,
        email: email.trim().toLowerCase() || undefined,
        senha,
      });
    },
    onSuccess: async () => {
      toast.success(
        "Acesso criado! O colaborador aparece agora como Inativo. Ative quando necessário.",
      );
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
      await qc.invalidateQueries({ queryKey: ["colaboradores", "pendentes"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar acesso",
      );
    },
  });

  function handleOpenChange(value: boolean) {
    if (!value) resetForm();
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ativar primeiro acesso</DialogTitle>
          <DialogDescription>
            {colaborador ? (
              <>
                Configure o acesso para{" "}
                <span className="font-medium text-slate-900">
                  {colaborador.nome}
                </span>
                {colaborador.matricula ? (
                  <>
                    {" "}
                    — matrícula{" "}
                    <span className="font-mono text-slate-700">
                      {colaborador.matricula}
                    </span>
                  </>
                ) : null}{" "}
                ({colaborador.cargo} · {colaborador.setor}).
                <br />O usuário será criado com perfil{" "}
                <strong>Colaborador</strong> e ficará <strong>inativo</strong>{" "}
                até ser ativado manualmente.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ativar-login">
              Login{" "}
              <span className="text-slate-400 text-xs font-normal">
                e-mail ou matrícula — usado para entrar no sistema
              </span>
            </Label>
            <Input
              id="ativar-login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder={
                colaborador?.matricula
                  ? `Ex: ${colaborador.matricula} ou email@empresa.com`
                  : "Ex: MAT-1001 ou email@empresa.com"
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ativar-email">
              E-mail de contato{" "}
              <span className="text-slate-400 text-xs font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="ativar-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ativar-senha">Senha inicial</Label>
            <Input
              id="ativar-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
            />
          </div>

          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Após criar, o colaborador aparecerá como <strong>Inativo</strong> na
            lista de acessos. Use o botão <strong>Reativar acesso</strong> para
            liberá-lo quando estiver pronto.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Criando acesso..." : "Criar acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
