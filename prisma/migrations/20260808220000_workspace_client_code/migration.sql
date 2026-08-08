-- AlterTable: add clientCode as nullable first, so existing rows can be backfilled
-- in creation order before the NOT NULL + UNIQUE constraints are applied.
ALTER TABLE "workspaces" ADD COLUMN "client_code" INTEGER;

-- Backfill: assign sequential codes to existing workspaces in creation order
-- (oldest = 1), so the code reflects real registration order.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM "workspaces"
)
UPDATE "workspaces" w SET client_code = ordered.rn
FROM ordered
WHERE w.id = ordered.id;

ALTER TABLE "workspaces" ALTER COLUMN "client_code" SET NOT NULL;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_client_code_key" UNIQUE ("client_code");

-- Sequence for future rows (including the ones created by the
-- on_auth_user_created trigger, which inserts only `name` and relies on
-- column defaults for everything else), continuing right after the highest
-- backfilled value.
CREATE SEQUENCE IF NOT EXISTS "workspaces_client_code_seq" OWNED BY "workspaces"."client_code";
SELECT setval('workspaces_client_code_seq', COALESCE((SELECT MAX(client_code) FROM "workspaces"), 0));
ALTER TABLE "workspaces" ALTER COLUMN "client_code" SET DEFAULT nextval('workspaces_client_code_seq');
