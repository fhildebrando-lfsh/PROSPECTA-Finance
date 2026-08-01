import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NatureLabelsTable } from "./NatureLabelsTable";

export default async function TiposPage() {
  const profile = await requireProfile();
  const isAdmin = profile.isPlatformAdmin;
  const natureLabels = await prisma.natureLabel.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        As 4 naturezas (Receita, Despesa, Investimento, Outro) são fixas — toda regra de cálculo do sistema depende
        delas. {isAdmin ? "Aqui você só troca como o rótulo aparece na tela." : "Só o administrador troca o rótulo exibido."}
      </p>
      <NatureLabelsTable natureLabels={natureLabels.map((n) => ({ code: n.code, labelPt: n.labelPt }))} isAdmin={isAdmin} />
    </div>
  );
}
