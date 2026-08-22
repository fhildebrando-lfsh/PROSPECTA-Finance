-- Etapa 10-B (2026-08-17) — envio automático dos instrumentos e lembretes de
-- prazo (§12.4/§12.8). Tabela nova, aditivo.
--
-- O UNIQUE (engagement_id, instrument) e a garantia estrutural de que ninguem
-- recebe o mesmo instrumento duas vezes: rotina automatica que manda e-mail
-- precisa que o "so uma vez" nao dependa do cuidado de quem chama.

CREATE TABLE "instrument_dispatches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "engagement_id" UUID NOT NULL,
    "instrument" "DiagnosticInstrument" NOT NULL,
    "dispatched_at" TIMESTAMP(3) NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "reminders_sent" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "instrument_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "instrument_dispatches_engagement_id_instrument_key" ON "instrument_dispatches"("engagement_id", "instrument");

ALTER TABLE "instrument_dispatches" ADD CONSTRAINT "instrument_dispatches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "instrument_dispatches" ADD CONSTRAINT "instrument_dispatches_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "consulting_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
