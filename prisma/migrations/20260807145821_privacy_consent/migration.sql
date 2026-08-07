-- LGPD (2026-08-07) — registro de quando a pessoa aceitou a Política de
-- Privacidade no cadastro. Nullable: contas existentes ficam sem valor
-- (nunca inventamos consentimento retroativo); só cadastros novos gravam.

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "privacy_policy_accepted_at" TIMESTAMP(3);
