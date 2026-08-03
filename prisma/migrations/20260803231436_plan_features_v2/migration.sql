-- Arquitetura de Identidade/Planos — ajuste do CEO em 2026-08-03:
--   - Open Finance sai de Start/Plus, passa a ser feature de Premium
--     (e sobe por herança pra Premium Negócios, que já a tinha).
--   - Relatórios avançados entra no Plus (nova, sobe por herança).
--   - Organização tributária entra no Premium (nova, sobe por herança).
--   - Planejamento sucessório confirmado como já estava, no Premium.
--
-- Matriz final (escada estrita):
--   START            = nucleo_financeiro, app_mobile
--   PLUS             = START + planejamento_financeiro, ia_assistente, relatorios_avancados
--   PREMIUM          = PLUS + consultoria_recorrente, preparacao_irpf,
--                       planejamento_sucessorio, open_finance, organizacao_tributaria
--   PREMIUM_NEGOCIOS = PREMIUM + modulo_mei, preparacao_irpj
--
-- Com este ajuste, todas as 12 features do catálogo passam a estar
-- vinculadas a pelo menos um plano — nenhuma fica mais órfã.

-- Remove Open Finance de Start e Plus (sobe de nível pro Premium).
DELETE FROM "plan_features"
WHERE "feature_id" = (SELECT id FROM "features" WHERE code = 'open_finance')
  AND "plan_id" IN (SELECT id FROM "plans" WHERE code IN ('START', 'PLUS'));

-- Plus ganha Relatórios avançados.
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PLUS' AND f.code = 'relatorios_avancados'
ON CONFLICT DO NOTHING;

-- Premium ganha Open Finance (nível certo agora), Organização tributária e
-- Relatórios avançados (herdado do Plus).
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM' AND f.code IN ('open_finance', 'organizacao_tributaria', 'relatorios_avancados')
ON CONFLICT DO NOTHING;

-- Premium Negócios herda tudo isso do Premium (Open Finance já tinha, ganha
-- Organização tributária e Relatórios avançados agora).
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM_NEGOCIOS' AND f.code IN ('open_finance', 'organizacao_tributaria', 'relatorios_avancados')
ON CONFLICT DO NOTHING;
