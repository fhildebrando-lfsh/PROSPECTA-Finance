"use client";

import { useState, useTransition } from "react";
import { executarAutomacoesAgora } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

/** Nenhum import de @/lib/format — ele carrega Decimal pro bundle do client. */
export function ExecutarAgoraButton() {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErro(null);
            try {
              await executarAutomacoesAgora();
            } catch (e) {
              // A falha aparece aqui **e** fica gravada no rastro — a tela não
              // é a fonte da verdade, é só o aviso imediato.
              setErro(e instanceof Error ? e.message : "Falhou ao executar.");
            }
          })
        }
        className={`${BTN_SECONDARY} disabled:opacity-40`}
      >
        {pending ? "Executando…" : "Executar agora"}
      </button>
      {erro && <p className="text-xs text-red-300">{erro}</p>}
    </div>
  );
}
