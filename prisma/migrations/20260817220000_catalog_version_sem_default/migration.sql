-- Etapa 10 (2026-08-17) — remove o DEFAULT de diagnostic_responses.catalog_version.
-- O padrão no banco era uma segunda cópia de CATALOG_VERSION e divergiu na
-- primeira mudança de redação (v1 -> v2). Default desatualizado rotularia a
-- resposta com a redação errada, que é pior que não ter o campo. A coluna segue
-- NOT NULL: quem grava declara a versão.

ALTER TABLE "diagnostic_responses" ALTER COLUMN "catalog_version" DROP DEFAULT;
