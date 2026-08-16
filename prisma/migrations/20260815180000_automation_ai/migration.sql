-- Etapa 6 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §5.5.
-- Motor de automações (alerta via Notification, nunca execução) e histórico
-- de perguntas ao Assistente do Max.

CREATE TYPE "AutomationTrigger" AS ENUM ('LIMIAR_CATEGORIA', 'VENCIMENTO_PROXIMO', 'VARIACAO_RECORRENCIA', 'META_FORA_DA_TRAJETORIA', 'INCIDENTE_ACUMULADO');

CREATE TABLE "automation_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "condition" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "asked_by" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer_query" JSONB,
    "answer_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
