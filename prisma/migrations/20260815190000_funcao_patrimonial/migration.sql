-- Etapa 7 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §5.1/13.4.
-- Eixo de estoque: para que serve cada peça do patrimônio. Sempre opcional —
-- nenhum bem/carteira/investimento existente muda de estado.

CREATE TYPE "FuncaoPatrimonial" AS ENUM ('PROTECAO', 'LIQUIDEZ_OPERACIONAL', 'OBJETIVOS', 'LONGEVIDADE', 'CRESCIMENTO', 'USO', 'SUCESSAO');

ALTER TABLE "wallets" ADD COLUMN "funcao_patrimonial" "FuncaoPatrimonial";

ALTER TABLE "assets" ADD COLUMN "funcao_patrimonial" "FuncaoPatrimonial";

ALTER TABLE "investments" ADD COLUMN "funcao_patrimonial" "FuncaoPatrimonial";
