import Link from "next/link";
import { requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TransferForm } from "./TransferForm";

export default async function TransferirPage() {
  const workspaceId = await requireWorkspaceId();
  await requireProfile();

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [wallets, people, category, lastResponsibleEntry] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.category.findUnique({ where: { nature_slug: { nature: "OUTRO", slug: "transferencias" } } }),
    prisma.entry.findFirst({
      where: { workspaceId, createdAt: { gte: since24h } },
      orderBy: { createdAt: "desc" },
      select: { responsibleId: true },
    }),
  ]);

  const subcategories = category
    ? await prisma.subcategory.findMany({
        where: { categoryId: category.id, workspaceId: null },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-lg font-semibold text-zinc-100">Transferir entre carteiras</h1>
      <p className="text-center text-sm text-zinc-500">
        Move dinheiro entre carteiras registrando as duas pontas (saída e entrada) de uma vez.
      </p>
      {(wallets.length === 0 || people.length === 0) && (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-2 rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100">
          {wallets.length === 0 && (
            <p>
              Nenhuma carteira cadastrada ainda.{" "}
              <Link href="/cadastros/carteiras" className="font-medium underline hover:text-white">
                Cadastrar carteira
              </Link>
            </p>
          )}
          {people.length === 0 && (
            <p>
              Nenhum responsável cadastrado ainda.{" "}
              <Link href="/cadastros/responsaveis" className="font-medium underline hover:text-white">
                Cadastrar responsável
              </Link>
            </p>
          )}
        </div>
      )}
      <TransferForm
        wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        subcategories={subcategories.map((s) => ({ id: s.id, name: s.name }))}
        defaultResponsibleId={lastResponsibleEntry?.responsibleId ?? people[0]?.id ?? ""}
        todayIso={today.toISOString().slice(0, 10)}
      />
    </div>
  );
}
