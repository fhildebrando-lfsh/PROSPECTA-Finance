-- Etapa 9-A.1 (2026-08-16) — PROSPECTA-MCRF-1.0 §14/§19/§21.
-- Perfil de risco por pessoa e fontes de renda. Tudo aditivo: nenhuma coluna
-- nova é NOT NULL sem DEFAULT, e `people` continua funcionando sem nada disto
-- preenchido (é a mesma tabela de "responsável" desde a Fase 0).

CREATE TYPE "RegimeTrabalho" AS ENUM ('SERVIDOR_EFETIVO', 'MILITAR', 'EMPREGADO_PUBLICO', 'CLT', 'CARGO_COMISSIONADO', 'TEMPORARIO', 'PROFISSIONAL_LIBERAL', 'AUTONOMO', 'EMPRESARIO', 'MEI', 'INFORMAL', 'APOSENTADO', 'PENSIONISTA', 'DESEMPREGADO', 'OUTRO');

CREATE TYPE "SegundaAtividadeNivel" AS ENUM ('RENDA_SECUNDARIA_ATIVA', 'RENDA_SECUNDARIA_ADORMECIDA', 'CAPACIDADE_POTENCIAL', 'POSSIBILIDADE_TEORICA');

CREATE TYPE "IncomeSourceKind" AS ENUM ('SALARIO', 'PRO_LABORE', 'AUTONOMO', 'ALUGUEL', 'APOSENTADORIA', 'PENSAO', 'BENEFICIO', 'RENDA_PASSIVA', 'BICO', 'OUTRO');

ALTER TABLE "people" ADD COLUMN "regime_trabalho" "RegimeTrabalho";
ALTER TABLE "people" ADD COLUMN "occupation" TEXT;
ALTER TABLE "people" ADD COLUMN "cbo_code" TEXT;
ALTER TABLE "people" ADD COLUMN "cargo" TEXT;
ALTER TABLE "people" ADD COLUMN "setor" TEXT;
ALTER TABLE "people" ADD COLUMN "tenure_current_months" INTEGER;
ALTER TABLE "people" ADD COLUMN "experience_total_months" INTEGER;
ALTER TABLE "people" ADD COLUMN "segunda_atividade" TEXT;
ALTER TABLE "people" ADD COLUMN "segunda_atividade_nivel" "SegundaAtividadeNivel";
ALTER TABLE "people" ADD COLUMN "is_dependent" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "income_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "IncomeSourceKind" NOT NULL,
    "category_id" UUID,
    "employer_name" TEXT,
    "setor" TEXT,
    "depende_de_empregador" BOOLEAN,
    "depende_de_poucos_clientes" BOOLEAN,
    "is_principal" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "income_sources_workspace_id_person_id_idx" ON "income_sources"("workspace_id", "person_id");

ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
