import AppShell from "@/components/layout/AppShell";
import { requireServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
