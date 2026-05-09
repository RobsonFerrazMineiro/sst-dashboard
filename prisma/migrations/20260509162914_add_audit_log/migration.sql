-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "usuario_id" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT,
    "descricao" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_empresa_id_idx" ON "AuditLog"("empresa_id");

-- CreateIndex
CREATE INDEX "AuditLog_empresa_id_acao_idx" ON "AuditLog"("empresa_id", "acao");

-- CreateIndex
CREATE INDEX "AuditLog_empresa_id_entidade_idx" ON "AuditLog"("empresa_id", "entidade");

-- CreateIndex
CREATE INDEX "AuditLog_usuario_id_idx" ON "AuditLog"("usuario_id");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
