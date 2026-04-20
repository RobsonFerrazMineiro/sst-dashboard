import { PrismaPg } from "@prisma/adapter-pg";
import { NR, PlanoEmpresa, PrismaClient, StatusEmpresa } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/auth";
import { EMPRESA_PADRAO_SLUG } from "../src/lib/tenant";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsFrom(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  d.setHours(0, 0, 0, 0);
  return d;
}

const mapNR: Record<string, NR> = {
  "NR-05": NR.NR_05,
  "NR-06": NR.NR_06,
  "NR-10": NR.NR_10,
  "NR-11": NR.NR_11,
  "NR-12": NR.NR_12,
  "NR-18": NR.NR_18,
  "NR-20": NR.NR_20,
  "NR-33": NR.NR_33,
  "NR-35": NR.NR_35,
};

async function main() {
  console.log("Seeding database...");

  await prisma.usuarioPapel.deleteMany();
  await prisma.papelPermissao.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.papel.deleteMany();
  await prisma.permissao.deleteMany();
  await prisma.treinamento.deleteMany();
  await prisma.aSO.deleteMany();
  await prisma.tipoTreinamento.deleteMany();
  await prisma.tipoASO.deleteMany();
  await prisma.colaborador.deleteMany();
  await prisma.empresa.deleteMany();

  const empresa = await prisma.empresa.create({
    data: {
      nome: "Empresa Padrao SST Lite",
      slug: EMPRESA_PADRAO_SLUG,
      status: StatusEmpresa.ATIVA,
      plano: PlanoEmpresa.LITE,
    },
  });

  const permissoes = [
    {
      codigo: "dashboard.visualizar",
      nome: "Visualizar dashboard",
      modulo: "dashboard",
    },
    {
      codigo: "colaboradores.visualizar",
      nome: "Visualizar colaboradores",
      modulo: "colaboradores",
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
    {
      codigo: "colaborador.visualizar-proprio",
      nome: "Visualizar próprio perfil",
      modulo: "perfil",
    },
  ];

  const papeisBase = [
    {
      codigo: "ADMIN",
      nome: "Administrador",
      descricao: "Acesso completo ao SST Lite",
      permissoes: permissoes.map((item) => item.codigo),
    },
    {
      codigo: "GESTOR",
      nome: "Gestor",
      descricao: "Consulta colaboradores e dashboard. Sem CRUD operacional.",
      permissoes: [
        "dashboard.visualizar",
        "colaboradores.visualizar",
        "colaborador.visualizar-proprio",
      ],
    },
    {
      codigo: "TECNICO_SST",
      nome: "Técnico SST",
      descricao: "Gerencia colaboradores, ASOs e treinamentos",
      permissoes: [
        "dashboard.visualizar",
        "colaboradores.visualizar",
        "colaboradores.gerenciar",
        "asos.gerenciar",
        "treinamentos.gerenciar",
        "colaborador.visualizar-proprio",
      ],
    },
    {
      codigo: "COLABORADOR",
      nome: "Colaborador",
      descricao: "Acesso restrito ao proprio perfil",
      permissoes: ["colaborador.visualizar-proprio"],
    },
  ] as const;

  await prisma.permissao.createMany({ data: permissoes });

  const permissoesCriadas = await prisma.permissao.findMany({
    orderBy: { codigo: "asc" },
  });
  const permissaoByCodigo = new Map(
    permissoesCriadas.map((permissao) => [permissao.codigo, permissao]),
  );

  for (const papelBase of papeisBase) {
    const papel = await prisma.papel.create({
      data: {
        empresaId: empresa.id,
        nome: papelBase.nome,
        codigo: papelBase.codigo,
        descricao: papelBase.descricao,
      },
    });

    await prisma.papelPermissao.createMany({
      data: papelBase.permissoes
        .map((codigo) => permissaoByCodigo.get(codigo))
        .filter((permissao) => permissao !== undefined)
        .map((permissao) => ({
          papelId: papel.id,
          permissaoId: permissao.id,
        })),
      skipDuplicates: true,
    });
  }

  const papelAdmin = await prisma.papel.findFirstOrThrow({
    where: { empresaId: empresa.id, codigo: "ADMIN" },
  });

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@sstlite.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  const admin = await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: "Administrador SST Lite",
      login: adminEmail,
      email: adminEmail,
      senhaHash: await hashPassword(adminPassword),
      isAccountOwner: true,
      status: "ATIVO",
    },
  });

  await prisma.usuarioPapel.create({
    data: {
      usuarioId: admin.id,
      papelId: papelAdmin.id,
    },
  });

  await prisma.tipoASO.createMany({
    data: [
      {
        empresaId: empresa.id,
        nome: "Admissional",
        validadeMeses: 12,
        descricao: "ASO de admissao",
      },
      {
        empresaId: empresa.id,
        nome: "Periodico",
        validadeMeses: 12,
        descricao: "ASO periodico anual",
      },
      {
        empresaId: empresa.id,
        nome: "Retorno ao Trabalho",
        validadeMeses: 12,
        descricao: "Retorno apos afastamento",
      },
      {
        empresaId: empresa.id,
        nome: "Mudanca de Funcao",
        validadeMeses: 12,
        descricao: "Mudanca de funcao",
      },
      {
        empresaId: empresa.id,
        nome: "Demissional",
        validadeMeses: 0,
        descricao: "ASO demissional",
      },
    ],
  });

  const tiposASOList = await prisma.tipoASO.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nome: "asc" },
  });

  await prisma.tipoTreinamento.createMany({
    data: [
      {
        empresaId: empresa.id,
        nr: NR.NR_35,
        nome: "Trabalho em Altura",
        validadeMeses: 24,
        descricao: "Capacitacao NR-35",
      },
      {
        empresaId: empresa.id,
        nr: NR.NR_10,
        nome: "Seguranca em Instalacoes Eletricas",
        validadeMeses: 24,
        descricao: "Capacitacao NR-10",
      },
      {
        empresaId: empresa.id,
        nr: NR.NR_33,
        nome: "Espaco Confinado",
        validadeMeses: 12,
        descricao: "Capacitacao NR-33",
      },
      {
        empresaId: empresa.id,
        nr: NR.NR_06,
        nome: "EPI",
        validadeMeses: 12,
        descricao: "Treinamento de EPI",
      },
      {
        empresaId: empresa.id,
        nr: NR.NR_11,
        nome: "Transporte e Movimentacao",
        validadeMeses: 24,
        descricao: "NR-11",
      },
    ],
  });

  const tiposTreinoList = await prisma.tipoTreinamento.findMany({
    where: { empresaId: empresa.id },
    orderBy: [{ nr: "asc" }, { nome: "asc" }],
  });

  const colaboradores = [
    {
      nome: "Gabriel Souza",
      setor: "Operacao",
      cargo: "Operador",
      matricula: "MAT-1001",
    },
    {
      nome: "Ana Paula Lima",
      setor: "Manutencao",
      cargo: "Tecnica",
      matricula: "MAT-1002",
    },
    {
      nome: "Bruno Martins",
      setor: "SMS",
      cargo: "Tecnico",
      matricula: "MAT-1003",
    },
    {
      nome: "Carla Ribeiro",
      setor: "ADM",
      cargo: "Assistente",
      matricula: "MAT-1004",
    },
    {
      nome: "Diego Santos",
      setor: "Operacao",
      cargo: "Supervisor",
      matricula: "MAT-1005",
    },
    {
      nome: "Eduarda Alves",
      setor: "Manutencao",
      cargo: "Auxiliar",
      matricula: "MAT-1006",
    },
    {
      nome: "Felipe Costa",
      setor: "Operacao",
      cargo: "Operador",
      matricula: "MAT-1007",
    },
    {
      nome: "Helena Barros",
      setor: "SMS",
      cargo: "Analista",
      matricula: "MAT-1008",
    },
  ];

  await prisma.colaborador.createMany({
    data: colaboradores.map((colaborador) => ({
      empresaId: empresa.id,
      ...colaborador,
    })),
  });

  const colabs = await prisma.colaborador.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nome: "asc" },
  });

  const today = daysFromToday(0);

  const tipoPeriodico =
    tiposASOList.find((tipo) => tipo.nome === "Periodico") ?? tiposASOList[0];
  const tipoAdmissional =
    tiposASOList.find((tipo) => tipo.nome === "Admissional") ?? tiposASOList[0];

  const asoData = [
    {
      colab: colabs[0],
      tipo: tipoPeriodico,
      data_aso: monthsFrom(today, -10),
      validade_aso: monthsFrom(today, 2),
      clinica: "Clinica Vida",
      observacao: "Apto",
    },
    {
      colab: colabs[1],
      tipo: tipoPeriodico,
      data_aso: monthsFrom(today, -11),
      validade_aso: daysFromToday(20),
      clinica: "Clinica Saude Total",
      observacao: "Apto",
    },
    {
      colab: colabs[2],
      tipo: tipoPeriodico,
      data_aso: monthsFrom(today, -14),
      validade_aso: daysFromToday(-15),
      clinica: "Clinica Vida",
      observacao: "Apto",
    },
    {
      colab: colabs[3],
      tipo: tipoAdmissional,
      data_aso: monthsFrom(today, -24),
      validade_aso: null,
      clinica: "Clinica Ocupacional",
      observacao: "Pendente de atualizacao",
    },
  ];

  const extraASOs = colabs.slice(4).map((colaborador, idx) => {
    const bucket = idx % 3;
    const validade =
      bucket === 0
        ? daysFromToday(120)
        : bucket === 1
          ? daysFromToday(10)
          : daysFromToday(-5);

    return {
      colab: colaborador,
      tipo: tipoPeriodico,
      data_aso: monthsFrom(today, -12),
      validade_aso: validade,
      clinica: "Clinica Saude Total",
      observacao: bucket === 2 ? "Apto (vencido)" : "Apto",
    };
  });

  for (const item of [...asoData, ...extraASOs]) {
    await prisma.aSO.create({
      data: {
        empresaId: empresa.id,
        colaboradorId: item.colab.id,
        colaborador_nome: item.colab.nome,
        setor: item.colab.setor,
        cargo: item.colab.cargo,
        tipoASOId: item.tipo.id,
        tipoASO_nome: item.tipo.nome,
        data_aso: item.data_aso,
        validade_aso: item.validade_aso,
        clinica: item.clinica,
        observacao: item.observacao,
      },
    });
  }

  const pickTipoTreino = (nr: string) =>
    tiposTreinoList.find((tipo) => tipo.nr === mapNR[nr]) ?? tiposTreinoList[0];

  const treinoSeeds = [
    { colab: colabs[0], nr: "NR-35", validade: daysFromToday(90), ch: 8 },
    { colab: colabs[1], nr: "NR-10", validade: daysFromToday(15), ch: 16 },
    { colab: colabs[2], nr: "NR-33", validade: daysFromToday(-10), ch: 16 },
    { colab: colabs[3], nr: "NR-06", validade: null, ch: 2 },
  ];

  const extraTreinos = colabs.flatMap((colaborador, idx) => {
    const nrs = ["NR-35", "NR-10", "NR-33", "NR-11"] as const;
    const chosen = nrs[idx % nrs.length];
    const bucket = idx % 4;
    const validade =
      bucket === 0
        ? daysFromToday(180)
        : bucket === 1
          ? daysFromToday(25)
          : bucket === 2
            ? daysFromToday(-30)
            : null;

    return [
      {
        colab: colaborador,
        nr: chosen,
        validade,
        ch: chosen === "NR-35" ? 8 : 16,
      },
    ];
  });

  for (const treino of [...treinoSeeds, ...extraTreinos]) {
    const tipo = pickTipoTreino(treino.nr);

    await prisma.treinamento.create({
      data: {
        empresaId: empresa.id,
        colaboradorId: treino.colab.id,
        colaborador_nome: treino.colab.nome,
        tipoTreinamentoId: tipo.id,
        nr: mapNR[treino.nr],
        data_treinamento: monthsFrom(today, -10),
        validade: treino.validade,
        carga_horaria: treino.ch,
      },
    });
  }

  console.log("Seed concluido.");
}

main()
  .catch((error) => {
    console.error("Seed falhou:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
