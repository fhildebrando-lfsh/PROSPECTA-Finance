-- Dados pessoais no Profile (2026-08-06/07) — todos opcionais, aditivo,
-- não toca nenhuma tabela/coluna existente. Editável em /minha-conta (a
-- própria pessoa) e /admin/usuarios/:id (admin em nome de qualquer um).

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "address_cep" TEXT,
ADD COLUMN     "address_city" TEXT,
ADD COLUMN     "address_complement" TEXT,
ADD COLUMN     "address_neighborhood" TEXT,
ADD COLUMN     "address_number" TEXT,
ADD COLUMN     "address_state" TEXT,
ADD COLUMN     "address_street" TEXT,
ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "phone" TEXT;
