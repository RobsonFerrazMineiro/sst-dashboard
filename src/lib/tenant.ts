import type { PrismaClient } from "@prisma/client";

export const EMPRESA_PADRAO_SLUG = "empresa-padrao-sst-lite";

export async function getEmpresaPadraoId(prisma: PrismaClient) {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: EMPRESA_PADRAO_SLUG },
    select: { id: true },
  });

  if (!empresa) {
    throw new Error(
      `Empresa padrão não encontrada para o slug "${EMPRESA_PADRAO_SLUG}"`,
    );
  }

  return empresa.id;
}
