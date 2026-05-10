import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markAllNotificationsAsRead } from "@/lib/notifications";
import { NextResponse } from "next/server";

// ─── GET /api/notificacoes ────────────────────────────────────────────────────
// Retorna as 30 notificações mais recentes do usuário logado.
export async function GET(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;

  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: { usuarioId: user.id, empresaId: session.empresaId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        titulo: true,
        mensagem: true,
        tipo: true,
        lidaEm: true,
        createdAt: true,
      },
    });

    const naoLidas = notificacoes.filter((n) => !n.lidaEm).length;

    return NextResponse.json({ notificacoes, naoLidas });
  } catch (err) {
    console.error("[GET /api/notificacoes]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ─── PATCH /api/notificacoes ──────────────────────────────────────────────────
// Marca TODAS as notificações do usuário como lidas.
export async function PATCH(req: Request) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;

  await markAllNotificationsAsRead(user.id, session.empresaId);

  return NextResponse.json({ ok: true });
}
