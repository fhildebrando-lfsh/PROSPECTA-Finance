-- AlterEnum
ALTER TYPE "WorkspaceBlockReason" ADD VALUE 'AGUARDANDO_APROVACAO';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "admin_notified_at" TIMESTAMP(3);
