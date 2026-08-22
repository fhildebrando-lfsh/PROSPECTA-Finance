-- 2026-08-19 — features que SAO o produto, nao um adicional (Registro No 107).
--
-- Aditivo. Nenhuma feature e apagada: apagar quebraria os plan_features que as
-- referenciam e destruiria o historico do catalogo. O que muda e o significado
-- — elas saem da matriz de /admin/planos e passam a valer para todos.

ALTER TABLE "features" ADD COLUMN "always_included" BOOLEAN NOT NULL DEFAULT false;
