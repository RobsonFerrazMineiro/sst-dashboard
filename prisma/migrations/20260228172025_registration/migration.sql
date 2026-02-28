/*
  Warnings:

  - A unique constraint covering the columns `[registration]` on the table `Collaborator` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Collaborator" ADD COLUMN     "registration" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_registration_key" ON "Collaborator"("registration");
