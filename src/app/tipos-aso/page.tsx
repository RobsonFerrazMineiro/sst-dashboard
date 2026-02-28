"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import TipoASOModal from "@/components/tipos-aso/TipoASOModal";
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

type TipoASO = {
  id: string;
  nome: string;
  validadeMeses: number | null;
  descricao: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function TiposASOPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoASO | null>(null);

  const {
    data = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tiposASO"],
    queryFn: api.tiposASO.list,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data as TipoASO[];
    return (data as TipoASO[]).filter((t) => {
      return (t.nome ?? "").toLowerCase().includes(needle);
    });
  }, [data, q]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.tiposASO.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tiposASO"] });
    },
  });

  const onNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (row: TipoASO) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tipos de ASO</h1>
            <p className="text-slate-500 mt-1">
              Cadastre e gerencie os tipos de ASO e suas validades.
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
              Novo tipo
            </Button>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome..."
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
                    Validade (meses)
                  </th>
                  <th className="text-left text-sm font-semibold text-slate-600 px-4 py-3">
                    Descrição
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
                      colSpan={4}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhum tipo encontrado.
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
                        {row.validadeMeses ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {row.descricao ?? "-"}
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
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir tipo?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso remove o tipo do sistema. Se houver ASOs
                                  usando esse tipo, o banco pode bloquear a
                                  exclusão.
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

        <TipoASOModal
          open={open}
          onOpenChange={setOpen}
          initial={editing}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["tiposASO"] });
          }}
        />
      </div>
    </div>
  );
}
