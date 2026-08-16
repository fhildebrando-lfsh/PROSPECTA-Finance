-- Etapa 9-A.4 (2026-08-16) — PROSPECTA-MCRF-1.0 §48.
-- Foto versionada de um cálculo de reserva. Nunca sobrescreve histórico: cada
-- avaliação é uma linha nova, com a versão da metodologia que a produziu.
-- Aditivo: tabela nova, nenhuma coluna existente alterada.

CREATE TABLE "mcrf_assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "methodology_version" TEXT NOT NULL,
    "calculation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_reference_date" DATE NOT NULL,
    "cema" DECIMAL(14,2) NOT NULL,
    "ccm" DECIMAL(14,2) NOT NULL,
    "reserve_target" DECIMAL(14,2) NOT NULL,
    "eligible_reserve" DECIMAL(14,2) NOT NULL,
    "iprf" INTEGER,
    "scenarios" JSONB NOT NULL,
    "main_drivers" JSONB NOT NULL,
    "data_confidence" TEXT NOT NULL,
    "created_by" UUID,

    CONSTRAINT "mcrf_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mcrf_assessments_workspace_id_calculation_date_idx" ON "mcrf_assessments"("workspace_id", "calculation_date");

ALTER TABLE "mcrf_assessments" ADD CONSTRAINT "mcrf_assessments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
