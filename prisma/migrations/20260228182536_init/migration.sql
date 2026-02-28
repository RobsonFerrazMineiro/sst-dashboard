-- CreateEnum
CREATE TYPE "NR" AS ENUM ('NR_05', 'NR_06', 'NR_10', 'NR_11', 'NR_12', 'NR_18', 'NR_20', 'NR_33', 'NR_35');

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "matricula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoASO" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "validadeMeses" INTEGER,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoASO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASO" (
    "id" TEXT NOT NULL,
    "colaborador_id" TEXT,
    "colaborador_nome" TEXT NOT NULL,
    "setor" TEXT,
    "cargo" TEXT,
    "tipoASO_id" TEXT,
    "tipoASO_nome" TEXT,
    "data_aso" TIMESTAMP(3) NOT NULL,
    "validade_aso" TIMESTAMP(3),
    "clinica" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTreinamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nr" TEXT NOT NULL,
    "validadeMeses" INTEGER,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTreinamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treinamento" (
    "id" TEXT NOT NULL,
    "colaborador_id" TEXT,
    "colaborador_nome" TEXT NOT NULL,
    "tipoTreinamento" TEXT,
    "nr" "NR",
    "data_treinamento" TIMESTAMP(3) NOT NULL,
    "validade" TIMESTAMP(3),
    "carga_horaria" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treinamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_matricula_key" ON "Colaborador"("matricula");

-- CreateIndex
CREATE INDEX "Colaborador_nome_idx" ON "Colaborador"("nome");

-- CreateIndex
CREATE INDEX "Colaborador_setor_idx" ON "Colaborador"("setor");

-- CreateIndex
CREATE UNIQUE INDEX "TipoASO_nome_key" ON "TipoASO"("nome");

-- CreateIndex
CREATE INDEX "ASO_colaborador_id_idx" ON "ASO"("colaborador_id");

-- CreateIndex
CREATE INDEX "ASO_tipoASO_id_idx" ON "ASO"("tipoASO_id");

-- CreateIndex
CREATE INDEX "ASO_data_aso_idx" ON "ASO"("data_aso");

-- CreateIndex
CREATE INDEX "ASO_validade_aso_idx" ON "ASO"("validade_aso");

-- CreateIndex
CREATE INDEX "TipoTreinamento_nr_idx" ON "TipoTreinamento"("nr");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTreinamento_nr_nome_key" ON "TipoTreinamento"("nr", "nome");

-- CreateIndex
CREATE INDEX "Treinamento_colaborador_id_idx" ON "Treinamento"("colaborador_id");

-- CreateIndex
CREATE INDEX "Treinamento_tipoTreinamento_idx" ON "Treinamento"("tipoTreinamento");

-- CreateIndex
CREATE INDEX "Treinamento_validade_idx" ON "Treinamento"("validade");

-- CreateIndex
CREATE INDEX "Treinamento_data_treinamento_idx" ON "Treinamento"("data_treinamento");

-- AddForeignKey
ALTER TABLE "ASO" ADD CONSTRAINT "ASO_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASO" ADD CONSTRAINT "ASO_tipoASO_id_fkey" FOREIGN KEY ("tipoASO_id") REFERENCES "TipoASO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_tipoTreinamento_fkey" FOREIGN KEY ("tipoTreinamento") REFERENCES "TipoTreinamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
