import MeuPerfilView from "@/components/meu-perfil/MeuPerfilView";
import { requireServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function MeuPerfilPage() {
  const session = await requireServerAuthSession();
  if (!session) redirect("/login");

  const usuario = await prisma.usuario.findFirst({
    where: { id: session.userId, empresaId: session.empresaId },
    select: {
      id: true,
      nome: true,
      login: true,
      email: true,
      status: true,
      colaborador: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          setor: true,
          matricula: true,
        },
      },
    },
  });

  if (!usuario) redirect("/login");

  // Sem vínculo com colaborador: exibe mensagem orientativa
  if (!usuario.colaborador) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-900 text-base">
                Perfil não vinculado
              </h2>
              <p className="text-sm text-amber-800 mt-1">
                Sua conta não está vinculada a um registro de colaborador na
                empresa. Entre em contato com o administrador do sistema para
                corrigir essa situação.
              </p>
              <p className="text-xs text-amber-700 mt-3 font-mono">
                Usuário: {usuario.login}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MeuPerfilView
      colaborador={usuario.colaborador}
      usuario={{
        login: usuario.login,
        email: usuario.email,
        status: usuario.status,
      }}
    />
  );
}

