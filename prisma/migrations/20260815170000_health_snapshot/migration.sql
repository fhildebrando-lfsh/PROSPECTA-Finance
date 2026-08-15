-- Etapa 5 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §5.3.
-- Painel de Saúde Financeira: foto dos indicadores no tempo.

CREATE TABLE "health_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "indicators" JSONB NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'AUTO',
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_snapshots_workspace_id_snapshot_date_idx" ON "health_snapshots"("workspace_id", "snapshot_date");

ALTER TABLE "health_snapshots" ADD CONSTRAINT "health_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
