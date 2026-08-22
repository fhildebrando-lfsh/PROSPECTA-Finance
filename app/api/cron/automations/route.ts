import { NextResponse, type NextRequest } from "next/server";
import { runDueAutomations } from "@/lib/method/run-automations";
import { runInstrumentDispatches } from "@/lib/method/instruments/run-dispatches";

export const dynamic = "force-dynamic";

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5.1, Etapa 6 — Vercel Cron, 1x/dia
 * (`vercel.json`). Protegida pelo header padrão que a própria Vercel envia
 * (`Authorization: Bearer ${CRON_SECRET}`) — nunca um endpoint aberto. Lógica
 * real fica em `lib/method/run-automations.ts` (testável direto, sem precisar
 * simular um NextRequest); esta rota só autentica e chama.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Duas rotinas na mesma execução diária. O envio dos instrumentos (Etapa
  // 10-B) roda **depois** das automações e é independente: se ele falhar, os
  // alertas do dia já foram gravados. Nasce inerte — só age com o interruptor
  // `instrumentos.envio_automatico_ativo` ligado em /admin/metodologia.
  const automacoes = await runDueAutomations();
  const instrumentos = await runInstrumentDispatches();
  return NextResponse.json({ automacoes, instrumentos });
}
