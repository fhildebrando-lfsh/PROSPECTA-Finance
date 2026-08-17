-- Etapa 8 (2026-08-17) — camada de método: ConsultingEngagement, MethodPhase e
-- GateCheck. Terceira camada do modelo de direitos (§4.6).
--
-- Aditivo com uma exceção controlada: `plan_grants.engagement_id` existia desde
-- a Etapa 4 como referência solta, à espera desta tabela. Ganha FK agora, como
-- estava previsto. ON DELETE SET NULL (nunca CASCADE) — encerrar um contrato
-- não pode apagar o histórico de concessões que ele gerou.

-- §13.8 — a qual fase do método cada feature pertence. Só contratos de
-- modalidade PROJETO usam isto, para liberar apenas a fase contratada.
ALTER TABLE "features" ADD COLUMN "method_phase" INTEGER;

CREATE TYPE "EngagementModality" AS ENUM ('DIAGNOSTICO', 'PLANEJAMENTO', 'PROJETO', 'ACOMPANHAMENTO');

CREATE TYPE "EngagementTrack" AS ENUM ('ESSENCIAL', 'COMPLETO');

CREATE TYPE "EngagementStatus" AS ENUM ('ATIVO', 'CONCLUIDO', 'CANCELADO');

CREATE TYPE "GatePhaseStatus" AS ENUM ('EM_ANDAMENTO', 'AVANCO_PLENO', 'AVANCO_CONDICIONAL', 'RETORNO_ASSISTIDO');

CREATE TABLE "consulting_engagements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "modality" "EngagementModality" NOT NULL,
    "track" "EngagementTrack",
    "project_phase" INTEGER,
    "seat_type" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'ATIVO',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consulting_engagements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "method_phases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "engagement_id" UUID NOT NULL,
    "phase_number" INTEGER NOT NULL,
    "status" "GatePhaseStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "method_phases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gate_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phase_id" UUID NOT NULL,
    "criterion" TEXT NOT NULL,
    "result" "GatePhaseStatus" NOT NULL,
    "evidence" TEXT,
    "evaluated_by" UUID NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follow_up_due_at" TIMESTAMP(3),

    CONSTRAINT "gate_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consulting_engagements_workspace_id_status_idx" ON "consulting_engagements"("workspace_id", "status");

CREATE UNIQUE INDEX "method_phases_engagement_id_phase_number_key" ON "method_phases"("engagement_id", "phase_number");

CREATE INDEX "gate_checks_phase_id_idx" ON "gate_checks"("phase_id");

ALTER TABLE "consulting_engagements" ADD CONSTRAINT "consulting_engagements_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "method_phases" ADD CONSTRAINT "method_phases_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gate_checks" ADD CONSTRAINT "gate_checks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "method_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A referência solta da Etapa 4 vira FK de verdade. Linhas existentes têm
-- engagement_id NULL (nenhum contrato existia até agora), então a constraint
-- é satisfeita sem nenhuma limpeza prévia.
ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
