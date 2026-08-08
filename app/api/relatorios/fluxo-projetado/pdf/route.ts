import { type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry, toFinanceWallet } from "@/lib/finance/from-db";
import { projectedBalance } from "@/lib/finance/period";
import { type Regime } from "@/lib/finance/types";
import { buildFluxoProjetadoPdf, type FluxoProjetadoPdfPoint } from "@/lib/reports/pdf/fluxo-projetado";
import { pdfResponse } from "@/lib/reports/pdf-response";

const MONTH_OPTIONS = [6, 12, 24] as const;

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const regime: Regime = searchParams.get("regime") === "competencia" ? "competencia" : "caixa";
    const monthsAhead = MONTH_OPTIONS.includes(Number(searchParams.get("months")) as (typeof MONTH_OPTIONS)[number])
      ? Number(searchParams.get("months"))
      : 12;

    const [wallets, dbEntries] = await Promise.all([
      prisma.wallet.findMany({ where: { workspaceId }, include: { kind: true } }),
      prisma.entry.findMany({ where: { workspaceId } }),
    ]);
    const entries = dbEntries.map(toFinanceEntry);
    const financeWallets = wallets.map(toFinanceWallet);

    const { current, points } = projectedBalance(entries, financeWallets, today, monthsAhead, regime);
    const pdfPoints: FluxoProjetadoPdfPoint[] = points.map((p) => ({
      monthIndex0: p.period.start.getUTCMonth(),
      year: p.period.start.getUTCFullYear(),
      balance: p.balance,
    }));

    const regimeLabel = regime === "caixa" ? "caixa (Vence)" : "competência (Compra)";
    const pdf = await buildFluxoProjetadoPdf(current, pdfPoints, regimeLabel, monthsAhead);
    return pdfResponse(pdf, "fluxo-projetado");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
