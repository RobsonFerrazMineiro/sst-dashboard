"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || "Falha ao autenticar");
      }

      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
      router.refresh();
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
          Acesse o SST Lite com seu email e senha.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
