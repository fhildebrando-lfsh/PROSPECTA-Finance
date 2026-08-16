"use client";

import { useTransition } from "react";
import { saveAssessment } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

/** Nenhum import de @/lib/format — ele carrega Decimal pro bundle do client. */
export function SaveAssessmentButton() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => saveAssessment())}
      className={`${BTN_SECONDARY} disabled:opacity-40`}
    >
      {pending ? "Salvando…" : "Salvar no histórico"}
    </button>
  );
}
