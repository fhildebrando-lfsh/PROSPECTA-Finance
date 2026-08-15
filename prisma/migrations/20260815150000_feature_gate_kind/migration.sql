-- Etapa 3 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §3.1/5.2.
-- Admin decide, por feature, se ela é liberada por nível de plano (padrão)
-- ou por camada de método (ConsultingEngagement, ainda não implementado).

CREATE TYPE "FeatureGateKind" AS ENUM ('PLANO', 'METODO');

ALTER TABLE "features" ADD COLUMN "gate_kind" "FeatureGateKind" NOT NULL DEFAULT 'PLANO';
