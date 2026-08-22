-- Etapa 11 (2026-08-18) — Debt / Mapa de Endividamento e Credito (§10 Fase 3).
-- Tabela nova, aditivo. NAO substitui "Despesas parceladas": aquela continua
-- lendo Entry normalmente. Esta e a camada de gestao de credito por cima —
-- credor, CET, negativacao —, opcionalmente ligada ao parcelamento.

CREATE TYPE "DebtStatus" AS ENUM ('EM_DIA', 'NEGATIVADO', 'RENEGOCIADO', 'QUITADO');

CREATE TABLE "debts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "entry_group_id" UUID,
    "creditor_name" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "outstanding_balance" DECIMAL(14,2) NOT NULL,
    "cet_annual_percent" DECIMAL(6,2),
    "has_negativacao" BOOLEAN NOT NULL DEFAULT false,
    "has_legal_action" BOOLEAN NOT NULL DEFAULT false,
    "status" "DebtStatus" NOT NULL DEFAULT 'EM_DIA',
    "quitation_target_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "debts_workspace_id_status_idx" ON "debts"("workspace_id", "status");

ALTER TABLE "debts" ADD CONSTRAINT "debts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SET NULL, nao CASCADE: apagar o parcelamento nao pode apagar o registro de
-- credito — a divida continua existindo no mundo mesmo sem as parcelas.
ALTER TABLE "debts" ADD CONSTRAINT "debts_entry_group_id_fkey" FOREIGN KEY ("entry_group_id") REFERENCES "entry_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
