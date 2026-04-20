import AppShell from "@/components/layout/AppShell";
import { requireServerAuthSession } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/** Rotas acessíveis ao perfil COLABORADOR. */
const COLABORADOR_ALLOWED = ["/meu-perfil"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  // Colaborador só pode acessar /meu-perfil
  if (session.roles.includes("COLABORADOR")) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const allowed = COLABORADOR_ALLOWED.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!allowed) {
      redirect("/meu-perfil");
    }
  }

  return <AppShell>{children}</AppShell>;
}
