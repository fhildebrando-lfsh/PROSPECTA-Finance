-- Etapa 9 (2026-08-17) — os dez artefatos codificados do Método (§12.1).
-- Versionado e nunca sobrescrito: cada validação de fase gera uma versão nova.
-- Tabela nova, aditivo.

CREATE TYPE "DeliverableCode" AS ENUM ('PAN', 'AFF', 'RAP', 'MEC', 'MRP', 'PLA', 'PIP', 'MFP', 'PCP', 'PFI');

CREATE TYPE "DeliverableStatus" AS ENUM ('RASCUNHO', 'VALIDADO', 'ASSINADO');

CREATE TABLE "deliverables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "engagement_id" UUID NOT NULL,
    "code" "DeliverableCode" NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'RASCUNHO',
    "content" JSONB NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_at" TIMESTAMP(3),

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- A unicidade é o que garante o versionamento: não existem duas versões
-- iguais do mesmo artefato no mesmo contrato.
CREATE UNIQUE INDEX "deliverables_engagement_id_code_version_key" ON "deliverables"("engagement_id", "code", "version");

CREATE INDEX "deliverables_workspace_id_code_idx" ON "deliverables"("workspace_id", "code");

ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
