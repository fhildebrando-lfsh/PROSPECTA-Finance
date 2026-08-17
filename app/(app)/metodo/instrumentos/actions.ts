"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { prisma } from "@/lib/db/prisma";
import {
  CATALOG_VERSION,
  INSTRUMENTS,
  allFields,
  type FormInstrumentCode,
} from "@/lib/method/instruments/catalog";
import { validateAnswers, type Answers } from "@/lib/method/instruments/validation";

function parseCode(raw: unknown): FormInstrumentCode {
  const code = String(raw ?? "");
  if (code === "A1" || code === "A2" || code === "C") return code;
  throw new Error("Instrumento inválido.");
}

/**
 * Traduz o `FormData` no `answers: Json`, **guiado pelo catálogo** e não pelo
 * que veio no post: campo que não está no catálogo é ignorado. Sem isso, um
 * form adulterado escreveria chave arbitrária dentro do Json do cliente.
 */
function answersFromForm(code: FormInstrumentCode, formData: FormData): Answers {
  const answers: Answers = {};

  for (const field of allFields(code)) {
    switch (field.kind) {
      case "escolha_multipla":
        answers[field.key] = formData.getAll(field.key).map(String).filter((v) => v !== "");
        break;
      case "consentimento":
        answers[field.key] = formData.get(field.key) === "on";
        break;
      case "sim_nao": {
        const v = String(formData.get(field.key) ?? "");
        answers[field.key] = v === "" ? null : v === "sim";
        break;
      }
      case "numero": {
        const v = String(formData.get(field.key) ?? "").trim().replace(",", ".");
        answers[field.key] = v === "" ? null : Number(v);
        break;
      }
      default:
        answers[field.key] = String(formData.get(field.key) ?? "");
    }
  }

  return answers;
}

async function contexto(code: FormInstrumentCode) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "diagnostico_dip"))) {
    throw new Error("Os instrumentos de diagnóstico existem com uma consultoria ativa.");
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new Error("Nenhum contrato de consultoria ativo.");

  return { workspaceId, profileId: profile.id, engagementId: engagement.id, spec: INSTRUMENTS[code] };
}

/**
 * O C é respondido **individualmente e sem companhia** (§12.6), então cada
 * pessoa tem a sua linha — a chave inclui quem respondeu. A1 e A2 são do
 * núcleo: uma por contrato.
 */
function chaveDaResposta(code: FormInstrumentCode, engagementId: string, profileId: string) {
  return code === "C"
    ? { engagementId, instrument: code, respondedBy: profileId }
    : { engagementId, instrument: code };
}

async function gravar(code: FormInstrumentCode, formData: FormData, enviar: boolean) {
  const { workspaceId, profileId, engagementId } = await contexto(code);
  const answers = answersFromForm(code, formData);

  if (enviar) {
    const { missing } = validateAnswers(code, answers);
    if (missing.length > 0) {
      throw new Error(`Faltam responder: ${missing.join(", ")}.`);
    }
  }

  const existente = await prisma.diagnosticResponse.findFirst({
    where: chaveDaResposta(code, engagementId, profileId),
  });

  // Resposta já enviada não é reescrita por um salvamento acidental — enviar de
  // novo é ato explícito, e sobrescrever em silêncio apagaria o que o consultor
  // já leu.
  if (existente?.submittedAt && !enviar) return;

  const dados = {
    answers: answers as object,
    catalogVersion: CATALOG_VERSION,
    submittedAt: enviar ? new Date() : null,
    respondedBy: profileId,
  };

  if (existente) {
    await prisma.diagnosticResponse.update({ where: { id: existente.id }, data: dados });
  } else {
    await prisma.diagnosticResponse.create({
      data: { workspaceId, engagementId, instrument: code, ...dados },
    });
  }

  revalidatePath("/metodo/instrumentos");
  revalidatePath(`/metodo/instrumentos/${code}`);
}

export async function salvarRascunho(formData: FormData) {
  await gravar(parseCode(formData.get("code")), formData, false);
}

export async function enviarInstrumento(formData: FormData) {
  await gravar(parseCode(formData.get("code")), formData, true);
}
