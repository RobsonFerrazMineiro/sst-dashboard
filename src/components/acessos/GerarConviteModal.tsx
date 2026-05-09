"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PendingColaborador } from "@/types/access";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GerarConviteModal({
  colaborador,
  open,
  onOpenChange,
}: {
  colaborador: PendingColaborador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  function reset() {
    setInviteUrl(null);
    setExpiresAt(null);
  }

  function handleClose(value: boolean) {
    if (!value) reset();
    onOpenChange(value);
  }

  async function handleGerar() {
    if (!colaborador) return;
    setLoading(true);
    try {
      const res = await fetch("/api/acessos/convidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaboradorId: colaborador.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Erro ao gerar convite");
      setInviteUrl(data.inviteUrl);
      setExpiresAt(data.expiresAt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar convite");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopiar() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl).catch(() => null);
    toast.success("Link copiado!");
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar convite de acesso</DialogTitle>
          <DialogDescription>
            {colaborador ? (
              <>
                Gera um link seguro para{" "}
                <span className="font-medium text-slate-900">
                  {colaborador.nome}
                </span>{" "}
                definir a própria senha. O link expira em 48h.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!inviteUrl ? (
            <Button onClick={handleGerar} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando convite...
                </>
              ) : (
                "Gerar link de convite"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Convite gerado!</span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500">
                  Link do convite (válido até {expiryLabel})
                </p>
                <div className="flex gap-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopiar}
                    aria-label="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Compartilhe este link diretamente com o colaborador. Ele é de
                uso único e expira em 48h.
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGerar}
                disabled={loading}
              >
                Gerar novo link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
