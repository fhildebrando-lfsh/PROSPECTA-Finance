import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { GateAviso } from "@/components/method/GateAviso";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatDateBR } from "@/lib/format";
import {
  DELIVERABLES,
  DELIVERABLE_CODES,
  checkCompleteness,
  type DeliverableContent,
} from "@/lib/method/deliverables/catalog";
import { DeliverableCard, NovoEntregavelForm, type DeliverableView } from "./DeliverableEditor";

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "rascunho",
  VALIDADO: "validado",
  ASSINADO: "assinado",
};

/**
 * Etapa 9 (§12.1) — os artefatos codificados do método.
 *
 * Gateada por `entregaveis`, feature de `gateKind = METODO`: só existe com
 * contrato de consultoria ativo. O cliente **vê** e baixa os entregáveis; só o
 * consultor responsável (ou o admin) produz e valida — um artefato do método é
 * a palavra de um profissional, não um documento que o cliente gera para si.
 */
export default async function EntregaveisPage() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "entregaveis"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="Os entregáveis do método existem quando há uma consultoria ativa."
        explicacao="São os documentos que registram o trabalho: mapa de riscos, política de investimento, plano de continuidade e os demais — cada um versionado na data em que foi entregue."
      />
    );
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) {
    return <p className="text-sm text-indigo-300">Nenhum contrato de consultoria ativo.</p>;
  }

  const deliverables = await prisma.deliverable.findMany({
    where: { engagementId: engagement.id },
    orderBy: [{ code: "asc" }, { version: "desc" }],
  });

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeProduzir = (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;

  const views: DeliverableView[] = deliverables.map((d) => {
    const spec = DELIVERABLES[d.code];
    const content = d.content as unknown as DeliverableContent;
    return {
      id: d.id,
      codigo: d.code,
      nome: spec.name,
      proposito: spec.purpose,
      versao: d.version,
      status: d.status,
      statusLabel: STATUS_LABELS[d.status] ?? d.status,
      criadoEm: formatDateBR(d.createdAt),
      validadoEm: d.validatedAt ? formatDateBR(d.validatedAt) : null,
      nomeNaoConfirmado: !spec.nameConfirmed,
      faseLabel: `Fase ${spec.phase}`,
      sections: content.sections,
      faltando: checkCompleteness(d.code, content).missing,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Cada artefato registra o que foi entregue e quando. Validar não sobrescreve: uma revisão futura gera uma
        versão nova, e a anterior continua existindo — é ela que prova o que foi dito na época.
      </p>

      {podeProduzir && (
        <NovoEntregavelForm
          options={DELIVERABLE_CODES.map((code) => ({
            value: code,
            label: `${code} — ${DELIVERABLES[code].name} (Fase ${DELIVERABLES[code].phase})`,
          }))}
        />
      )}

      {views.length === 0 ? (
        <p className="text-sm text-indigo-300">Nenhum entregável produzido ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {views.map((d) => (
            <DeliverableCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
