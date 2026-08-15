-- Etapa 1 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §5.1.
-- macro_bloco (Régua de Alocação, §11.2/§13.3) + ownerPersonId (titularidade
-- econômica, preparação para Open Finance e Plano Família,
-- AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md §4.3). 100% aditivo — nenhuma
-- coluna/tabela existente muda.

-- CreateEnum
CREATE TYPE "MacroBloco" AS ENUM ('ESSENCIAL', 'ESTILO_DE_VIDA', 'OBRIGACAO', 'POUPANCA');

-- AlterTable: Régua de Alocação
ALTER TABLE "subcategories" ADD COLUMN "macro_bloco" "MacroBloco";
ALTER TABLE "entries" ADD COLUMN "macro_bloco_override" "MacroBloco";

-- AlterTable: titularidade (Wallet/Investment/Asset -> Person)
ALTER TABLE "wallets" ADD COLUMN "owner_person_id" UUID;
ALTER TABLE "investments" ADD COLUMN "owner_person_id" UUID;
ALTER TABLE "assets" ADD COLUMN "owner_person_id" UUID;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_owner_person_id_fkey" FOREIGN KEY ("owner_person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "investments" ADD CONSTRAINT "investments_owner_person_id_fkey" FOREIGN KEY ("owner_person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_person_id_fkey" FOREIGN KEY ("owner_person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
