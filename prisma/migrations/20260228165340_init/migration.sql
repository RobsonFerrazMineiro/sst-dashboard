-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsoExam" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsoExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingType" (
    "id" TEXT NOT NULL,
    "nr" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "trainingTypeId" TEXT,
    "nrFallback" TEXT,
    "trainingDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collaborator_name_idx" ON "Collaborator"("name");

-- CreateIndex
CREATE INDEX "Collaborator_sector_idx" ON "Collaborator"("sector");

-- CreateIndex
CREATE INDEX "AsoExam_collaboratorId_idx" ON "AsoExam"("collaboratorId");

-- CreateIndex
CREATE INDEX "AsoExam_validUntil_idx" ON "AsoExam"("validUntil");

-- CreateIndex
CREATE INDEX "TrainingType_nr_idx" ON "TrainingType"("nr");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_nr_name_key" ON "TrainingType"("nr", "name");

-- CreateIndex
CREATE INDEX "TrainingRecord_collaboratorId_idx" ON "TrainingRecord"("collaboratorId");

-- CreateIndex
CREATE INDEX "TrainingRecord_trainingTypeId_idx" ON "TrainingRecord"("trainingTypeId");

-- CreateIndex
CREATE INDEX "TrainingRecord_validUntil_idx" ON "TrainingRecord"("validUntil");

-- AddForeignKey
ALTER TABLE "AsoExam" ADD CONSTRAINT "AsoExam_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "TrainingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
