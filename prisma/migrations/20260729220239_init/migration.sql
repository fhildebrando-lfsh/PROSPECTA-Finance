-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('TITULAR', 'MEMBRO', 'LEITURA');

-- CreateEnum
CREATE TYPE "EntryNature" AS ENUM ('RECEITA', 'DESPESA', 'INVESTIMENTO', 'OUTRO');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nature" "EntryNature" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "workspace_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_kinds" (
    "code" TEXT NOT NULL,
    "label_pt" TEXT NOT NULL,
    "affects_net_worth" BOOLEAN NOT NULL,
    "is_liability" BOOLEAN NOT NULL,

    CONSTRAINT "wallet_kinds_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind_code" TEXT NOT NULL,
    "institution_id" UUID,
    "is_pseudo_wallet" BOOLEAN NOT NULL DEFAULT false,
    "legacy_name" TEXT,
    "slug" TEXT NOT NULL,
    "linked_wallet_id" UUID,
    "goal_purpose" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "credit_limit" DECIMAL(14,2),
    "closing_day" INTEGER,
    "due_day" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "code" TEXT NOT NULL,
    "label_pt" TEXT NOT NULL,
    "counts_as_settled" BOOLEAN NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "recurrence_kinds" (
    "code" TEXT NOT NULL,
    "legacy_label" TEXT,
    "interval_months" INTEGER NOT NULL,

    CONSTRAINT "recurrence_kinds_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_workspace_id_profile_id_key" ON "memberships"("workspace_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nature_slug_key" ON "categories"("nature", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_workspace_id_slug_key" ON "subcategories"("category_id", "workspace_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_name_key" ON "institutions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_workspace_id_slug_key" ON "wallets"("workspace_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "people_workspace_id_slug_key" ON "people"("workspace_id", "slug");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_kind_code_fkey" FOREIGN KEY ("kind_code") REFERENCES "wallet_kinds"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_linked_wallet_id_fkey" FOREIGN KEY ("linked_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
