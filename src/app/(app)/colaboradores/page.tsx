"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import ColaboradorModal from "@/components/colaboradores/ColaboradorModal";
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
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthPermissions } from "@/lib/permissions-client";
import Link from "next/link";
import { toast } from "sonner";

export type Colaborador = {
  id: string;
  nome: string;
  setor: string;
  cargo: string;
  matricula?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function ColaboradoresPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthPermissions();
  const canManageColaboradores = hasPermission("colaboradores.gerenciar");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);

  const {
    data = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: api.colaboradores.list,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data as Colaborador[];

    return (data as Colaborador[]).filter((c) => {
      return (
        (c.nome ?? "").toLowerCase().includes(needle) ||
        (c.setor ?? "").toLowerCase().includes(needle) ||
        (c.cargo ?? "").toLowerCase().includes(needle) ||
        (c.matricula ?? "").toLowerCase().includes(needle)
      );
    });
  }, [data, q]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.colaboradores.remove(id),
    onSuccess: async () => {
      toast.success("Colaborador excluido!");
      await qc.invalidateQueries({ queryKey: ["colaboradores"] });
      // opcional: também atualiza dashboard, pq ASO/Treinamento dependem de colaborador
      await qc.invalidateQueries({ queryKey: ["asos"] });
      await qc.invalidateQueries({ queryKey: ["treinamentos"] });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir colaborador",
      );
    },
  });

  const onNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (row: Colaborador) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-slate-700">
                <Users className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Colaboradores
              </h1>
            </div>
            <p className="text-slate-500 mt-1">
              Cadastre e gerencie os colaboradores usados em ASOs e
              Treinamentos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>

            {canManageColaboradores ? (
              <Button onClick={onNew} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo colaborador
              </Button>
            ) : null}
          </div>
        </header>

        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Search aria-hidden="true" className="w-4 h-4 text-slate-400" />
            <Input
              name="buscarColaboradores"
              aria-label="Buscar colaboradores por nome, setor, cargo ou matrícula"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, setor, cargo ou matrícula..."
              className="bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-230">
              <thead className="bg-slate-50 border-b border-slate-300">
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">
                    Nome
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">
                    Setor
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3 min-w-70">
                    Cargo
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">
                    Matrícula
                  </th>
                  <th className="text-right text-sm font-semibold text-slate-700 px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t-2 border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                        {row.nome}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-100 text-slate-700 shadow-none"
                        >
                          {row.setor}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap min-w-70">
                        {row.cargo}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {row.matricula ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/colaboradores/${row.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ver perfil de ${row.nome}`}
                              title="Ver perfil"
                              className="text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Eye aria-hidden="true" className="w-4 h-4" />
                            </Button>
                          </Link>
                          {canManageColaboradores ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Editar colaborador ${row.nome}`}
                                onClick={() => onEdit(row)}
                                className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Pencil aria-hidden="true" className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Excluir colaborador ${row.nome}`}
                                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Excluir colaborador?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Isso remove o colaborador do sistema. Se
                                      ele estiver sendo usado em
                                      ASOs/Treinamentos, o banco pode bloquear a
                                      exclusão.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteMutation.mutate(row.id)
                                      }
                                      className="bg-rose-600 hover:bg-rose-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {canManageColaboradores ? (
          <ColaboradorModal
            open={open}
            onOpenChange={setOpen}
            initial={editing}
            onSaved={async () => {
              await qc.invalidateQueries({ queryKey: ["colaboradores"] });
              await qc.invalidateQueries({ queryKey: ["asos"] });
              await qc.invalidateQueries({ queryKey: ["treinamentos"] });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
