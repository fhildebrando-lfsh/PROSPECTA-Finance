-- Etapa 9-A.3 (2026-08-16) — PROSPECTA-MCRF-1.0 §11.1–11.3 e §52.
-- Rigidez da despesa (separa CEMA de CCM) e parâmetros da metodologia, globais
-- e editáveis só pelo admin da plataforma. Aditivo: coluna nova nullable e
-- tabela nova.

CREATE TYPE "Rigidez" AS ENUM ('RIGIDA', 'AJUSTAVEL', 'DISCRICIONARIA');

ALTER TABLE "subcategories" ADD COLUMN "rigidez" "Rigidez";

CREATE TABLE "methodology_parameters" (
    "key" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "methodology_parameters_pkey" PRIMARY KEY ("key")
);
