/**
 * Helper de notificações internas do SST Dashboard.
 * Falhas aqui NUNCA devem quebrar a operação principal — use void/try-catch.
 */

import { prisma } from "@/lib/db";

export type TipoNotificacao = "SOLICITACAO" | "STATUS" | "INFO";

interface CreateNotificationParams {
  empresaId: string;
  usuarioId: string;
  titulo: string;
  mensagem: string;
  tipo?: TipoNotificacao;
}

/**
 * Cria uma notificação para um usuário específico.
 * Falha silenciosa — não lança exceção.
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await prisma.notificacao.create({
      data: {
        empresaId: params.empresaId,
        usuarioId: params.usuarioId,
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo ?? "INFO",
      },
    });
  } catch (err) {
    console.error("[notifications] Falha ao criar notificação:", err);
  }
}

/**
 * Cria notificações para múltiplos usuários de uma vez (batch).
 * Falha silenciosa.
 */
export async function createNotificationBatch(
  params: Omit<CreateNotificationParams, "usuarioId"> & {
    usuarioIds: string[];
  },
): Promise<void> {
  if (params.usuarioIds.length === 0) return;
  try {
    await prisma.notificacao.createMany({
      data: params.usuarioIds.map((usuarioId) => ({
        empresaId: params.empresaId,
        usuarioId,
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo ?? "INFO",
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[notifications] Falha ao criar notificações em batch:", err);
  }
}

/**
 * Marca uma notificação como lida.
 * Valida que a notificação pertence ao usuário e empresa.
 */
export async function markNotificationAsRead(
  id: string,
  usuarioId: string,
  empresaId: string,
): Promise<boolean> {
  try {
    const updated = await prisma.notificacao.updateMany({
      where: { id, usuarioId, empresaId, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return updated.count > 0;
  } catch (err) {
    console.error("[notifications] Falha ao marcar como lida:", err);
    return false;
  }
}

/**
 * Marca todas as notificações de um usuário como lidas.
 */
export async function markAllNotificationsAsRead(
  usuarioId: string,
  empresaId: string,
): Promise<void> {
  try {
    await prisma.notificacao.updateMany({
      where: { usuarioId, empresaId, lidaEm: null },
      data: { lidaEm: new Date() },
    });
  } catch (err) {
    console.error("[notifications] Falha ao marcar todas como lidas:", err);
  }
}

/**
 * Retorna o total de notificações não lidas de um usuário.
 */
export async function getUnreadNotificationsCount(
  usuarioId: string,
  empresaId: string,
): Promise<number> {
  try {
    return await prisma.notificacao.count({
      where: { usuarioId, empresaId, lidaEm: null },
    });
  } catch (err) {
    console.error("[notifications] Falha ao contar não lidas:", err);
    return 0;
  }
}
