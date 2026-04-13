import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "sstlite_auth";
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AuthSession = {
  userId: string;
  empresaId: string;
  roles: string[];
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET (ou AUTH_SECRET) não está configurado");
  }

  return new TextEncoder().encode(secret);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  };
}

export async function signAuthToken(session: AuthSession) {
  return new SignJWT({ roles: session.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_TTL_SECONDS}s`)
    .setAudience(session.empresaId)
    .setIssuer("sst-lite")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "sst-lite",
    });

    const userId = payload.sub;
    const empresaId = typeof payload.aud === "string" ? payload.aud : null;
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === "string")
      : [];

    if (!userId || !empresaId) {
      return null;
    }

    return { userId, empresaId, roles };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export function getAuthTokenFromRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenChunk = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!tokenChunk) return null;

  return decodeURIComponent(tokenChunk.slice(`${AUTH_COOKIE_NAME}=`.length));
}
