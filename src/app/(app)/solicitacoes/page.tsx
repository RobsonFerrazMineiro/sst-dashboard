import SolicitacoesView from "@/components/solicitacoes/SolicitacoesView";
import { requireServerAuthSession } from "@/lib/auth";
import { getUserAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function SolicitacoesPage() {
  const session = await requireServerAuthSession();
  if (!session) redirect("/login");

  // Qualquer usuário autenticado pode acessar
  // (a API filtra: colaborador vê só as suas)
  const access = await getUserAccess(session);
  const podeVer =
    access.roles.includes("ADMIN") ||
    access.roles.includes("TECNICO_SST") ||
    access.roles.includes("GESTOR") ||
    access.roles.includes("COLABORADOR");

  if (!podeVer) redirect("/dashboard");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SolicitacoesView />
    </div>
  );
}
