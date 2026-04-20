"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, senha }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || "Falha ao autenticar");
      }

      // Limpa o cache antes de navegar para garantir que o novo usuário
      // não herde dados/permissões da sessão anterior armazenados em memória.
      queryClient.clear();

      // Se o usuário for COLABORADOR, redireciona direto para /meu-perfil
      // evitando o double-redirect (dashboard → meu-perfil)
      const roles: string[] = payload?.user?.roles ?? [];
      const isColaborador = roles.includes("COLABORADOR");
      const defaultNext = isColaborador ? "/meu-perfil" : "/dashboard";
      const next = searchParams.get("next") || defaultNext;

      router.replace(next);
      // NÃO chamamos router.refresh() aqui — o replace já invalida o cache
      // de rota, e o refresh extra causava round-trips desnecessários.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardContent className="space-y-6 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
          <p className="text-sm text-slate-600">
            Acesse o SST Lite com seu e-mail ou matrícula.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              autoComplete="username"
              placeholder="E-mail ou matrícula"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
