-- ShockEvent (2026-08-17) — PROSPECTA-MCRF §13, §45 e §46.
-- Registro de choques financeiros que de fato aconteceram, protocolo de
-- recomposição da reserva e aprendizado com eventos reais. Tabela nova, aditivo.

CREATE TYPE "ShockKind" AS ENUM ('PERDA_DE_RENDA', 'REDUCAO_DE_RENDA', 'DESPESA_INESPERADA', 'INCAPACIDADE', 'EMERGENCIA_FAMILIAR', 'REPARO_ESSENCIAL', 'OUTRO');

CREATE TABLE "shock_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "person_id" UUID,
    "kind" "ShockKind" NOT NULL,
    "description" TEXT NOT NULL,
    "occurred_at" DATE NOT NULL,
    "extraordinary_expense" DECIMAL(14,2),
    "income_loss_monthly" DECIMAL(14,2),
    "duration_months" INTEGER,
    "had_insurance" BOOLEAN,
    "reimbursed_amount" DECIMAL(14,2),
    "paid_by_user_amount" DECIMAL(14,2),
    "days_until_reimbursement" INTEGER,
    "reserve_used_amount" DECIMAL(14,2),
    "recomposed_at" DATE,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shock_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shock_events_workspace_id_occurred_at_idx" ON "shock_events"("workspace_id", "occurred_at");

ALTER TABLE "shock_events" ADD CONSTRAINT "shock_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shock_events" ADD CONSTRAINT "shock_events_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
