import { PrismaPg } from "@prisma/adapter-pg";
import {
  PlanoEmpresa,
  PrismaClient,
  StatusEmpresa,
  StatusUsuario,
} from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/auth";
import { EMPRESA_PADRAO_SLUG } from "../src/lib/tenant";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissoesBase = [
  {
    codigo: "dashboard.visualizar",
    nome: "Visualizar dashboard",
    modulo: "dashboard",
  },
  {
    codigo: "colaboradores.gerenciar",
    nome: "Gerenciar colaboradores",
    modulo: "colaboradores",
  },
  {
    codigo: "tipos-aso.gerenciar",
    nome: "Gerenciar tipos de ASO",
    modulo: "tipos-aso",
  },
  {
    codigo: "tipos-treinamento.gerenciar",
    nome: "Gerenciar tipos de treinamento",
    modulo: "tipos-treinamento",
  },
  {
    codigo: "asos.gerenciar",
    nome: "Gerenciar ASOs",
    modulo: "asos",
  },
  {
    codigo: "treinamentos.gerenciar",
    nome: "Gerenciar treinamentos",
    modulo: "treinamentos",
  },
];

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { slug: EMPRESA_PADRAO_SLUG },
    update: {
      status: StatusEmpresa.ATIVA,
      plano: PlanoEmpresa.LITE,
    },
    create: {
      nome: "Empresa Padrao SST Lite",
      slug: EMPRESA_PADRAO_SLUG,
      status: StatusEmpresa.ATIVA,
      plano: PlanoEmpresa.LITE,
    },
  });

  for (const permissao of permissoesBase) {
    await prisma.permissao.upsert({
      where: { codigo: permissao.codigo },
      update: {
        nome: permissao.nome,
        modulo: permissao.modulo,
      },
      create: permissao,
    });
  }

  const papelAdmin =
    (await prisma.papel.findFirst({
      where: { empresaId: empresa.id, codigo: "ADMIN" },
    })) ??
    (await prisma.papel.create({
      data: {
        empresaId: empresa.id,
        nome: "Administrador",
        codigo: "ADMIN",
        descricao: "Acesso completo ao SST Lite",
      },
    }));

  const permissoes = await prisma.permissao.findMany({
    where: { codigo: { in: permissoesBase.map((item) => item.codigo) } },
  });

  for (const permissao of permissoes) {
    const exists = await prisma.papelPermissao.findUnique({
      where: {
        papelId_permissaoId: {
          papelId: papelAdmin.id,
          permissaoId: permissao.id,
        },
      },
    });

    if (!exists) {
      await prisma.papelPermissao.create({
        data: {
          papelId: papelAdmin.id,
          permissaoId: permissao.id,
        },
      });
    }
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@sstlite.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  const usuarioExistente = await prisma.usuario.findFirst({
    where: { empresaId: empresa.id, email: adminEmail },
  });

  const usuario = usuarioExistente
    ? await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nome: "Administrador SST Lite",
          senhaHash: await hashPassword(adminPassword),
          status: StatusUsuario.ATIVO,
        },
      })
    : await prisma.usuario.create({
        data: {
          empresaId: empresa.id,
          nome: "Administrador SST Lite",
          email: adminEmail,
          senhaHash: await hashPassword(adminPassword),
          status: StatusUsuario.ATIVO,
        },
      });

  const vinculo = await prisma.usuarioPapel.findUnique({
    where: {
      usuarioId_papelId: {
        usuarioId: usuario.id,
        papelId: papelAdmin.id,
      },
    },
  });

  if (!vinculo) {
    await prisma.usuarioPapel.create({
      data: {
        usuarioId: usuario.id,
        papelId: papelAdmin.id,
      },
    });
  }

  console.log("Auth Lite bootstrap concluido.");
  console.log(`Email: ${adminEmail}`);
  console.log(`Senha: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("Bootstrap auth falhou:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
