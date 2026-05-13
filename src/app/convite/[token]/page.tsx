"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type InviteInfo = {
  colaborador: {
    nome: string;
    cargo: string;
    setor: string;
    matricula?: string | null;
  };
  loginSugerido?: string | null;
  expiresAt: string;
};

type PageState =
  | "loading"
  | "valid"
  | "invalid"
  | "expired"
  | "used"
  | "success";
const conviteSchema = z
  .object({
    login: z.string().trim().min(1, "Informe o login."),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmar: z.string().min(1, "Confirme a senha."),
  })
  .superRefine((data, ctx) => {
    if (data.senha !== data.confirmar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmar"],
        message: "As senhas n?o coincidem",
      });
    }
  });

export default function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Resolve o token do params (Next.js 15 - params é uma Promise)
  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  // Valida o token quando disponível
  useEffect(() => {
    if (!token) return;

    fetch(`/api/acessos/convite/${token}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 410) {
          // expirado ou já usado
          const expired = data?.error?.toLowerCase().includes("expir");
          setPageState(expired ? "expired" : "used");
          return;
        }
        if (!res.ok) {
          setErrorMsg(data?.error ?? "Convite inválido");
          setPageState("invalid");
          return;
        }
        setInviteInfo(data);
        setLogin(data.loginSugerido ?? "");
        setPageState("valid");
      })
      .catch(() => {
        setPageState("invalid");
        setErrorMsg("Não foi possível verificar o convite.");
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = conviteSchema.safeParse({
      login,
      senha,
      confirmar,
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message || "Verifique os campos.");
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const res = await fetch("/api/acessos/aceitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, login, senha }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao ativar acesso");
      }

      setPageState("success");
      toast.success("Acesso ativado com sucesso!");
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar acesso");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Logo / identidade */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Gestão SST</h1>
          <p className="text-sm text-slate-500">Ativação de acesso</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardContent className="p-8">
            {/* Loading */}
            {pageState === "loading" && (
              <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Verificando convite...</p>
              </div>
            )}

            {/* Inválido */}
            {pageState === "invalid" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="font-semibold text-slate-800">Convite inválido</p>
                <p className="text-sm text-slate-500">
                  {errorMsg ||
                    "Este link de convite não existe ou já foi removido."}
                </p>
              </div>
            )}

            {/* Expirado */}
            {pageState === "expired" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="font-semibold text-slate-800">Convite expirado</p>
                <p className="text-sm text-slate-500">
                  Este link de convite expirou. Solicite um novo convite ao
                  administrador.
                </p>
              </div>
            )}

            {/* Já usado */}
            {pageState === "used" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="font-semibold text-slate-800">
                  Convite já utilizado
                </p>
                <p className="text-sm text-slate-500">
                  Este convite já foi aceito. Use seu login e senha para entrar.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => router.replace("/login")}
                >
                  Ir para o login
                </Button>
              </div>
            )}

            {/* Sucesso */}
            {pageState === "success" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="font-semibold text-slate-800">Acesso ativado!</p>
                <p className="text-sm text-slate-500">
                  Seu acesso foi configurado. Redirecionando para o login...
                </p>
              </div>
            )}

            {/* Formulário */}
            {pageState === "valid" && inviteInfo && (
              <form noValidate onSubmit={handleSubmit} className="space-y-5">
                {/* Info do colaborador */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-800">
                    {inviteInfo.colaborador.nome}
                  </p>
                  <p className="text-sm text-slate-500">
                    {inviteInfo.colaborador.cargo} ·{" "}
                    {inviteInfo.colaborador.setor}
                  </p>
                  {inviteInfo.colaborador.matricula && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      Matrícula: {inviteInfo.colaborador.matricula}
                    </p>
                  )}
                </div>

                <p className="text-sm text-slate-600">
                  Defina o seu login e uma senha para acessar o sistema.
                </p>

                {/* Login */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-login">Login</Label>
                  <Input
                    id="invite-login"
                    type="text"
                    autoComplete="username"
                    placeholder="E-mail ou matrícula"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />
                  {fieldErrors.login && (
                    <p className="text-xs text-rose-600">{fieldErrors.login}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Será usado para entrar no sistema.
                  </p>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-senha">Senha</Label>
                  <Input
                    id="invite-senha"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  {fieldErrors.senha && (
                    <p className="text-xs text-rose-600">{fieldErrors.senha}</p>
                  )}
                </div>

                {/* Confirmar senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-confirmar">Confirmar senha</Label>
                  <Input
                    id="invite-confirmar"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                  />
                  {fieldErrors.confirmar && (
                    <p className="text-xs text-rose-600">
                      {fieldErrors.confirmar}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ativando acesso...
                    </>
                  ) : (
                    "Ativar acesso"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
