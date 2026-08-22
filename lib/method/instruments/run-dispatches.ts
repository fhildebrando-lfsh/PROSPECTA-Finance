import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { instrumentRequestEmail } from "@/lib/email/templates";
import { INSTRUMENTS, type FormInstrumentCode } from "./catalog";
import { planDispatches, PRAZO_DIAS, addDays, type DispatchAction } from "./dispatch-engine";

/**
 * Etapa 10-B — camada **impura** do envio automático dos instrumentos
 * (§12.4/§12.8). Lê o dado real, chama o motor puro e executa: manda e-mail e
 * grava `InstrumentDispatch`.
 *
 * Mesmo padrão de `run-automations.ts` e `run-assessment.ts` — a lógica de
 * quando enviar vive em `dispatch-engine.ts`, testável sem tocar em caixa de
 * entrada de ninguém.
 */

/**
 * Interruptor geral, admin-only, editável em `/admin/metodologia`.
 *
 * **Nasce desligado (`0`) de propósito.** Esta é a única rotina do sistema que
 * fala com o cliente sem um humano no meio — todo o resto só produz alerta
 * dentro do app. Uma automação de e-mail que entra no ar junto com o deploy
 * manda mensagem para quem ainda não sabe que ela existe, e e-mail enviado não
 * tem desfazer. Ligar é decisão consciente do dono do produto.
 */
export const PARAM_ENVIO_AUTOMATICO = "instrumentos.envio_automatico_ativo";

export interface RunDispatchesResult {
  /** Falso quando o interruptor está desligado — nada foi sequer avaliado. */
  ativo: boolean;
  engagementsAvaliados: number;
  enviados: number;
  lembretes: number;
  concluidos: number;
  /** Falhas de envio, por instrumento — não interrompem os demais. */
  falhas: string[];
}

async function envioEstaLigado(): Promise<boolean> {
  const p = await prisma.methodologyParameter.findUnique({ where: { key: PARAM_ENVIO_AUTOMATICO } });
  return p ? Number(p.value) === 1 : false;
}

function urlDoInstrumento(baseUrl: string, code: FormInstrumentCode) {
  return `${baseUrl}/metodo/instrumentos/${code}`;
}

