/**
 * backfill-role-rename.ts
 *
 * Script idempotente para renomear os papéis OPERADOR → TECNICO_SST
 * e LEITOR → COLABORADOR em ambientes que já possuem dados.
 *
 * - Somente os códigos antigos conhecidos são tocados.
 * - A nova permissão "colaborador.visualizar-proprio" é criada (se não existir)
 *   e vinculada ao papel COLABORADOR.
 * - Nunca sobrescreve permissões de outros papéis.
 *
 * Uso:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/backfill-role-rename.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Mapeamento seguro: apenas códigos antigos conhecidos são renomeados. */
const RENAME_MAP: Record<
  string,
  { codigo: string; nome: string; descricao: string }
> = {
  OPERADOR: {
    codigo: "TECNICO_SST",
    nome: "Técnico SST",
    descricao: "Operacao do dia a dia com foco em ASOs e treinamentos",
  },
  LEITOR: {
    codigo: "COLABORADOR",
    nome: "Colaborador",
    descricao: "Acesso restrito ao proprio perfil",
  },
};

const NOVA_PERMISSAO = {
  codigo: "colaborador.visualizar-proprio",
  nome: "Visualizar próprio perfil",
  modulo: "perfil",
};

/** Permissões a REMOVER do papel COLABORADOR após rename (eram do LEITOR). */
const PERMISSOES_REMOVER_DO_COLABORADOR = ["dashboard.visualizar"];

async function main() {
  console.log("Iniciando backfill de renomeação de papéis...");

  // 1. Upsert da nova permissão
  const permissao = await prisma.permissao.upsert({
    where: { codigo: NOVA_PERMISSAO.codigo },
    update: { nome: NOVA_PERMISSAO.nome, modulo: NOVA_PERMISSAO.modulo },
    create: NOVA_PERMISSAO,
  });
  console.log(`Permissão garantida: ${permissao.codigo}`);

  // 2. Busca todas as empresas
  const empresas = await prisma.empresa.findMany({
    select: { id: true, nome: true },
  });
  console.log(`Processando ${empresas.length} empresa(s)...`);

  for (const empresa of empresas) {
    console.log(`\n→ Empresa: ${empresa.nome} (${empresa.id})`);

    for (const [codigoAntigo, novoValor] of Object.entries(RENAME_MAP)) {
      // Verifica se o papel com código antigo existe
      const papelAntigo = await prisma.papel.findFirst({
        where: { empresaId: empresa.id, codigo: codigoAntigo },
      });

      if (!papelAntigo) {
        console.log(`  [skip] Papel ${codigoAntigo} não encontrado.`);
        continue;
      }

      // Verifica se o novo código já existe (idempotência)
      const papelNovoJaExiste = await prisma.papel.findFirst({
        where: { empresaId: empresa.id, codigo: novoValor.codigo },
      });

      if (papelNovoJaExiste) {
        console.log(
          `  [skip] Papel ${novoValor.codigo} já existe — nada a fazer para ${codigoAntigo}.`,
        );
        continue;
      }

      // Renomeia
      await prisma.papel.update({
        where: { id: papelAntigo.id },
        data: {
          codigo: novoValor.codigo,
          nome: novoValor.nome,
          descricao: novoValor.descricao,
        },
      });
      console.log(`  [ok] ${codigoAntigo} → ${novoValor.codigo}`);

      // Para COLABORADOR: ajustar permissões
      if (novoValor.codigo === "COLABORADOR") {
        // Remove permissões que LEITOR tinha mas COLABORADOR não deve ter
        const permissoesRemover = await prisma.permissao.findMany({
          where: { codigo: { in: PERMISSOES_REMOVER_DO_COLABORADOR } },
        });

        for (const p of permissoesRemover) {
          const deletado = await prisma.papelPermissao.deleteMany({
            where: { papelId: papelAntigo.id, permissaoId: p.id },
          });
          if (deletado.count > 0) {
            console.log(`    [-] Permissão removida: ${p.codigo}`);
          }
        }

        // Garante a nova permissão de perfil próprio
        await prisma.papelPermissao.upsert({
          where: {
            papelId_permissaoId: {
              papelId: papelAntigo.id,
              permissaoId: permissao.id,
            },
          },
          update: {},
          create: {
            papelId: papelAntigo.id,
            permissaoId: permissao.id,
          },
        });
        console.log(`    [+] Permissão garantida: ${permissao.codigo}`);
      }
    }
  }

  console.log("\nBackfill de renomeação de papéis concluído.");
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
