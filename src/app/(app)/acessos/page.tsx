"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
  UserRoundPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import AtivarColaboradorModal from "@/components/acessos/AtivarColaboradorModal";
import GerarConviteModal from "@/components/acessos/GerarConviteModal";
import UsuarioModal from "@/components/acessos/UsuarioModal";
import AccessDeniedState from "@/components/auth/AccessDeniedState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthPermissions } from "@/lib/permissions-client";
import { formatDate } from "@/lib/utils";
import type { EmpresaUser, PendingColaborador } from "@/types/access";
import { toast } from "sonner";

// ─── helpers visuais ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EmpresaUser["status"] }) {
  const map: Record<EmpresaUser["status"], { cls: string; label: string }> = {
    ATIVO: {
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Ativo",
    },
    INATIVO: {
      cls: "border-slate-200 bg-slate-100 text-slate-600",
      label: "Inativo",
    },
    BLOQUEADO: {
      cls: "border-rose-200 bg-rose-50 text-rose-700",
      label: "Bloqueado",
    },
  };
  const { cls, label } = map[status] ?? map.BLOQUEADO;
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}

function PendenteBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-amber-700"
    >
      Pendente de ativação
    </Badge>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AcessosPage() {
  const qc = useQueryClient();
  const { hasRole, isLoading: loadingAuth } = useAuthPermissions();
  const isAdmin = hasRole("ADMIN");

  const [openNovoUsuario, setOpenNovoUsuario] = useState(false);
  const [editing, setEditing] = useState<EmpresaUser | null>(null);
  const [openAtivar, setOpenAtivar] = useState(false);
  const [openConvite, setOpenConvite] = useState(false);
  const [pendenteSelecionado, setPendenteSelecionado] =
    useState<PendingColaborador | null>(null);

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.usuarios.list,
    enabled: isAdmin,
  });

  const pendentesQuery = useQuery({
    queryKey: ["colaboradores", "pendentes"],
    queryFn: api.usuarios.pendentes,
    enabled: isAdmin,
  });

  const papeisQuery = useQuery({
    queryKey: ["usuarios", "papeis", "manual"],
    queryFn: api.usuarios.listManualRoles,
    enabled: isAdmin,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (user: EmpresaUser) =>
      api.usuarios.update(user.id, {
        status: user.status === "ATIVO" ? "INATIVO" : "ATIVO",
      }),
    onSuccess: async (_, user) => {
      toast.success(
        user.status === "ATIVO" ? "Acesso removido!" : "Acesso reativado!",
      );
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status",
      );
    },
  });

  const usuariosOrdenados = useMemo(
    () =>
      [...(usuariosQuery.data ?? [])].sort((a, b) => {
        if (a.isAccountOwner !== b.isAccountOwner)
          return a.isAccountOwner ? -1 : 1;
        return a.nome.localeCompare(b.nome);
      }),
    [usuariosQuery.data],
  );

  const pendentes = pendentesQuery.data ?? [];

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
        <AccessDeniedState description="Somente administradores podem acessar a administração de acessos do SST Lite." />
      </div>
    );
  }

  const isLoading = usuariosQuery.isLoading || pendentesQuery.isLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* cabeçalho */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-slate-700">
              <UserRoundCog className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Acessos</h1>
              {pendentes.length > 0 && (
                <p className="text-sm text-amber-600 font-medium mt-0.5">
                  {pendentes.length} colaborador
                  {pendentes.length > 1 ? "es" : ""} aguardando ativação
                </p>
              )}
            </div>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie usuários, perfis e status da empresa autenticada.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            onClick={() => {
              usuariosQuery.refetch();
              pendentesQuery.refetch();
            }}
            disabled={usuariosQuery.isFetching || pendentesQuery.isFetching}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          {/* Fluxo secundário: acesso manual para ADMIN / Técnico SST */}
          <Button
            onClick={() => {
              setEditing(null);
              setOpenNovoUsuario(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        </div>
      </header>

      {/* tabela */}
      <div className="rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead className="border-b border-slate-300 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Cargo / Setor
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Login
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Último login
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : (
                <>
                  {usuariosOrdenados.map((usuario) => (
                    <UsuarioRow
                      key={usuario.id}
                      usuario={usuario}
                      onEdit={() => {
                        setEditing(usuario);
                        setOpenNovoUsuario(true);
                      }}
                      onToggleStatus={() =>
                        toggleStatusMutation.mutate(usuario)
                      }
                      togglingStatus={toggleStatusMutation.isPending}
                    />
                  ))}

                  {pendentes.map((pendente) => (
                    <PendenteRow
                      key={`pendente-${pendente.id}`}
                      pendente={pendente}
                      onAtivar={() => {
                        setPendenteSelecionado(pendente);
                        setOpenAtivar(true);
                      }}
                      onConvidar={() => {
                        setPendenteSelecionado(pendente);
                        setOpenConvite(true);
                      }}
                    />
                  ))}

                  {usuariosOrdenados.length === 0 && pendentes.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* legenda */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <KeyRound
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
          />
          <p>
            O proprietário da conta permanece protegido: não pode ter o acesso
            removido nem perder privilégios de administrador. Colaboradores
            precisam ter o primeiro acesso ativado antes de poderem entrar no
            sistema.
          </p>
        </div>
      </div>

      <UsuarioModal
        open={openNovoUsuario}
        onOpenChange={setOpenNovoUsuario}
        initial={editing}
        papeis={papeisQuery.data ?? []}
      />

      <AtivarColaboradorModal
        open={openAtivar}
        onOpenChange={(v) => {
          setOpenAtivar(v);
          if (!v) setPendenteSelecionado(null);
        }}
        colaborador={pendenteSelecionado}
      />

      <GerarConviteModal
        open={openConvite}
        onOpenChange={(v) => {
          setOpenConvite(v);
          if (!v) setPendenteSelecionado(null);
        }}
        colaborador={pendenteSelecionado}
      />
    </div>
  );
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function UsuarioRow({
  usuario,
  onEdit,
  onToggleStatus,
  togglingStatus,
}: {
  usuario: EmpresaUser;
  onEdit: () => void;
  onToggleStatus: () => void;
  togglingStatus: boolean;
}) {
  return (
    <tr className="border-t border-slate-200 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span>{usuario.nome}</span>
          {usuario.isAccountOwner && (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
              Proprietário
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {usuario.colaborador ? (
          <div>
            <p className="text-slate-800">{usuario.colaborador.cargo}</p>
            <p className="text-xs text-slate-500">
              {usuario.colaborador.setor}
            </p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-slate-600 whitespace-nowrap">
        {usuario.login}
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
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
        <StatusBadge status={usuario.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
        {formatDate(usuario.ultimoLoginAt, "Nunca")}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar usuário ${usuario.nome}`}
            onClick={onEdit}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </Button>

          {usuario.isAccountOwner ? (
            <Button
              variant="ghost"
              disabled
              className="gap-2 text-slate-500 disabled:opacity-50"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Protegido
            </Button>
          ) : usuario.status === "ATIVO" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label={`Remover acesso de ${usuario.nome}`}
                  className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  Remover acesso
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remover acesso deste usuário?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    O usuário ficará inativo e não conseguirá mais entrar no
                    sistema até ser reativado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onToggleStatus}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Remover acesso
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="ghost"
              aria-label={`Reativar acesso de ${usuario.nome}`}
              onClick={onToggleStatus}
              disabled={togglingStatus}
              className="gap-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Reativar acesso
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function PendenteRow({
  pendente,
  onAtivar,
  onConvidar,
}: {
  pendente: PendingColaborador;
  onAtivar: () => void;
  onConvidar: () => void;
}) {
  return (
    <tr className="border-t border-slate-200 bg-amber-50/40 hover:bg-amber-50">
      <td className="px-4 py-3 text-sm text-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span>{pendente.nome}</span>
          {pendente.matricula && (
            <span className="font-mono text-xs text-slate-500">
              {pendente.matricula}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <div>
          <p className="text-slate-800">{pendente.cargo}</p>
          <p className="text-xs text-slate-500">{pendente.setor}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400 italic">—</td>
      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
        <Badge
          variant="outline"
          className="border-slate-200 bg-white text-slate-500 shadow-none"
        >
          Colaborador
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
        <PendenteBadge />
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">—</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button
            onClick={onConvidar}
            size="sm"
            variant="outline"
            className="gap-2 text-sky-700 border-sky-200 hover:bg-sky-50"
            aria-label={`Gerar convite para ${pendente.nome}`}
          >
            <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
            Convidar
          </Button>
          <Button
            onClick={onAtivar}
            size="sm"
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-none"
            aria-label={`Ativar primeiro acesso de ${pendente.nome}`}
          >
            <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
            Ativar acesso
          </Button>
        </div>
      </td>
    </tr>
  );
}
