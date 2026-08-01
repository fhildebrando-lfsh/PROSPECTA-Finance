-- Arquitetura de Identidade/Planos, Fase 2 Etapa 1 — backfill de dados.
-- Roda depois da migration de schema (20260801205757). Garante que o(s)
-- workspace(s) real(is) de hoje nunca fiquem sem Subscription/feature
-- liberada quando o gate de plano entrar em uso nas próximas etapas
-- (backend/frontend) — nada aqui já bloqueia nada, é só preparação segura.
-- Toda instrução é idempotente (ON CONFLICT DO NOTHING / WHERE NOT EXISTS),
-- segura pra rodar mais de uma vez sem duplicar dado.

-- 1. Catálogo inicial de features — códigos vêm do roadmap comercial
--    descrito pelo usuário (planejamento, MEI, IRPF, sucessório, IA, Open
--    Finance, mobile). Cresce sem migration nova depois disso, é só INSERT.
INSERT INTO "features" ("id", "code", "name") VALUES
  (gen_random_uuid(), 'nucleo_financeiro', 'Núcleo financeiro (lançamentos, painel, cadastros)'),
  (gen_random_uuid(), 'relatorios_avancados', 'Relatórios avançados'),
  (gen_random_uuid(), 'planejamento_financeiro', 'Planejamento financeiro'),
  (gen_random_uuid(), 'consultoria_recorrente', 'Consultoria recorrente'),
  (gen_random_uuid(), 'modulo_mei', 'Módulo MEI'),
  (gen_random_uuid(), 'organizacao_tributaria', 'Organização tributária'),
  (gen_random_uuid(), 'preparacao_irpf', 'Preparação para IRPF'),
  (gen_random_uuid(), 'planejamento_sucessorio', 'Planejamento sucessório'),
  (gen_random_uuid(), 'ia_assistente', 'IA'),
  (gen_random_uuid(), 'open_finance', 'Open Finance'),
  (gen_random_uuid(), 'app_mobile', 'Aplicativo mobile')
ON CONFLICT ("code") DO NOTHING;

-- 2. Plano de backfill — todas as features liberadas, sem cobrança externa.
--    Não é um plano comercial de verdade (nunca deve aparecer numa tela de
--    preços) — existe só pra nenhum workspace ficar "sem plano" quando o
--    gate de feature entrar em uso.
INSERT INTO "plans" ("id", "code", "name", "price_cents", "billing_interval", "is_active")
VALUES (gen_random_uuid(), 'LEGACY_INTERNAL', 'Legado (uso interno, todas as features)', 0, 'MONTHLY', true)
ON CONFLICT ("code") DO NOTHING;

-- 3. Liga o plano de backfill a todas as features existentes no catálogo.
INSERT INTO "plan_features" ("plan_id", "feature_id")
SELECT p.id, f.id
FROM "plans" p, "features" f
WHERE p.code = 'LEGACY_INTERNAL'
ON CONFLICT DO NOTHING;

-- 4. Toda workspace que ainda não tem nenhuma Subscription ganha uma no
--    plano de backfill — cobre o(s) workspace(s) real(is) de hoje, e
--    qualquer workspace criado entre a Fase 1 e esta migration.
INSERT INTO "subscriptions" ("id", "workspace_id", "plan_id", "status", "payment_provider", "created_at")
SELECT gen_random_uuid(), w.id, p.id, 'ACTIVE', 'NONE', now()
FROM "workspaces" w
CROSS JOIN (SELECT id FROM "plans" WHERE code = 'LEGACY_INTERNAL') p
WHERE NOT EXISTS (
  SELECT 1 FROM "subscriptions" s WHERE s.workspace_id = w.id
);

-- 5. Sincroniza platform_role a partir do booleano legado — a nova coluna
--    passa a refletir exatamente quem já é admin hoje, sem exigir ação
--    manual nenhuma. Nunca reduz (não zera quem já é PLATFORM_ADMIN), só
--    promove quem o campo legado já marcava como admin.
UPDATE "profiles" SET "platform_role" = 'PLATFORM_ADMIN' WHERE "is_platform_admin" = true;
