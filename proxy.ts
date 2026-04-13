import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth-token";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PAGE_PATHS = new Set(["/login"]);
const PUBLIC_API_PATHS = new Set(["/api/auth/login", "/api/auth/logout"]);

function isPrivatePage(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/colaboradores" ||
    pathname.startsWith("/colaboradores/") ||
    pathname === "/tipos-aso" ||
    pathname.startsWith("/tipos-aso/") ||
    pathname === "/tipos-treinamento" ||
    pathname.startsWith("/tipos-treinamento/") ||
    pathname === "/treinamentos" ||
    pathname.startsWith("/treinamentos/") ||
    pathname === "/asos" ||
    pathname.startsWith("/asos/")
  );
}

function isPrivateApi(pathname: string) {
  return pathname.startsWith("/api/") && !PUBLIC_API_PATHS.has(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PAGE_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyAuthToken(token) : null;

  if (!session && isPrivateApi(pathname)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!session && isPrivatePage(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/colaboradores/:path*",
    "/tipos-aso/:path*",
    "/tipos-treinamento/:path*",
    "/treinamentos/:path*",
    "/asos/:path*",
    "/api/:path*",
  ],
};
