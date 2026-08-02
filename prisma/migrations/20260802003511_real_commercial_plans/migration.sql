-- Arquitetura de Identidade/Planos, Fase 2 — catálogo de planos comerciais
-- de verdade (Start/Plus/Premium/Premium Negócios), definidos pelo CEO em
-- 2026-08-02. Só dado (as tabelas Plan/Feature/PlanFeature já existem desde
-- a Etapa 1) — nenhum Subscription aponta pra eles ainda (nenhum cliente
-- real assinou), então isso não afeta nenhum workspace existente.
--
-- Hierarquia confirmada (escada estrita — cada plano inclui tudo do
-- anterior):
--   START            = nucleo_financeiro
--   PLUS             = START + planejamento_financeiro
--   PREMIUM          = PLUS + consultoria_recorrente
--   PREMIUM_NEGOCIOS = PREMIUM + modulo_mei
--
-- Preço e periodicidade são placeholder (0 / MONTHLY) — o CEO ainda não
-- definiu valores reais; ajustar via UPDATE quando definidos, não exige
-- nova migration (são só colunas de dado).
--
-- Features do roadmap mais amplo (relatorios_avancados,
-- organizacao_tributaria, preparacao_irpf, planejamento_sucessorio,
-- ia_assistente, open_finance, app_mobile) ficam de propósito SEM vínculo
-- com nenhum plano ainda — não foram mencionadas nos 4 planos reais, então
-- não devem ser assumidas como incluídas em nenhum. Linkar quando o CEO
-- decidir onde cada uma entra.

INSERT INTO "plans" ("id", "code", "name", "price_cents", "billing_interval", "is_active") VALUES
  (gen_random_uuid(), 'START', 'Start', 0, 'MONTHLY', true),
  (gen_random_uuid(), 'PLUS', 'Plus', 0, 'MONTHLY', true),
  (gen_random_uuid(), 'PREMIUM', 'Premium', 0, 'MONTHLY', true),
  (gen_random_uuid(), 'PREMIUM_NEGOCIOS', 'Premium Negócios', 0, 'MONTHLY', true)
ON CONFLICT ("code") DO NOTHING;

-- START: núcleo financeiro
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'START' AND f.code IN ('nucleo_financeiro')
ON CONFLICT DO NOTHING;

-- PLUS: START + planejamento financeiro
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PLUS' AND f.code IN ('nucleo_financeiro', 'planejamento_financeiro')
ON CONFLICT DO NOTHING;

-- PREMIUM: PLUS + consultoria recorrente
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM' AND f.code IN ('nucleo_financeiro', 'planejamento_financeiro', 'consultoria_recorrente')
ON CONFLICT DO NOTHING;

-- PREMIUM_NEGOCIOS: PREMIUM + módulo MEI
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM_NEGOCIOS'
  AND f.code IN ('nucleo_financeiro', 'planejamento_financeiro', 'consultoria_recorrente', 'modulo_mei')
ON CONFLICT DO NOTHING;
