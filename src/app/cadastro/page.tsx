"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Tipo = "PESSOAL" | "EMPRESA";

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [loading, setLoading] = useState(false);

  // Campos comuns
  const [nome, setNome]       = useState("");
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [confirmar, setConfirmar] = useState("");

  // Campos empresa
  const [razaoSocial, setRazaoSocial]       = useState("");
  const [nomeFantasia, setNomeFantasia]     = useState("");
  const [cnpj, setCnpj]                     = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");

  function handleEscolhaTipo(t: Tipo) {
    setTipo(t);
    setStep(2);
  }

  function handleCnpjChange(v: string) {
    // Formata enquanto digita: XX.XXX.XXX/XXXX-XX
    const digits = v.replace(/\D/g, "").slice(0, 14);
    let formatted = digits;
    if (digits.length > 2)  formatted = digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length > 5)  formatted = formatted.slice(0, 6) + "." + digits.slice(5);
    if (digits.length > 8)  formatted = formatted.slice(0, 10) + "/" + digits.slice(8);
    if (digits.length > 12) formatted = formatted.slice(0, 15) + "-" + digits.slice(12);
    setCnpj(formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmar) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const body =
        tipo === "EMPRESA"
          ? { tipo, nome, email, senha, razaoSocial, nomeFantasia: nomeFantasia || undefined, cnpj, nomeResponsavel: nomeResponsavel || undefined }
          : { tipo, nome, email, senha };

      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Erro ao criar conta");

      toast.success("Conta criada com sucesso!");
      router.replace("/login?cadastro=ok");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Gestão SST</h1>
          <p className="text-sm text-slate-500">Crie sua conta gratuitamente</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardContent className="p-8">

            {/* ── PASSO 1: escolha do tipo ─────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <p className="font-semibold text-slate-800">Como você vai usar o sistema?</p>
                  <p className="text-sm text-slate-500">Escolha o perfil que melhor descreve seu uso</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleEscolhaTipo("PESSOAL")}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <User className="h-7 w-7 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Uso pessoal</p>
                      <p className="text-xs text-slate-500 mt-0.5">Para você ou um pequeno time, sem CNPJ</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEscolhaTipo("EMPRESA")}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-sky-400 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <Building2 className="h-7 w-7 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Empresa</p>
                      <p className="text-xs text-slate-500 mt-0.5">Para empresas com CNPJ e equipe SST</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── PASSO 2: formulário dinâmico ─────────────────────────── */}
            {step === 2 && tipo && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">
                    {tipo === "PESSOAL" ? "Criar conta pessoal" : "Criar conta empresarial"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Voltar
                  </button>
                </div>

                {/* Campos exclusivos de empresa */}
                {tipo === "EMPRESA" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="razao">Razão social *</Label>
                      <Input
                        id="razao"
                        value={razaoSocial}
                        onChange={(e) => setRazaoSocial(e.target.value)}
                        placeholder="Nome legal da empresa"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fantasia">
                        Nome fantasia{" "}
                        <span className="text-xs font-normal text-slate-400">(opcional)</span>
                      </Label>
                      <Input
                        id="fantasia"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                        placeholder="Como é conhecido no mercado"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={cnpj}
                        onChange={(e) => handleCnpjChange(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="responsavel">
                        Nome do responsável{" "}
                        <span className="text-xs font-normal text-slate-400">(opcional)</span>
                      </Label>
                      <Input
                        id="responsavel"
                        value={nomeResponsavel}
                        onChange={(e) => setNomeResponsavel(e.target.value)}
                        placeholder="Técnico SST ou gestor responsável"
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-1" />
                  </>
                )}

                {/* Campos do administrador */}
                <div className="space-y-1.5">
                  <Label htmlFor="nome">
                    {tipo === "PESSOAL" ? "Seu nome *" : "Nome do administrador *"}
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmar">Confirmar senha *</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-emerald-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
