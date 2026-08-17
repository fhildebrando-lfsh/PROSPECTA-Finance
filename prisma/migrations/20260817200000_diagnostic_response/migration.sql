-- Etapa 10 (2026-08-17) — instrumentos de diagnóstico A1/A2/B/C (§12).
-- `answers` é JSONB porque a redação das perguntas ainda é decisão do dono do
-- produto (Pendências #6-8 da Metodologia v5.0), enquanto os campos coletados
-- já estão especificados em §12.3/12.4/12.6. Tabela nova, aditivo.

-- CreateEnum
CREATE TYPE "DiagnosticInstrument" AS ENUM ('A1', 'A2', 'B', 'C');

-- CreateTable
CREATE TABLE "diagnostic_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "engagement_id" UUID NOT NULL,
    "instrument" "DiagnosticInstrument" NOT NULL,
    "answers" JSONB NOT NULL,
    "catalog_version" TEXT NOT NULL DEFAULT '1',
    "submitted_at" TIMESTAMP(3),
    "responded_by" UUID NOT NULL,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagnostic_responses_engagement_id_instrument_idx" ON "diagnostic_responses"("engagement_id", "instrument");

-- AddForeignKey
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
