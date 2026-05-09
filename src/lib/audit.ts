/**
 * Helper de auditoria do SST Dashboard.
 *
 * Regras:
 * - NUNCA lança exceção para o caller — erros são apenas logados
 * - Leve: insert simples, sem transação externa
 * - Compatível com multiempresa
 */

import type { AuditAction } from "@/constants/audit-actions";
import { prisma } from "@/lib/db";

export interface AuditLogInput {
  /** ID da empresa (contexto multiempresa). Pode ser nulo em ações de login falho. */
  empresaId?: string | null;
  /** ID do usuário que executou a ação. Pode ser nulo (ex: login inválido). */
  usuarioId?: string | null;
  /** Código da ação (use AUDIT_ACTIONS). */
  acao: AuditAction;
  /** Nome da entidade afetada. Ex: "usuario", "colaborador", "aso", "treinamento". */
  entidade: string;
  /** ID do registro afetado (se aplicável). */
  entidadeId?: string | null;
  /** Descrição legível do que aconteceu. */
  descricao?: string | null;
  /** IP do cliente (extraído do request quando disponível). */
  ip?: string | null;
  /** User-Agent do cliente. */
  userAgent?: string | null;
}

/**
 * Registra uma entrada no log de auditoria.
 * Falhas silenciosas — o sistema continua funcionando mesmo se o log falhar.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        empresaId: input.empresaId ?? null,
        usuarioId: input.usuarioId ?? null,
        acao: input.acao,
        entidade: input.entidade,
        entidadeId: input.entidadeId ?? null,
        descricao: input.descricao ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // Log de auditoria NÃO pode quebrar a operação principal
    console.error("[audit] Falha ao registrar AuditLog:", err);
  }
}

/**
 * Extrai IP e User-Agent de um Request do Next.js.
 * Retorna strings ou null — nunca lança.
 */
export function extractRequestMeta(req: Request): {
  ip: string | null;
  userAgent: string | null;
} {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}
