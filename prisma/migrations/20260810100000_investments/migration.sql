-- InvestmentClass: classe de investimento, referência extensível (nunca enum)
CREATE TABLE "investment_classes" (
    "code" TEXT NOT NULL,
    "labelPt" TEXT NOT NULL,
    "group_label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "investment_classes_pkey" PRIMARY KEY ("code")
);

-- Investment: posição individual de investimento
CREATE TABLE "investments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "class_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "investments" ADD CONSTRAINT "investments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "investments" ADD CONSTRAINT "investments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "investments" ADD CONSTRAINT "investments_class_code_fkey" FOREIGN KEY ("class_code") REFERENCES "investment_classes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Entry.investmentId: liga um lançamento a uma posição de investimento (sem cascade)
ALTER TABLE "entries" ADD COLUMN "investment_id" UUID;
ALTER TABLE "entries" ADD CONSTRAINT "entries_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "entries_investment_id_idx" ON "entries"("investment_id");
