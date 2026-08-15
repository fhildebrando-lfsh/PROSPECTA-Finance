-- Etapa 0 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §3.2/5.7 e
-- AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md §4.5. Consultor (ADVISOR) deixa
-- de ter escrita automática; TITULAR concede/revoga explicitamente.
-- default false é mais restritivo que o comportamento anterior, de propósito.

ALTER TABLE "memberships" ADD COLUMN "advisor_can_write" BOOLEAN NOT NULL DEFAULT false;
