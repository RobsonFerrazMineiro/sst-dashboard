"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

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
      await qc.invalidateQueries({ queryKey: ["colaboradores"] });
      // opcional: também atualiza dashboard, pq ASO/Treinamento dependem de colaborador
      await qc.invalidateQueries({ queryKey: ["asos"] });
      await qc.invalidateQueries({ queryKey: ["treinamentos"] });
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
            <p className="text-slate-500 mt-1">
              Cadastre e gerencie os colaboradores usados em ASOs e
              Treinamentos.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>

            <Button onClick={onNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo colaborador
            </Button>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, setor, cargo ou matrícula..."
              className="bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-600 px-4 py-3">
                    Nome
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-600 px-4 py-3">
                    Setor
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-600 px-4 py-3">
                    Cargo
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-600 px-4 py-3">
                    Matrícula
                  </th>
                  <th className="text-right text-sm font-semibold text-slate-600 px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                        {row.nome}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {row.setor}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {row.cargo}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {row.matricula ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(row)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-rose-600 hover:text-rose-700"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir colaborador?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso remove o colaborador do sistema. Se ele
                                  estiver sendo usado em ASOs/Treinamentos, o
                                  banco pode bloquear a exclusão.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(row.id)}
                                  className="bg-rose-600 hover:bg-rose-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    </div>
  );
}
