import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NewInvestmentForm } from "./NewInvestmentForm";

export default async function NovoInvestimentoPage() {
  const workspaceId = await requireWorkspaceId();

  const [classes, wallets, people] = await Promise.all([
    prisma.investmentClass.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.wallet.findMany({ where: { workspaceId, kindCode: "CONTA_INVESTIMENTO" }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/investimentos" className="text-sm text-indigo-300 hover:text-white">
          ← Carteira
        </Link>
      </div>

      <NewInvestmentForm
        classes={classes.map((c) => ({ code: c.code, labelPt: c.labelPt, groupLabel: c.groupLabel }))}
        wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
