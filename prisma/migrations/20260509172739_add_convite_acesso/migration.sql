-- CreateTable
CREATE TABLE "ConviteAcesso" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "colaborador_id" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "login_sugerido" TEXT,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConviteAcesso_token_hash_key" ON "ConviteAcesso"("token_hash");

-- CreateIndex
CREATE INDEX "ConviteAcesso_empresa_id_idx" ON "ConviteAcesso"("empresa_id");

-- CreateIndex
CREATE INDEX "ConviteAcesso_colaborador_id_idx" ON "ConviteAcesso"("colaborador_id");

-- CreateIndex
CREATE INDEX "ConviteAcesso_expires_at_idx" ON "ConviteAcesso"("expires_at");
