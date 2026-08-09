-- AlterTable
ALTER TABLE "entries" ADD COLUMN     "google_event_id" TEXT;

-- CreateTable
CREATE TABLE "google_calendar_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "google_account_email" TEXT NOT NULL,
    "google_calendar_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3) NOT NULL,
    "connected_by_profile_id" UUID NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_connections_workspace_id_key" ON "google_calendar_connections"("workspace_id");

-- AddForeignKey
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_connected_by_profile_id_fkey" FOREIGN KEY ("connected_by_profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
