-- Etapa 2 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §5.6.
-- Captura periódica de "quanto a carteira realmente tem", alimenta o
-- componente de Conciliação do Índice de Consistência.

CREATE TABLE "balance_reconciliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "declared_balance" DECIMAL(14,2) NOT NULL,
    "system_balance" DECIMAL(14,2) NOT NULL,
    "checked_by" UUID NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_reconciliations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "balance_reconciliations_workspace_id_wallet_id_checked_at_idx" ON "balance_reconciliations"("workspace_id", "wallet_id", "checked_at");

ALTER TABLE "balance_reconciliations" ADD CONSTRAINT "balance_reconciliations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "balance_reconciliations" ADD CONSTRAINT "balance_reconciliations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
