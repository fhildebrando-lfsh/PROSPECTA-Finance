import { activeEngagement } from "@/lib/billing/engagement";

const MODALIDADE_LABELS: Record<string, string> = {
  DIAGNOSTICO: "Diagnóstico",
  PLANEJAMENTO: "Planejamento",
  PROJETO: "Projeto",
  ACOMPANHAMENTO: "Acompanhamento",
};

/**
 * Aviso das telas da camada de método quando o gate nega.
 *
 * Existe porque a mensagem antiga **mentia por omissão**: as três telas diziam
 * "existe quando há uma consultoria ativa" mesmo quando havia uma — o que
 * faltava era a *fase*, num contrato de Projeto. Em 2026-08-17 o usuário abriu
 * contratos de Projeto e viu as três telas negarem, sem nenhuma pista de que o
 * problema era escopo e não ausência de contrato.
 *
 * Diagnóstico ruim é pior que erro: manda procurar no lugar errado.
 */
export async function GateAviso({
  workspaceId,
  titulo,
  explicacao,
}: {
  workspaceId: string;
  titulo: string;
  explicacao: string;
}) {
  const engagement = await activeEngagement(workspaceId);

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
      {engagement ? (
        <>
          <p className="text-zinc-200">
            Esta tela não faz parte do escopo da consultoria contratada.
          </p>
          <p className="mt-2">
            O contrato ativo é um <strong className="text-zinc-300">
              {MODALIDADE_LABELS[engagement.modality] ?? engagement.modality}
            </strong>
            {engagement.projectPhase !== null && (
              <> da <strong className="text-zinc-300">Fase {engagement.projectPhase}</strong></>
            )}
            , e um contrato de projeto cobre a fase que foi contratada, não a trilha inteira. Para abrir toda a
            camada de método, o contrato precisa ser de Diagnóstico, Planejamento ou Acompanhamento.
          </p>
        </>
      ) : (
        <>
          <p className="text-zinc-200">{titulo}</p>
          <p className="mt-2">{explicacao}</p>
        </>
      )}
    </div>
  );
}
