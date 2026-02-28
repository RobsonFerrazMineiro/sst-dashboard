import { PrismaPg } from "@prisma/adapter-pg";
import { NR, PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

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

async function main() {
  console.log("🌱 Seeding database...");

  // Limpeza (ordem importa por FK)
  await prisma.treinamento.deleteMany();
  await prisma.aSO.deleteMany();
  await prisma.tipoTreinamento.deleteMany();
  await prisma.tipoASO.deleteMany();
  await prisma.colaborador.deleteMany();

  // Tipos ASO
  await prisma.tipoASO.createMany({
    data: [
      { nome: "Admissional", validadeMeses: 12, descricao: "ASO de admissão" },
      {
        nome: "Periódico",
        validadeMeses: 12,
        descricao: "ASO periódico anual",
      },
      {
        nome: "Retorno ao Trabalho",
        validadeMeses: 12,
        descricao: "Retorno após afastamento",
      },
      {
        nome: "Mudança de Função",
        validadeMeses: 12,
        descricao: "Mudança de função",
      },
      { nome: "Demissional", validadeMeses: 0, descricao: "ASO demissional" },
    ],
  });

  const tiposASOList = await prisma.tipoASO.findMany({
    orderBy: { nome: "asc" },
  });

  // Tipos Treinamento
  await prisma.tipoTreinamento.createMany({
    data: [
      {
        nr: "NR-35",
        nome: "Trabalho em Altura",
        validadeMeses: 24,
        descricao: "Capacitação NR-35",
      },
      {
        nr: "NR-10",
        nome: "Segurança em Instalações Elétricas",
        validadeMeses: 24,
        descricao: "Capacitação NR-10",
      },
      {
        nr: "NR-33",
        nome: "Espaço Confinado",
        validadeMeses: 12,
        descricao: "Capacitação NR-33",
      },
      {
        nr: "NR-06",
        nome: "EPI",
        validadeMeses: 12,
        descricao: "Treinamento de EPI",
      },
      {
        nr: "NR-11",
        nome: "Transporte e Movimentação",
        validadeMeses: 24,
        descricao: "NR-11",
      },
    ],
  });

  const tiposTreinoList = await prisma.tipoTreinamento.findMany({
    orderBy: [{ nr: "asc" }, { nome: "asc" }],
  });

  // Colaboradores
  const colaboradores = [
    {
      nome: "Gabriel Souza",
      setor: "Operação",
      cargo: "Operador",
      matricula: "MAT-1001",
    },
    {
      nome: "Ana Paula Lima",
      setor: "Manutenção",
      cargo: "Técnica",
      matricula: "MAT-1002",
    },
    {
      nome: "Bruno Martins",
      setor: "SMS",
      cargo: "Técnico",
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
      setor: "Operação",
      cargo: "Supervisor",
      matricula: "MAT-1005",
    },
    {
      nome: "Eduarda Alves",
      setor: "Manutenção",
      cargo: "Auxiliar",
      matricula: "MAT-1006",
    },
    {
      nome: "Felipe Costa",
      setor: "Operação",
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
    data: colaboradores,
  });
  const colabs = await prisma.colaborador.findMany({
    orderBy: { nome: "asc" },
  });

  // ASOs (mistura de em dia / prestes / vencido / pendente)
  const today = daysFromToday(0);

  // Helper: escolhe tipo ASO
  const tipoPeriodic =
    tiposASOList.find((t) => t.nome === "Periódico") ?? tiposASOList[0];
  const tipoAdmissional =
    tiposASOList.find((t) => t.nome === "Admissional") ?? tiposASOList[0];

  const asoData = [
    // Em dia
    {
      colab: colabs[0],
      tipo: tipoPeriodic,
      data_aso: monthsFrom(today, -10),
      validade_aso: monthsFrom(today, 2),
      clinica: "Clínica Vida",
      observacao: "Apto",
    },
    // Prestes a vencer (<=30 dias)
    {
      colab: colabs[1],
      tipo: tipoPeriodic,
      data_aso: monthsFrom(today, -11),
      validade_aso: daysFromToday(20),
      clinica: "Clínica Saúde Total",
      observacao: "Apto",
    },
    // Vencido
    {
      colab: colabs[2],
      tipo: tipoPeriodic,
      data_aso: monthsFrom(today, -14),
      validade_aso: daysFromToday(-15),
      clinica: "Clínica Vida",
      observacao: "Apto",
    },
    // Pendente (sem validade/data => mas Base44 exige data_aso; aqui vamos simular pendente removendo validade e deixando data antiga)
    {
      colab: colabs[3],
      tipo: tipoAdmissional,
      data_aso: monthsFrom(today, -24),
      validade_aso: null,
      clinica: "Clínica Ocupacional",
      observacao: "Pendente de atualização",
    },
  ];

  // gerar alguns ASOs extras para dar volume
  const extraASOs = colabs.slice(4).map((c, idx) => {
    const bucket = idx % 3;
    const validade =
      bucket === 0
        ? daysFromToday(120)
        : bucket === 1
          ? daysFromToday(10)
          : daysFromToday(-5);

    return {
      colab: c,
      tipo: tipoPeriodic,
      data_aso: monthsFrom(today, -12),
      validade_aso: validade,
      clinica: "Clínica Saúde Total",
      observacao: bucket === 2 ? "Apto (vencido)" : "Apto",
    };
  });

  for (const item of [...asoData, ...extraASOs]) {
    await prisma.aSO.create({
      data: {
        colaborador_id: item.colab.id,
        colaborador_nome: item.colab.nome,
        setor: item.colab.setor,
        cargo: item.colab.cargo,
        tipoASO_id: item.tipo.id,
        tipoASO_nome: item.tipo.nome,
        data_aso: item.data_aso,
        validade_aso: item.validade_aso,
        clinica: item.clinica,
        observacao: item.observacao,
      },
    });
  }

  // Treinamentos
  // Vamos espalhar: em dia / prestes / vencido / sem vencimento
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

  const pickTipoTreino = (nr: string) =>
    tiposTreinoList.find((t) => t.nr === nr) ?? tiposTreinoList[0];

  const treinoSeeds = [
    // Em dia
    { colab: colabs[0], nr: "NR-35", validade: daysFromToday(90), ch: 8 },
    // Prestes a vencer
    { colab: colabs[1], nr: "NR-10", validade: daysFromToday(15), ch: 16 },
    // Vencido
    { colab: colabs[2], nr: "NR-33", validade: daysFromToday(-10), ch: 16 },
    // Sem vencimento (validade null)
    { colab: colabs[3], nr: "NR-06", validade: null, ch: 2 },
  ];

  // extras para volume
  const extraTreinos = colabs.flatMap((c, idx) => {
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
      { colab: c, nr: chosen, validade, ch: chosen === "NR-35" ? 8 : 16 },
    ];
  });

  for (const t of [...treinoSeeds, ...extraTreinos]) {
    const tipo = pickTipoTreino(t.nr);

    await prisma.treinamento.create({
      data: {
        colaborador_id: t.colab.id,
        colaborador_nome: t.colab.nome,
        tipoTreinamento: tipo.id,
        nr: mapNR[t.nr], // legado enum
        data_treinamento: monthsFrom(today, -10),
        validade: t.validade,
        carga_horaria: t.ch,
      },
    });
  }

  console.log("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
