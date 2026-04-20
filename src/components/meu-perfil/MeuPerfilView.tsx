"use client";

import RiskScoreBadge from "@/components/dashboard/RiskScoreBadge";
import RiskScoreHoverCard from "@/components/dashboard/RiskScoreHoverCard";
import { SSTProgressBar } from "@/components/ui/SSTProgressBar";
import { StatusBadgeWithTemporal } from "@/components/ui/status-badge-with-temporal";
import { api } from "@/lib/api";
import { calculateRiskScore } from "@/lib/risk-score";
import {
  getAsoStatusWithTemporal,
  getTrainingStatusWithTemporal,
} from "@/lib/temporal-status";
import { createRealPendingsList } from "@/lib/unified-pending";
import { formatDate } from "@/lib/utils";
import type { AsoRecord, TreinamentoRecord } from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hash,
  Mail,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useMemo } from "react";

// ─── tipos locais ─────────────────────────────────────────────────────────────

type ColaboradorInfo = {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  matricula: string | null;
};

type UsuarioInfo = {
  login: string;
  email?: string | null;
  status: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function splitLatestByKey<T extends Record<string, unknown>>(
  records: T[],
  keyField: keyof T,
  dateField: keyof T,
): T[] {
  const seenKeys = new Set<unknown>();
  const sorted = [...records].sort((a, b) => {
    const da = a[dateField] ? new Date(a[dateField] as string).getTime() : 0;
    const db = b[dateField] ? new Date(b[dateField] as string).getTime() : 0;
    return db - da;
  });
  return sorted.filter((r) => {
    const key = r[keyField];
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

const statusOrder: Record<string, number> = {
  Vencido: 0,
  "Prestes a vencer": 1,
  "Em dia": 2,
  Pendente: 3,
  "Sem vencimento": 4,
};

// ─── sub-componentes ──────────────────────────────────────────────────────────

function InfoChip({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs text-slate-500 mr-1">{label}:</span>
        <span className={`text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-500">{icon}</span>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        {children}
      </h2>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

// ─── alerta de pendências ─────────────────────────────────────────────────────

type PendenciaItem = {
  label: string;
  /** "critico" = vencido; "atencao" = prestes a vencer / pendente */
  nivel: "critico" | "atencao";
};

function PendenciasAlert({ itens }: { itens: PendenciaItem[] }) {
  if (itens.length === 0) return null;

  const temCritico = itens.some((i) => i.nivel === "critico");

  const containerCls = temCritico
    ? "border-rose-200 bg-rose-50"
    : "border-amber-200 bg-amber-50";
  const iconCls = temCritico ? "text-rose-500" : "text-amber-500";
  const titleCls = temCritico ? "text-rose-700" : "text-amber-700";
  const itemCriticoCls = "text-rose-600 font-medium";
  const itemAtencaoCls = "text-amber-600";

  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 flex gap-3 ${containerCls}`}
    >
      <AlertTriangle
        className={`h-4 w-4 shrink-0 mt-0.5 ${iconCls}`}
        aria-hidden="true"
      />
      <div className="space-y-1 min-w-0">
        <p className={`text-sm font-semibold ${titleCls}`}>
          Pendências encontradas
        </p>
        <ul className="space-y-0.5">
          {itens.map((item, idx) => (
            <li
              key={idx}
              className={`text-xs flex items-center gap-1.5 ${
                item.nivel === "critico" ? itemCriticoCls : itemAtencaoCls
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                  item.nivel === "critico" ? "bg-rose-500" : "bg-amber-400"
                }`}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TreinamentoCard({ t }: { t: TreinamentoRecord }) {
  const statusInfo = getTrainingStatusWithTemporal(t.validade);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {t.tipoTreinamento_nome ?? "Treinamento"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          {t.nr && <span className="font-mono">{t.nr}</span>}
          {t.nr && t.validade && <span>·</span>}
          {t.validade && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Válido até {formatDate(t.validade, "—")}
            </span>
          )}
          {t.carga_horaria && <span>· {t.carga_horaria}h</span>}
        </p>
      </div>
      <div className="shrink-0">
        <StatusBadgeWithTemporal statusInfo={statusInfo} showTemporalBelow />
      </div>
    </div>
  );
}

function AsoCard({ a }: { a: AsoRecord }) {
  const statusInfo = getAsoStatusWithTemporal(a.validade_aso, a.data_aso);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {a.tipoASO_nome ?? "ASO"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          {a.clinica && <span>{a.clinica}</span>}
          {a.clinica && a.data_aso && <span>·</span>}
          {a.data_aso && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Realizado em {formatDate(a.data_aso, "—")}
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0">
        <StatusBadgeWithTemporal statusInfo={statusInfo} showTemporalBelow />
      </div>
    </div>
  );
}

// ─── resumo SST ───────────────────────────────────────────────────────────────

function ResumoSST({
  treinamentos,
  asos,
}: {
  treinamentos: TreinamentoRecord[];
  asos: AsoRecord[];
}) {
  const pendingsList = useMemo(
    () => createRealPendingsList(asos, treinamentos),
    [asos, treinamentos],
  );
  const riskScore = useMemo(
    () => calculateRiskScore(pendingsList),
    [pendingsList],
  );

  // Treinamentos atuais (um por tipo)
  const trAtual = useMemo(
    () =>
      splitLatestByKey(
        treinamentos as Record<string, unknown>[],
        "tipoTreinamento",
        "data_treinamento",
      ) as TreinamentoRecord[],
    [treinamentos],
  );

  // ASO mais recente
  const asoAtual = useMemo(() => {
    if (asos.length === 0) return null;
    return [...asos].sort((a, b) => {
      const da = a.data_aso ? new Date(a.data_aso).getTime() : 0;
      const db = b.data_aso ? new Date(b.data_aso).getTime() : 0;
      return db - da;
    })[0];
  }, [asos]);

  const trEmDia = trAtual.filter((t) =>
    ["Em dia", "Sem vencimento"].includes(
      getTrainingStatusWithTemporal(t.validade).status,
    ),
  ).length;
  const trPendentes = trAtual.length - trEmDia;

  // Treinamentos vencidos vs "prestes a vencer"
  const trVencidos = trAtual.filter(
    (t) => getTrainingStatusWithTemporal(t.validade).status === "Vencido",
  ).length;
  const trPrestesVencer = trAtual.filter(
    (t) =>
      getTrainingStatusWithTemporal(t.validade).status === "Prestes a vencer",
  ).length;

  const asoStatus = asoAtual
    ? getAsoStatusWithTemporal(asoAtual.validade_aso, asoAtual.data_aso).status
    : "Pendente";

  // Monta lista de pendências para o alerta
  const pendenciasAlerta = useMemo<PendenciaItem[]>(() => {
    const lista: PendenciaItem[] = [];

    if (trVencidos > 0) {
      lista.push({
        label: `${trVencidos} treinamento${trVencidos > 1 ? "s" : ""} vencido${trVencidos > 1 ? "s" : ""}`,
        nivel: "critico",
      });
    }
    if (trPrestesVencer > 0) {
      lista.push({
        label: `${trPrestesVencer} treinamento${trPrestesVencer > 1 ? "s" : ""} prestes a vencer`,
        nivel: "atencao",
      });
    }
    if (asoStatus === "Vencido") {
      lista.push({ label: "ASO vencido", nivel: "critico" });
    } else if (asoStatus === "Pendente") {
      lista.push({ label: "ASO pendente", nivel: "atencao" });
    } else if (asoStatus === "Prestes a vencer") {
      lista.push({ label: "ASO prestes a vencer", nivel: "atencao" });
    }

    return lista;
  }, [trVencidos, trPrestesVencer, asoStatus]);

  // Próximo vencimento (entre todos os itens — inclui vencidos para exibir "há X dias")
  const proximoVencimento = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidatos: { label: string; data: Date; diasRestantes: number }[] =
      [];

    for (const t of trAtual) {
      if (!t.validade) continue;
      const d = new Date(t.validade);
      d.setHours(0, 0, 0, 0);
      candidatos.push({
        label: t.tipoTreinamento_nome ?? "Treinamento",
        data: d,
        diasRestantes: differenceInDays(d, today),
      });
    }
    if (asoAtual?.validade_aso) {
      const d = new Date(asoAtual.validade_aso);
      d.setHours(0, 0, 0, 0);
      candidatos.push({
        label: asoAtual.tipoASO_nome ?? "ASO",
        data: d,
        diasRestantes: differenceInDays(d, today),
      });
    }

    if (candidatos.length === 0) return null;
    // Ordena: futuros primeiro (menor diasRestantes > 0), depois vencidos
    const futuros = candidatos
      .filter((c) => c.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
    const vencidos = candidatos
      .filter((c) => c.diasRestantes < 0)
      .sort((a, b) => b.diasRestantes - a.diasRestantes); // mais recente primeiro
    return futuros[0] ?? vencidos[0] ?? null;
  }, [trAtual, asoAtual]);

  const statCls = (ok: boolean) =>
    ok
      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
      : "border-rose-300 bg-rose-100 text-rose-800";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>
          Situação SST
        </SectionTitle>
        <RiskScoreHoverCard riskScore={riskScore}>
          <RiskScoreBadge riskScore={riskScore} size="sm" />
        </RiskScoreHoverCard>
      </div>

      {/* barra de progresso do score */}
      <SSTProgressBar score={riskScore.score} />

      {/* alerta de pendências — oculto quando não há nenhuma */}
      <PendenciasAlert itens={pendenciasAlerta} />

      {/* cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`rounded-lg border px-4 py-3 text-center ${statCls(trPendentes === 0)}`}
        >
          <div className="flex justify-center mb-1">
            {trPendentes === 0 ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <AlertTriangle className="h-7 w-7" />
            )}
          </div>
          <p className="text-xs font-semibold mt-0.5">
            Treinamento{trEmDia !== 1 ? "s" : ""}
          </p>
          <p className="text-xs mt-1 font-medium opacity-90">
            {trPendentes === 0
              ? `${trEmDia} em dia`
              : `${trPendentes} pendente${trPendentes > 1 ? "s" : ""}`}
          </p>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-center ${statCls(
            asoStatus === "Em dia" || asoStatus === "Sem vencimento",
          )}`}
        >
          <div className="flex justify-center mb-1">
            {asoStatus === "Em dia" || asoStatus === "Sem vencimento" ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <AlertTriangle className="h-7 w-7" />
            )}
          </div>
          <p className="text-xs font-semibold mt-0.5">ASO</p>
          <p className="text-xs mt-1 font-medium opacity-90">
            {asoAtual ? asoStatus : "Pendente"}
          </p>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-center ${
            !proximoVencimento
              ? "border-slate-200 bg-slate-50 text-slate-600"
              : proximoVencimento.diasRestantes < 0
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : proximoVencimento.diasRestantes < 30
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <p className="text-xs font-medium mb-1">Próximo vencimento</p>
          {proximoVencimento ? (
            <>
              <p className="text-sm font-semibold truncate">
                {proximoVencimento.label}
              </p>
              <p className="text-xs mt-0.5 flex items-center justify-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(proximoVencimento.data.toISOString(), "—")}
              </p>
              <p className="text-xs mt-1 font-medium">
                {proximoVencimento.diasRestantes === 0
                  ? "vence hoje"
                  : proximoVencimento.diasRestantes < 0
                    ? `há ${Math.abs(proximoVencimento.diasRestantes)} dia${Math.abs(proximoVencimento.diasRestantes) !== 1 ? "s" : ""}`
                    : `em ${proximoVencimento.diasRestantes} dia${proximoVencimento.diasRestantes !== 1 ? "s" : ""}`}
              </p>
            </>
          ) : (
            <p className="text-sm opacity-70">Nenhum</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function MeuPerfilView({
  colaborador,
  usuario,
}: {
  colaborador: ColaboradorInfo;
  usuario: UsuarioInfo;
}) {
  const { data: treinamentos = [], isLoading: loadingTre } = useQuery({
    queryKey: ["treinamentos", colaborador.id],
    queryFn: () => api.treinamentos.list(colaborador.id),
  });

  const { data: asos = [], isLoading: loadingAso } = useQuery({
    queryKey: ["asos", colaborador.id],
    queryFn: () => api.asos.list(colaborador.id),
  });

  // Treinamentos atuais (um por tipo), ordenados por status
  const trAtual = useMemo(() => {
    const latest = splitLatestByKey(
      treinamentos as Record<string, unknown>[],
      "tipoTreinamento",
      "data_treinamento",
    ) as TreinamentoRecord[];
    return latest.sort(
      (a, b) =>
        (statusOrder[getTrainingStatusWithTemporal(a.validade).status] ?? 9) -
        (statusOrder[getTrainingStatusWithTemporal(b.validade).status] ?? 9),
    );
  }, [treinamentos]);

  // ASO mais recente
  const asoAtual = useMemo(() => {
    if (asos.length === 0) return null;
    return [...asos].sort((a, b) => {
      const da = a.data_aso ? new Date(a.data_aso).getTime() : 0;
      const db = b.data_aso ? new Date(b.data_aso).getTime() : 0;
      return db - da;
    })[0];
  }, [asos]);

  const isLoading = loadingTre || loadingAso;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── cabeçalho com dados do colaborador ── */}
      <header className="rounded-xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 shrink-0">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {colaborador.nome}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <InfoChip
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Cargo"
                  value={colaborador.cargo}
                />
                <InfoChip
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Setor"
                  value={colaborador.setor}
                />
                {colaborador.matricula && (
                  <InfoChip
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Matrícula"
                    value={colaborador.matricula}
                    mono
                  />
                )}
              </div>
            </div>
          </div>

          {/* dados de acesso — compacto */}
          <div className="text-right text-xs text-slate-500 space-y-1 shrink-0">
            <div className="flex items-center justify-end gap-1">
              <UserCircle className="h-3 w-3" />
              <span className="font-mono">{usuario.login}</span>
            </div>
            {usuario.email && (
              <div className="flex items-center justify-end gap-1">
                <Mail className="h-3 w-3" />
                <span>{usuario.email}</span>
              </div>
            )}
            <span
              className={
                usuario.status === "ATIVO"
                  ? "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-slate-200 bg-slate-100 text-slate-600"
              }
            >
              {usuario.status === "ATIVO" ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
      </header>

      {/* ── resumo SST ── */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 text-center text-sm text-slate-500">
          Carregando situação SST...
        </div>
      ) : (
        <ResumoSST treinamentos={treinamentos} asos={asos} />
      )}

      {/* ── treinamentos atuais ── */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <SectionTitle icon={<ClipboardList className="h-4 w-4" />}>
          Treinamentos
        </SectionTitle>

        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : trAtual.length === 0 ? (
          <EmptyState label="Nenhum treinamento registrado." />
        ) : (
          <div className="space-y-2">
            {trAtual.map((t) => (
              <TreinamentoCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── ASO atual ── */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>
          ASO (Atestado de Saúde Ocupacional)
        </SectionTitle>

        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : !asoAtual ? (
          <EmptyState label="Nenhum ASO registrado." />
        ) : (
          <AsoCard a={asoAtual} />
        )}
      </section>
    </div>
  );
}
