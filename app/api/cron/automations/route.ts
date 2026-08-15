import { NextResponse, type NextRequest } from "next/server";
import { runDueAutomations } from "@/lib/method/run-automations";

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

  const result = await runDueAutomations();
  return NextResponse.json(result);
}
