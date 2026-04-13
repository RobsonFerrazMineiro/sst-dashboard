-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'INATIVA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "PlanoEmpresa" AS ENUM ('LITE');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA',
    "plano" "PlanoEmpresa" NOT NULL DEFAULT 'LITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "ultimoLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Papel" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Papel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "modulo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPapel" (
    "usuario_id" TEXT NOT NULL,
    "papel_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioPapel_pkey" PRIMARY KEY ("usuario_id","papel_id")
);

-- CreateTable
CREATE TABLE "PapelPermissao" (
    "papel_id" TEXT NOT NULL,
    "permissao_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PapelPermissao_pkey" PRIMARY KEY ("papel_id","permissao_id")
);

-- AlterTable
ALTER TABLE "Colaborador" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "ASO" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "Treinamento" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "TipoASO" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "TipoTreinamento" ADD COLUMN "empresa_id" TEXT;

-- AlterTable
ALTER TABLE "TipoTreinamento"
ALTER COLUMN "nr" TYPE "NR"
USING REPLACE("nr", '-', '_')::"NR";

-- DropIndex
DROP INDEX "Colaborador_matricula_key";
DROP INDEX "TipoASO_nome_key";
DROP INDEX "TipoTreinamento_nr_nome_key";

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
CREATE INDEX "Empresa_status_idx" ON "Empresa"("status");
CREATE INDEX "Empresa_plano_idx" ON "Empresa"("plano");

CREATE INDEX "Usuario_empresa_id_idx" ON "Usuario"("empresa_id");
CREATE INDEX "Usuario_empresa_id_status_idx" ON "Usuario"("empresa_id", "status");
CREATE INDEX "Usuario_nome_idx" ON "Usuario"("nome");
CREATE UNIQUE INDEX "Usuario_empresa_id_email_key" ON "Usuario"("empresa_id", "email");

CREATE INDEX "Papel_empresa_id_idx" ON "Papel"("empresa_id");
CREATE UNIQUE INDEX "Papel_empresa_id_nome_key" ON "Papel"("empresa_id", "nome");
CREATE UNIQUE INDEX "Papel_empresa_id_codigo_key" ON "Papel"("empresa_id", "codigo");

CREATE UNIQUE INDEX "Permissao_codigo_key" ON "Permissao"("codigo");
CREATE INDEX "Permissao_modulo_idx" ON "Permissao"("modulo");

CREATE INDEX "UsuarioPapel_papel_id_idx" ON "UsuarioPapel"("papel_id");
CREATE INDEX "PapelPermissao_permissao_id_idx" ON "PapelPermissao"("permissao_id");

CREATE INDEX "Colaborador_empresa_id_idx" ON "Colaborador"("empresa_id");
CREATE INDEX "Colaborador_empresa_id_nome_idx" ON "Colaborador"("empresa_id", "nome");
CREATE INDEX "Colaborador_empresa_id_setor_idx" ON "Colaborador"("empresa_id", "setor");
CREATE UNIQUE INDEX "Colaborador_empresa_id_matricula_key" ON "Colaborador"("empresa_id", "matricula");

CREATE INDEX "ASO_empresa_id_idx" ON "ASO"("empresa_id");
CREATE INDEX "ASO_empresa_id_data_aso_idx" ON "ASO"("empresa_id", "data_aso");

CREATE INDEX "TipoASO_empresa_id_idx" ON "TipoASO"("empresa_id");
CREATE UNIQUE INDEX "TipoASO_empresa_id_nome_key" ON "TipoASO"("empresa_id", "nome");

CREATE INDEX "TipoTreinamento_empresa_id_idx" ON "TipoTreinamento"("empresa_id");
CREATE INDEX "TipoTreinamento_empresa_id_nr_idx" ON "TipoTreinamento"("empresa_id", "nr");
CREATE UNIQUE INDEX "TipoTreinamento_empresa_id_nr_nome_key" ON "TipoTreinamento"("empresa_id", "nr", "nome");

CREATE INDEX "Treinamento_empresa_id_idx" ON "Treinamento"("empresa_id");
CREATE INDEX "Treinamento_empresa_id_data_treinamento_idx" ON "Treinamento"("empresa_id", "data_treinamento");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Papel" ADD CONSTRAINT "Papel_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsuarioPapel" ADD CONSTRAINT "UsuarioPapel_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsuarioPapel" ADD CONSTRAINT "UsuarioPapel_papel_id_fkey" FOREIGN KEY ("papel_id") REFERENCES "Papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PapelPermissao" ADD CONSTRAINT "PapelPermissao_papel_id_fkey" FOREIGN KEY ("papel_id") REFERENCES "Papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PapelPermissao" ADD CONSTRAINT "PapelPermissao_permissao_id_fkey" FOREIGN KEY ("permissao_id") REFERENCES "Permissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ASO" ADD CONSTRAINT "ASO_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TipoASO" ADD CONSTRAINT "TipoASO_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TipoTreinamento" ADD CONSTRAINT "TipoTreinamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
