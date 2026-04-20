/*
  Warnings:

  - A unique constraint covering the columns `[colaborador_id]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresa_id,login]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `login` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable (passo 1: adiciona login como nullable para backfill)
ALTER TABLE "Usuario" ADD COLUMN "colaborador_id" TEXT,
ADD COLUMN "login" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- Backfill: usuários existentes usam o email como login
UPDATE "Usuario" SET "login" = "email" WHERE "login" IS NULL;

-- Torna login obrigatório após backfill
ALTER TABLE "Usuario" ALTER COLUMN "login" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_colaborador_id_key" ON "Usuario"("colaborador_id");

-- CreateIndex
CREATE INDEX "Usuario_empresa_id_is_account_owner_idx" ON "Usuario"("empresa_id", "is_account_owner");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_empresa_id_login_key" ON "Usuario"("empresa_id", "login");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
