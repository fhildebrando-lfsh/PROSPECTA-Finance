-- DropForeignKey
ALTER TABLE "entries" DROP CONSTRAINT "entries_asset_id_fkey";

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
