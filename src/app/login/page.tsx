import LoginForm from "@/components/auth/LoginForm";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm />
        <p className="text-center text-sm text-slate-500">
          Não tem uma conta?{" "}
          <a href="/cadastro" className="font-medium text-emerald-600 hover:underline">
            Criar conta grátis
          </a>
        </p>
      </div>
    </main>
  );
}
