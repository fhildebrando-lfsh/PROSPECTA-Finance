-- Etapa 9-A.2 (2026-08-16) — PROSPECTA-MCRF-1.0 §25/§26.
-- Seguros (com franquia, carência e prazo de indenização) e proteções
-- trabalhistas/previdenciárias. Tudo aditivo: tabelas e tipos novos, nenhuma
-- coluna existente alterada.

CREATE TYPE "InsuranceKind" AS ENUM ('VIDA', 'INCAPACIDADE', 'PROTECAO_RENDA', 'SAUDE', 'ODONTOLOGICO', 'AUTOMOVEL', 'RESIDENCIAL', 'PRESTAMISTA', 'EMPRESARIAL', 'OUTRO');

CREATE TYPE "BenefitKind" AS ENUM ('FGTS', 'SEGURO_DESEMPREGO', 'VERBAS_RESCISORIAS', 'AUXILIO_DOENCA', 'APOSENTADORIA_INVALIDEZ', 'PENSAO_MORTE', 'LICENCA_ESTATUTARIA', 'BENEFICIO_EMPREGADOR', 'OUTRO');

CREATE TABLE "insurance_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "person_id" UUID,
    "kind" "InsuranceKind" NOT NULL,
    "name" TEXT NOT NULL,
    "insurer_name" TEXT,
    "premium_monthly" DECIMAL(14,2),
    "starts_at" DATE,
    "ends_at" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "insurance_coverages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_id" UUID NOT NULL,
    "risk_covered" TEXT NOT NULL,
    "capital_insured" DECIMAL(14,2),
    "deductible" DECIMAL(14,2),
    "waiting_period_days" INTEGER,
    "payout_delay_days" INTEGER,
    "exclusions" TEXT,

    CONSTRAINT "insurance_coverages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "benefit_entitlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "kind" "BenefitKind" NOT NULL,
    "is_eligible" BOOLEAN,
    "estimated_amount" DECIMAL(14,2),
    "duration_months" INTEGER,
    "available_after_days" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benefit_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "insurance_policies_workspace_id_is_active_idx" ON "insurance_policies"("workspace_id", "is_active");

CREATE INDEX "insurance_coverages_policy_id_idx" ON "insurance_coverages"("policy_id");

CREATE INDEX "benefit_entitlements_workspace_id_person_id_idx" ON "benefit_entitlements"("workspace_id", "person_id");

ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "insurance_coverages" ADD CONSTRAINT "insurance_coverages_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "benefit_entitlements" ADD CONSTRAINT "benefit_entitlements_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "benefit_entitlements" ADD CONSTRAINT "benefit_entitlements_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
