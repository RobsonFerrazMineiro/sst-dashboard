import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AccessDeniedState({
  title = "Acesso negado",
  description = "Seu perfil nao possui permissao para acessar esta area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
          <ShieldAlert aria-hidden="true" className="h-6 w-6" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-amber-950">{title}</h1>
            <p className="text-sm text-amber-900/80">{description}</p>
          </div>

          <Button asChild variant="outline" className="border-amber-300 bg-white">
            <Link href="/dashboard">Voltar para o dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
