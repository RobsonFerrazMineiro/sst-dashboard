"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  login: z.string().trim().min(1, "Informe o login."),
  senha: z
    .string()
    .min(1, "Informe a senha.")
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      senha: "",
    },
  });

  async function onSubmit({ login, senha }: LoginFormData) {
    try {
      clearErrors("senha");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, senha }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = String(payload?.error ?? "");
        if (errorMessage.toLowerCase().includes("credenciais")) {
          setError("senha", {
            type: "server",
            message: "Login ou senha incorretos.",
          });
          throw new Error("Login ou senha incorretos.");
        }
        throw new Error(errorMessage || "Falha ao autenticar");
      }

      queryClient.clear();

      const roles: string[] = payload?.user?.roles ?? [];
      const isColaborador = roles.includes("COLABORADOR");
      const defaultNext = isColaborador ? "/meu-perfil" : "/dashboard";
      const next = searchParams.get("next") || defaultNext;

      router.replace(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao autenticar");
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardContent className="space-y-6 p-8">
        {searchParams.get("cadastro") === "ok" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Conta criada com sucesso! Faca login para continuar.</span>
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
          <p className="text-sm text-slate-600">
            Acesse o SST Lite com seu e-mail ou matricula.
          </p>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit, (submitErrors) => {
            const firstError = Object.values(submitErrors)[0];
            toast.error(firstError?.message || "Verifique os dados informados.");
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              autoComplete="username"
              placeholder="E-mail ou matricula"
              {...register("login")}
            />
            {errors.login?.message && (
              <p className="text-xs text-rose-600">{errors.login.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                {...register("senha")}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.senha?.message && (
              <p className="text-xs text-rose-600">{errors.senha.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