export async function runInstrumentDispatches(
  today: Date = new Date(),
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://prospecta-finance.vercel.app",
): Promise<RunDispatchesResult> {
  const vazio: RunDispatchesResult = {
    ativo: false,
    engagementsAvaliados: 0,
    enviados: 0,
    lembretes: 0,
    concluidos: 0,
    falhas: [],
  };

  if (!(await envioEstaLigado())) return vazio;

  const engagements = await prisma.consultingEngagement.findMany({
    where: { status: "ATIVO" },
    include: {
      phases: { select: { phaseNumber: true } },
      diagnosticResponses: { select: { instrument: true, submittedAt: true } },
      instrumentDispatches: true,
    },
  });

  const resultado: RunDispatchesResult = { ...vazio, ativo: true, engagementsAvaliados: engagements.length };
  if (engagements.length === 0) return resultado;

  // O e-mail não vive em `Profile` — está no Supabase Auth. Uma leitura só para
  // todos os contratos do dia, em vez de uma por titular.
  const supabase = createAdminClient();
  const { data: authData, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    resultado.falhas.push(`não foi possível listar e-mails: ${error.message}`);
    return resultado;
  }
  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? null]));

  for (const engagement of engagements) {
    // O destinatário é o titular do workspace — quem contratou. Sem e-mail
    // conhecido não há a quem escrever, e pular é melhor que falhar a rotina
    // inteira por causa de um contrato mal formado.
    const titular = await prisma.membership.findFirst({
      where: { workspaceId: engagement.workspaceId, role: "TITULAR", status: "ACTIVE" },
      include: { profile: true },
    });
    const email = titular ? emailByProfileId.get(titular.profileId) : null;
    if (!titular || !email) {
      resultado.falhas.push(`contrato ${engagement.id}: titular sem e-mail`);
      continue;
    }

    const submitted = engagement.diagnosticResponses
      .filter((r) => r.submittedAt !== null)
      .map((r) => r.instrument)
      .filter((i): i is FormInstrumentCode => i === "A1" || i === "A2" || i === "C");

    const acoes = planDispatches({
      engagementStartsAt: engagement.startsAt,
      phasesStarted: engagement.phases.map((p) => p.phaseNumber),
      dispatches: engagement.instrumentDispatches
        .filter((d): d is typeof d & { instrument: FormInstrumentCode } =>
          d.instrument === "A1" || d.instrument === "A2" || d.instrument === "C",
        )
        .map((d) => ({
          instrument: d.instrument,
          dispatchedAt: d.dispatchedAt,
          dueAt: d.dueAt,
          remindersSent: d.remindersSent,
          lastReminderAt: d.lastReminderAt,
          completedAt: d.completedAt,
        })),
      submitted,
      today,
    });

    for (const acao of acoes) {
      try {
        await executar(acao, {
          engagementId: engagement.id,
          workspaceId: engagement.workspaceId,
          email,
          nome: titular.profile.fullName ?? "",
          baseUrl,
          today,
        });
        if (acao.kind === "ENVIAR") resultado.enviados += 1;
        if (acao.kind === "LEMBRAR") resultado.lembretes += 1;
        if (acao.kind === "CONCLUIR") resultado.concluidos += 1;
      } catch (err) {
        // Uma falha de e-mail não pode derrubar os outros contratos do dia.
        resultado.falhas.push(
          `${acao.kind} ${acao.instrument} (contrato ${engagement.id}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return resultado;
}

interface Contexto {
  engagementId: string;
  workspaceId: string;
  email: string;
  nome: string;
  baseUrl: string;
  today: Date;
}

async function executar(acao: DispatchAction, ctx: Contexto) {
  if (acao.kind === "CONCLUIR") {
    await prisma.instrumentDispatch.updateMany({
      where: { engagementId: ctx.engagementId, instrument: acao.instrument },
      data: { completedAt: ctx.today },
    });
    return;
  }

  const spec = INSTRUMENTS[acao.instrument];

  if (acao.kind === "ENVIAR") {
    const dueAt = addDays(ctx.today, PRAZO_DIAS[acao.instrument]);

    // A linha é criada **antes** do e-mail sair. Se o envio falhar, fica um
    // registro sem entrega — visível e corrigível. A ordem inversa arriscaria
    // mandar duas vezes se a gravação falhasse depois do envio, e e-mail
    // duplicado não tem desfazer.
    await prisma.instrumentDispatch.create({
      data: {
        workspaceId: ctx.workspaceId,
        engagementId: ctx.engagementId,
        instrument: acao.instrument,
        dispatchedAt: ctx.today,
        dueAt,
      },
    });

    await sendEmail({
      to: ctx.email,
      toName: ctx.nome,
      subject: `${spec.name} — próximo passo da sua consultoria`,
      html: instrumentRequestEmail({
        clientName: ctx.nome || "tudo bem?",
        instrumentName: spec.name,
        instrumentCode: acao.instrument,
        url: urlDoInstrumento(ctx.baseUrl, acao.instrument),
        reminderNumber: null,
        diasParaPrazo: PRAZO_DIAS[acao.instrument],
        estimatedMinutes: spec.estimatedMinutes,
      }),
    });
    return;
  }

  // LEMBRAR — o contador sobe antes do envio, pela mesma razão de ordem acima.
  await prisma.instrumentDispatch.updateMany({
    where: { engagementId: ctx.engagementId, instrument: acao.instrument },
    data: { remindersSent: acao.numero, lastReminderAt: ctx.today },
  });

  await sendEmail({
    to: ctx.email,
    toName: ctx.nome,
    subject: `Lembrete: ${spec.name}`,
    html: instrumentRequestEmail({
      clientName: ctx.nome || "tudo bem?",
      instrumentName: spec.name,
      instrumentCode: acao.instrument,
      url: urlDoInstrumento(ctx.baseUrl, acao.instrument),
      reminderNumber: acao.numero,
      diasParaPrazo: acao.diasParaPrazo,
      estimatedMinutes: spec.estimatedMinutes,
    }),
  });
}
