"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { useMemo, useState } from "react";

import AccessDeniedState from "@/components/auth/AccessDeniedState";
import UsuarioModal from "@/components/acessos/UsuarioModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthPermissions } from "@/lib/permissions-client";
import type { EmpresaUser } from "@/types/access";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

function getStatusBadgeClass(status: EmpresaUser["status"]) {
  switch (status) {
    case "ATIVO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INATIVO":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export default function AcessosPage() {
  const qc = useQueryClient();
  const { hasRole, isLoading: loadingAuth } = useAuthPermissions();
  const isAdmin = hasRole("ADMIN");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmpresaUser | null>(null);

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.usuarios.list,
    enabled: isAdmin,
  });

  const papeisQuery = useQuery({
    queryKey: ["usuarios", "papeis"],
    queryFn: api.usuarios.listRoles,
    enabled: isAdmin,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (user: EmpresaUser) =>
      api.usuarios.update(user.id, {
        status: user.status === "ATIVO" ? "INATIVO" : "ATIVO",
      }),
    onSuccess: async (_, user) => {
      toast.success(
        user.status === "ATIVO" ? "Usuario inativado!" : "Usuario ativado!",
      );
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status",
      );
    },
  });

  const usuarios = usuariosQuery.data ?? [];
  const usuariosOrdenados = useMemo(
    () =>
      [...usuarios].sort((a, b) => {
        if (a.isAccountOwner !== b.isAccountOwner) {
          return a.isAccountOwner ? -1 : 1;
        }
        return a.nome.localeCompare(b.nome);
      }),
    [usuarios],
  );

  if (loadingAuth) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
          Carregando acessos...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AccessDeniedState description="Somente administradores podem acessar a administracao de acessos do SST Lite." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-slate-700">
              <UserRoundCog className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Acessos</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie usuarios, perfis e status da empresa autenticada.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            onClick={() => usuariosQuery.refetch()}
            disabled={usuariosQuery.isFetching}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo usuario
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead className="border-b border-slate-300 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Ultimo login
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Acoes
                </th>
              </tr>
            </thead>

            <tbody>
              {usuariosQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Carregando usuarios...
                  </td>
                </tr>
              ) : usuariosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              ) : (
                usuariosOrdenados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{usuario.nome}</span>
                        {usuario.isAccountOwner ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            Proprietario
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {usuario.papel ? (
                        <Badge
                          variant="outline"
                          className="border-sky-200 bg-sky-50 text-sky-700 shadow-none"
                        >
                          {usuario.papel.nome}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(usuario.status)}
                      >
                        {usuario.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(usuario.ultimoLoginAt, "Nunca")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar usuario ${usuario.nome}`}
                          onClick={() => {
                            setEditing(usuario);
                            setOpen(true);
                          }}
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          aria-label={
                            usuario.isAccountOwner
                              ? `Proprietario ${usuario.nome} protegido`
                              : usuario.status === "ATIVO"
                                ? `Inativar usuario ${usuario.nome}`
                                : `Ativar usuario ${usuario.nome}`
                          }
                          onClick={() => toggleStatusMutation.mutate(usuario)}
                          disabled={
                            usuario.isAccountOwner || toggleStatusMutation.isPending
                          }
                          className="gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        >
                          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                          {usuario.isAccountOwner
                            ? "Protegido"
                            : usuario.status === "ATIVO"
                              ? "Inativar"
                              : "Ativar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <KeyRound aria-hidden="true" className="mt-0.5 h-4 w-4 text-slate-400" />
          <p>
            O proprietario da conta permanece protegido nesta fase: nao pode ser
            inativado nem perder privilegios de administrador.
          </p>
        </div>
      </div>

      <UsuarioModal
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        papeis={papeisQuery.data ?? []}
      />
    </div>
  );
}
