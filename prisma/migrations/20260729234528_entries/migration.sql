-- CreateTable
CREATE TABLE "entry_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "workspace_id" UUID NOT NULL,
    "group_id" UUID,
    "transaction_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "settled_at" DATE,
    "wallet_id" UUID NOT NULL,
    "nature" "EntryNature" NOT NULL,
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID,
    "description" TEXT NOT NULL,
    "responsible_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "recurrence_code" TEXT NOT NULL,
    "installment_number" INTEGER,
    "installment_total" INTEGER,
    "is_patrimonio" BOOLEAN NOT NULL DEFAULT false,
    "is_projecao" BOOLEAN NOT NULL DEFAULT false,
    "legacy_recurrence_label" TEXT,
    "status_code" TEXT NOT NULL,
    "note" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_fixed_override" BOOLEAN,
    "transfer_id" UUID,
    "import_batch_id" UUID,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "original_filename" TEXT NOT NULL,
    "imported_count" INTEGER NOT NULL,
    "error_count" INTEGER NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reverted_at" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entries_workspace_id_due_date_idx" ON "entries"("workspace_id", "due_date");

-- CreateIndex
CREATE INDEX "entries_workspace_id_wallet_id_idx" ON "entries"("workspace_id", "wallet_id");

-- CreateIndex
CREATE INDEX "entries_group_id_idx" ON "entries"("group_id");

-- CreateIndex
CREATE INDEX "entries_transfer_id_idx" ON "entries"("transfer_id");

-- AddForeignKey
ALTER TABLE "entry_groups" ADD CONSTRAINT "entry_groups_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "entry_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_recurrence_code_fkey" FOREIGN KEY ("recurrence_code") REFERENCES "recurrence_kinds"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_status_code_fkey" FOREIGN KEY ("status_code") REFERENCES "statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
