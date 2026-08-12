-- CreateEnum
CREATE TYPE "WorkspaceBlockReason" AS ENUM ('FATURA_EM_ABERTO', 'SOLICITACAO_DO_CLIENTE', 'VERIFICACAO_DE_SEGURANCA', 'ORIENTACAO_DO_CONSULTOR', 'OUTRO');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "blocked_at" TIMESTAMP(3),
ADD COLUMN "blocked_reason" "WorkspaceBlockReason",
ADD COLUMN "blocked_detail" TEXT,
ADD COLUMN "blocked_by" UUID;
