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

const papeisBase = [
  {
    codigo: "ADMIN",
    nome: "Administrador",
    descricao: "Acesso completo ao SST Lite",
    permissoes: permissoesBase.map((item) => item.codigo),
  },
  {
    codigo: "GESTOR",
    nome: "Gestor",
    descricao: "Gestao operacional ampla no SST Lite",
    permissoes: permissoesBase.map((item) => item.codigo),
  },
  {
    codigo: "OPERADOR",
    nome: "Operador",
    descricao: "Operacao do dia a dia com foco em ASOs e treinamentos",
    permissoes: [
      "dashboard.visualizar",
      "asos.gerenciar",
      "treinamentos.gerenciar",
    ],
  },
  {
    codigo: "LEITOR",
    nome: "Leitor",
    descricao: "Acompanhamento basico do dashboard",
    permissoes: ["dashboard.visualizar"],
  },
] as const;

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

  const permissoes = await prisma.permissao.findMany({
    where: { codigo: { in: permissoesBase.map((item) => item.codigo) } },
  });
  const permissaoByCodigo = new Map(
    permissoes.map((permissao) => [permissao.codigo, permissao]),
  );

  for (const papelBase of papeisBase) {
    const papel =
      (await prisma.papel.findFirst({
        where: { empresaId: empresa.id, codigo: papelBase.codigo },
      })) ??
      (await prisma.papel.create({
        data: {
          empresaId: empresa.id,
          nome: papelBase.nome,
          codigo: papelBase.codigo,
          descricao: papelBase.descricao,
        },
      }));

    await prisma.papel.update({
      where: { id: papel.id },
      data: {
        nome: papelBase.nome,
        descricao: papelBase.descricao,
      },
    });

    await prisma.papelPermissao.deleteMany({
      where: { papelId: papel.id },
    });

    const papelPermissoes = papelBase.permissoes
      .map((codigo) => permissaoByCodigo.get(codigo))
      .filter((permissao) => permissao !== undefined);

    if (papelPermissoes.length > 0) {
      await prisma.papelPermissao.createMany({
        data: papelPermissoes.map((permissao) => ({
          papelId: papel.id,
          permissaoId: permissao.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@sstlite.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  const papelAdmin = await prisma.papel.findFirstOrThrow({
    where: { empresaId: empresa.id, codigo: "ADMIN" },
  });

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
          isAccountOwner: true,
          status: StatusUsuario.ATIVO,
        },
      });

  if (!usuario.isAccountOwner) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { isAccountOwner: true, status: StatusUsuario.ATIVO },
    });
  }

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
