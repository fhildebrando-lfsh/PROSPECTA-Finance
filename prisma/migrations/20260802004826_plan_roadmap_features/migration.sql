-- Arquitetura de Identidade/Planos — mapeamento do CEO (2026-08-02) das
-- features do roadmap mais amplo pros 4 planos reais. Só dado (tabelas já
-- existem) + 1 Feature nova (`preparacao_irpj`, IRPJ é distinto de IRPF —
-- pessoa jurídica vs. pessoa física). Escada estrita, cada plano ganha o
-- que já tinha (migration 20260802003511) mais o que segue:
--
--   START            + open_finance, app_mobile
--   PLUS             + ia_assistente               (herda o que Start ganhou)
--   PREMIUM          + preparacao_irpf, planejamento_sucessorio
--   PREMIUM_NEGOCIOS + preparacao_irpj
--
-- `organizacao_tributaria` e `relatorios_avancados` continuam de propósito
-- sem vínculo com nenhum plano — não foram mencionadas neste mapeamento
-- também.

INSERT INTO "features" ("id", "code", "name") VALUES
  (gen_random_uuid(), 'preparacao_irpj', 'Preparação para IRPJ')
ON CONFLICT ("code") DO NOTHING;

-- START ganha Open Finance + App mobile
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'START' AND f.code IN ('open_finance', 'app_mobile')
ON CONFLICT DO NOTHING;

-- PLUS herda Open Finance + App mobile (do Start) e ganha IA
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PLUS' AND f.code IN ('open_finance', 'app_mobile', 'ia_assistente')
ON CONFLICT DO NOTHING;

-- PREMIUM herda tudo do PLUS e ganha IRPF + Planejamento sucessório
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM' AND f.code IN ('open_finance', 'app_mobile', 'ia_assistente', 'preparacao_irpf', 'planejamento_sucessorio')
ON CONFLICT DO NOTHING;

-- PREMIUM_NEGOCIOS herda tudo do PREMIUM e ganha IRPJ
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id FROM "plans" p, "features" f
WHERE p.code = 'PREMIUM_NEGOCIOS'
  AND f.code IN ('open_finance', 'app_mobile', 'ia_assistente', 'preparacao_irpf', 'planejamento_sucessorio', 'preparacao_irpj')
ON CONFLICT DO NOTHING;
