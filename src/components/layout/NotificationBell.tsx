"use client";

import type { AlertaSST } from "@/app/api/alertas/route";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lidaEm: string | null;
  createdAt: string;
};

type NotificacoesResponse = {
  notificacoes: Notificacao[];
  naoLidas: number;
};

async function fetchNotificacoes(): Promise<NotificacoesResponse> {
  const res = await fetch("/api/notificacoes");
  if (!res.ok) throw new Error();
  return res.json() as Promise<NotificacoesResponse>;
}

async function fetchAlertas(): Promise<AlertaSST[]> {
  const res = await fetch("/api/alertas");
  if (!res.ok) return [];
  const data = (await res.json()) as { alertas: AlertaSST[] };
  return data.alertas ?? [];
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: fetchNotificacoes,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ["alertas-sst"],
    queryFn: fetchAlertas,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const naoLidas = data?.naoLidas ?? 0;
  const totalBadge = naoLidas + alertas.length;

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Alinha pela direita do botão para não sair da viewport
      const top = rect.bottom + 8;
      const right = window.innerWidth - rect.right;
      setPanelPos({ top, left: right });
    }
    setOpen((v) => !v);
  }

  async function handleMarcarTodasLidas() {
    await fetch("/api/notificacoes", { method: "PATCH" });
    void queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
  }

  async function handleMarcarLida(id: string) {
    await fetch(`/api/notificacoes/${id}/read`, { method: "PATCH" });
    void queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
  }

  return (
    <div className="relative">
      {/* ── Botão sino ── */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="relative flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Notificações e alertas"
      >
        <Bell className="h-4 w-4" />
        {totalBadge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {/* ── Painel — fixed para sair do overflow da sidebar ── */}
      {open && (
        <div
          ref={panelRef}
          style={{ top: panelPos.top, right: panelPos.left }}
          className="fixed z-200 w-80 rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              Alertas &amp; Notificações
              {totalBadge > 0 && (
                <span className="ml-2 inline-flex h-4 items-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                  {totalBadge}
                </span>
              )}
            </p>
            {naoLidas > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleMarcarTodasLidas()}
                className="h-auto px-2 py-1 text-xs text-slate-500 hover:text-emerald-700"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar lidas
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* ── Seção: Alertas SST ── */}
            {alertas.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Alertas SST
                </p>
                <div className="divide-y divide-slate-50">
                  {alertas.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-start gap-3 px-4 py-2.5 ${
                        a.severity === "critical"
                          ? "bg-rose-50/60"
                          : "bg-amber-50/60"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                          a.severity === "critical"
                            ? "text-rose-500"
                            : "text-amber-500"
                        }`}
                      />
                      <p
                        className={`text-xs leading-snug ${
                          a.severity === "critical"
                            ? "text-rose-700 font-medium"
                            : "text-amber-700"
                        }`}
                      >
                        {a.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Seção: Notificações pessoais ── */}
            {(data?.notificacoes.length ?? 0) > 0 && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Notificações
              </p>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : !data?.notificacoes.length && alertas.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">Nenhum alerta ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(data?.notificacoes ?? []).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.lidaEm) void handleMarcarLida(n.id);
                    }}
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 ${
                      !n.lidaEm ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          !n.lidaEm ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {n.titulo}
                      </p>
                      {!n.lidaEm && (
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                      {n.mensagem}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDate(n.createdAt, "—")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
