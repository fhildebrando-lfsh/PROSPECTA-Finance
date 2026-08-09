-- Entry.importedDescription: descrição original da fatura em PDF, imutável pelo usuário
ALTER TABLE "entries" ADD COLUMN "imported_description" TEXT;

-- DescriptionRule: regra aprendida ao editar um lançamento importado de fatura, aplicada
-- em futuras importações de PDF com a mesma descrição original do banco.
CREATE TABLE "description_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "match_description" TEXT NOT NULL,
    "custom_description" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "description_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "description_rules_workspace_id_match_description_key" ON "description_rules"("workspace_id", "match_description");

ALTER TABLE "description_rules" ADD CONSTRAINT "description_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "description_rules" ADD CONSTRAINT "description_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "description_rules" ADD CONSTRAINT "description_rules_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
