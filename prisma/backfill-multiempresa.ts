import { PrismaPg } from "@prisma/adapter-pg";
import { PlanoEmpresa, PrismaClient, StatusEmpresa } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const EMPRESA_PADRAO = {
  nome: "Empresa Padrao SST Lite",
  slug: "empresa-padrao-sst-lite",
  status: StatusEmpresa.ATIVA,
  plano: PlanoEmpresa.LITE,
} as const;

async function garantirEmpresaPadrao() {
  return prisma.empresa.upsert({
    where: { slug: EMPRESA_PADRAO.slug },
    update: {},
    create: EMPRESA_PADRAO,
    select: { id: true, nome: true, slug: true },
  });
}

async function backfillTabela(tabela: string, empresaId: string) {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "${tabela}" SET "empresa_id" = $1 WHERE "empresa_id" IS NULL`,
    empresaId,
  );

  console.log(`- ${tabela}: ${result} registro(s) atualizados`);
}

async function main() {
  console.log("Iniciando backfill multiempresa...");

  const empresa = await garantirEmpresaPadrao();
  console.log(
    `Empresa padrao pronta: ${empresa.nome} (${empresa.slug}) - ${empresa.id}`,
  );

  const tabelas = [
    "Colaborador",
    "ASO",
    "Treinamento",
    "TipoASO",
    "TipoTreinamento",
  ] as const;

  for (const tabela of tabelas) {
    await backfillTabela(tabela, empresa.id);
  }

  console.log("Backfill concluido.");
}

main()
  .catch((error) => {
    console.error("Backfill falhou:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
