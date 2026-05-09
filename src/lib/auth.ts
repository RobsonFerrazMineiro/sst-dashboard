import {
  AUTH_COOKIE_NAME,
  type AuthSession,
  clearAuthCookie,
  getAuthCookieOptions,
  getAuthTokenFromRequest,
  setAuthCookie,
  signAuthToken,
  verifyAuthToken,
} from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  getAuthCookieOptions,
  setAuthCookie,
  signAuthToken,
  verifyAuthToken,
};
export type { AuthSession };

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function getRequestAuthSession(
  request: Request | NextRequest,
): Promise<AuthSession | null> {
  const token = getAuthTokenFromRequest(request);
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function requireServerAuthSession() {
  const session = await getServerAuthSession();
  if (!session) return null;
  return session;
}

export function unauthorizedResponse(message = "Não autenticado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Sem permissão") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getAuthenticatedUser(request: Request | NextRequest) {
  const session = await getRequestAuthSession(request);
  if (!session) return null;

  const user = await prisma.usuario.findFirst({
    where: {
      id: session.userId,
      empresaId: session.empresaId,
      status: "ATIVO",
      empresa: { status: "ATIVA" },
    },
    include: {
      empresa: {
        select: { id: true, nome: true, nomeFantasia: true },
      },
      usuarioPapeis: {
        include: {
          papel: {
            include: {
              permissoes: {
                include: {
                  permissao: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return { session, user };
}
