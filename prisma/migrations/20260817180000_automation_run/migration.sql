-- CreateTable
CREATE TABLE "automation_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "workspaces_evaluated" INTEGER NOT NULL DEFAULT 0,
    "rules_evaluated" INTEGER NOT NULL DEFAULT 0,
    "notified" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CRON',

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_runs_started_at_idx" ON "automation_runs"("started_at");
