-- Etapa 4 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §3/5.2.
-- Camada 2 do modelo de direitos em três camadas (§4.6): elevação temporária
-- de nível, nunca escreve na Subscription do cliente.

CREATE TABLE "plan_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "engagement_id" UUID,
    "reason" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "plan_grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_grants_workspace_id_ends_at_idx" ON "plan_grants"("workspace_id", "ends_at");

ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
