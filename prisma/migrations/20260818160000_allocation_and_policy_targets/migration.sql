-- Etapa 14 (2026-08-18) — dois modelos, nao um. Tabelas novas, aditivo.
--
-- O roadmap tratava "AllocationTarget com faixa-alvo por classe (PIP)" como um
-- modelo so, mas sao eixos diferentes: AllocationTarget e PARA ONDE VAI A RENDA
-- (macrobloco, §11.4); InvestmentPolicyTarget e COMO O JA POUPADO ESTA
-- DISTRIBUIDO entre classes (PIP, §12.1). E o PIP precisa de FAIXA (min/max),
-- que o AllocationTarget especificado nao tem.

CREATE TABLE "allocation_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "macro_bloco" "MacroBloco" NOT NULL,
    "target_percent" DECIMAL(5,2) NOT NULL,
    "horizon_months" INTEGER,
    "set_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_targets_pkey" PRIMARY KEY ("id")
);

-- Uma meta por macrobloco por horizonte. NULL conta como valor distinto no
-- Postgres, entao o alvo sem prazo nao colide com os de trajetoria.
CREATE UNIQUE INDEX "allocation_targets_workspace_id_macro_bloco_horizon_months_key" ON "allocation_targets"("workspace_id", "macro_bloco", "horizon_months");

ALTER TABLE "allocation_targets" ADD CONSTRAINT "allocation_targets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "investment_policy_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "class_code" TEXT NOT NULL,
    "min_percent" DECIMAL(5,2) NOT NULL,
    "max_percent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "set_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_policy_targets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investment_policy_targets_workspace_id_class_code_key" ON "investment_policy_targets"("workspace_id", "class_code");

ALTER TABLE "investment_policy_targets" ADD CONSTRAINT "investment_policy_targets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_policy_targets" ADD CONSTRAINT "investment_policy_targets_class_code_fkey" FOREIGN KEY ("class_code") REFERENCES "investment_classes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
