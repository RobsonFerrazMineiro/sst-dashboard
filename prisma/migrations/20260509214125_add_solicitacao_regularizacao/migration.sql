-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'EM_ANALISE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoSolicitacao" AS ENUM ('ASO', 'TREINAMENTO');

-- CreateTable
CREATE TABLE "SolicitacaoRegularizacao" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "colaborador_id" TEXT NOT NULL,
    "solicitado_por_id" TEXT NOT NULL,
    "tipo" "TipoSolicitacao" NOT NULL,
    "referencia_id" TEXT NOT NULL,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoRegularizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_empresa_id_idx" ON "SolicitacaoRegularizacao"("empresa_id");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_empresa_id_status_idx" ON "SolicitacaoRegularizacao"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_empresa_id_tipo_idx" ON "SolicitacaoRegularizacao"("empresa_id", "tipo");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_colaborador_id_idx" ON "SolicitacaoRegularizacao"("colaborador_id");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_solicitado_por_id_idx" ON "SolicitacaoRegularizacao"("solicitado_por_id");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_referencia_id_idx" ON "SolicitacaoRegularizacao"("referencia_id");

-- CreateIndex
CREATE INDEX "SolicitacaoRegularizacao_criado_em_idx" ON "SolicitacaoRegularizacao"("criado_em");

-- AddForeignKey
ALTER TABLE "SolicitacaoRegularizacao" ADD CONSTRAINT "SolicitacaoRegularizacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoRegularizacao" ADD CONSTRAINT "SolicitacaoRegularizacao_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "Colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
