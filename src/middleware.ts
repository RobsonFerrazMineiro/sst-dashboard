import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware mínimo:
 * - Injeta o header `x-pathname` para que layouts server-side possam
 *   ler a rota atual sem depender de hooks client.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - arquivos com extensão (ex: .svg, .png)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
