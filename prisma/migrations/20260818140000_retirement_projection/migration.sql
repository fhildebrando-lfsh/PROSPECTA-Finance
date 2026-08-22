-- Etapa 13 (2026-08-18) — RetirementProjection / PLA (§5). Tabela nova, aditivo.
--
-- UNIQUE (engagement, scenario, version): projecao e uma afirmacao datada sobre
-- o futuro. Refazer a conta com premissa nova soma versao, nunca sobrescreve —
-- senao nao ha como mostrar ao cliente o que mudou e por que.

CREATE TABLE "retirement_projections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "engagement_id" UUID NOT NULL,
    "scenario" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "target_age" INTEGER NOT NULL,
    "desired_monthly_income" DECIMAL(14,2) NOT NULL,
    "assumptions" JSONB NOT NULL,
    "required_capital" DECIMAL(14,2) NOT NULL,
    "required_monthly_contribution" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retirement_projections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retirement_projections_engagement_id_scenario_version_key" ON "retirement_projections"("engagement_id", "scenario", "version");

ALTER TABLE "retirement_projections" ADD CONSTRAINT "retirement_projections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "retirement_projections" ADD CONSTRAINT "retirement_projections_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
