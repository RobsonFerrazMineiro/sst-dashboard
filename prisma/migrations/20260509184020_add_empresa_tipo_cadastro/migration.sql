-- CreateEnum
CREATE TYPE "TipoCadastro" AS ENUM ('PESSOAL', 'EMPRESA');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "nome_fantasia" TEXT,
ADD COLUMN     "nome_responsavel" TEXT,
ADD COLUMN     "tipo_cadastro" "TipoCadastro" NOT NULL DEFAULT 'EMPRESA';
