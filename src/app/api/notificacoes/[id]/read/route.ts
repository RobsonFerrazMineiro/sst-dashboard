import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notifications";
import { NextResponse } from "next/server";

// ─── PATCH /api/notificacoes/[id]/read ───────────────────────────────────────
// Marca uma notificação específica como lida.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return unauthorizedResponse();

  const { user, session } = auth;
  const { id } = await params;

  const updated = await markNotificationAsRead(id, user.id, session.empresaId);

  return NextResponse.json({ ok: updated });
}
