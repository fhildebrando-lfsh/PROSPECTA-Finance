import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatDateBR } from "@/lib/format";
import { INSTRUMENTS, type FormInstrumentCode, type InstrumentField } from "@/lib/method/instruments/catalog";
import { validateAnswers, type Answers } from "@/lib/method/instruments/validation";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { enviarInstrumento, salvarRascunho } from "../actions";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";

function isCode(v: string): v is FormInstrumentCode {
  return v === "A1" || v === "A2" || v === "C";
}

/**
 * Etapa 10 — o formulário de um instrumento.
 *
 * Server Component puro, com `<form action={serverAction}>` e inputs nativos:
 * nada aqui precisa de estado no cliente, e manter assim evita o problema
 * recorrente de `Decimal` vazar para o bundle.
 *
 * Respostas já enviadas viram leitura. O cliente continua vendo o que
 * respondeu — é dado dele —, mas reenviar não é acidente de clique.
 */
export default async function InstrumentoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  if (!isCode(raw)) notFound();
  const code = raw;
  const spec = INSTRUMENTS[code];

  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "diagnostico_dip"))) {
    return <p className="text-sm text-zinc-400">Os instrumentos de diagnóstico exigem consultoria ativa.</p>;
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) return <p className="text-sm text-indigo-300">Nenhum contrato de consultoria ativo.</p>;

  const resposta = await prisma.diagnosticResponse.findFirst({
    where:
      code === "C"
        ? { engagementId: engagement.id, instrument: code, respondedBy: profile.id }
        : { engagementId: engagement.id, instrument: code },
    orderBy: { respondedAt: "desc" },
  });

  const answers = (resposta?.answers ?? {}) as Answers;
  const enviado = resposta?.submittedAt ?? null;
  const faltando = validateAnswers(code, answers).missing;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/metodo/instrumentos" className="text-xs text-indigo-300 hover:text-indigo-200">
          ← Instrumentos
        </Link>
        <h1 className="mt-2 text-lg font-medium text-zinc-100">
          {code} — {spec.name}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">{spec.purpose}</p>
      </div>

      {code === "A1" && (
        <p className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-3 text-xs text-zinc-400">
          Este formulário é curto de propósito — não deve passar de dez minutos. O que pedir mais tempo e documento
          fica para o A2, depois da entrevista. Responda com aproximações onde não souber o número exato.
        </p>
      )}

      {code === "C" && (
        <p className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-3 text-xs text-zinc-400">
          Responda <strong className="text-zinc-300">sozinho</strong>, sem companhia — inclusive sem o cônjuge. Não
          há resposta certa nem melhor: o objetivo é retratar como <em>você</em> se relaciona com risco. Em família,
          cada pessoa responde a sua. Isto não substitui o questionário de suitability da instituição onde você
          investe.
        </p>
      )}

      {!spec.redacaoConfirmada && (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-3 text-xs text-amber-200">
          Os campos abaixo são os que a Metodologia PROSPECTA especifica para este instrumento. A redação final de
          cada pergunta ainda está em revisão — o que você responder continua valendo.
        </p>
      )}

      {enviado && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/10 p-3 text-sm text-emerald-300">
          Enviado em {formatDateBR(enviado)}. Suas respostas estão abaixo; para corrigir alguma coisa, fale com seu
          consultor.
        </div>
      )}

      <form className="flex flex-col gap-6">
        <input type="hidden" name="code" value={code} />

        {spec.blocks.map((block) => (
          <fieldset key={block.title} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <legend className="px-1 text-xs font-medium text-indigo-300">{block.title}</legend>
            <div className="mt-2 flex flex-col gap-4">
              {block.fields.map((f) => (
                <Campo key={f.key} field={f} valor={answers[f.key]} somenteLeitura={enviado !== null} />
              ))}
            </div>
          </fieldset>
        ))}

        {!enviado && (
          <div className="flex flex-wrap items-center gap-3">
            <button formAction={enviarInstrumento} className={BTN_PRIMARY}>
              Enviar
            </button>
            {/* Salvar sem enviar existe para o A2, que é longo e não se responde
                de uma sentada — e a metodologia prevê prazo e lembretes. */}
            <button formAction={salvarRascunho} className={BTN_SECONDARY}>
              Salvar rascunho
            </button>
            <Link href="/metodo/instrumentos" className={BTN_GHOST}>
              Voltar
            </Link>
            {faltando.length > 0 && (
              <span className="text-xs text-zinc-500">
                {faltando.length} campo(s) obrigatório(s) ainda em branco.
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function Campo({
  field,
  valor,
  somenteLeitura,
}: {
  field: InstrumentField;
  valor: unknown;
  somenteLeitura: boolean;
}) {
  const marcados = Array.isArray(valor) ? valor.map(String) : [];
  const texto = valor === null || valor === undefined ? "" : String(valor);

  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      <span>
        {field.label}
        {field.required && <span className="ml-1 text-amber-400">*</span>}
      </span>

      {field.kind === "texto_longo" ? (
        <textarea name={field.key} rows={3} defaultValue={texto} disabled={somenteLeitura} required={field.required} className={INPUT} />
      ) : field.kind === "escolha" || field.kind === "faixa" || field.kind === "likert" ? (
        <select name={field.key} defaultValue={texto} disabled={somenteLeitura} required={field.required} className={INPUT}>
          <option value="">—</option>
          {field.options!.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.kind === "escolha_multipla" ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {field.options!.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-xs text-zinc-300">
              <input
                type="checkbox"
                name={field.key}
                value={o}
                defaultChecked={marcados.includes(o)}
                disabled={somenteLeitura}
                className="accent-amber-500"
              />
              {o}
            </label>
          ))}
        </div>
      ) : field.kind === "sim_nao" ? (
        <select
          name={field.key}
          defaultValue={valor === true ? "sim" : valor === false ? "nao" : ""}
          disabled={somenteLeitura}
          required={field.required}
          className={INPUT}
        >
          <option value="">—</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      ) : field.kind === "consentimento" ? (
        <label className="flex items-start gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            name={field.key}
            defaultChecked={valor === true}
            disabled={somenteLeitura}
            className="mt-0.5 accent-amber-500"
          />
          <span>Li e autorizo.</span>
        </label>
      ) : (
        <input
          name={field.key}
          type={field.kind === "numero" ? "number" : field.kind === "data" ? "date" : "text"}
          step={field.kind === "numero" ? "any" : undefined}
          defaultValue={texto}
          disabled={somenteLeitura}
          required={field.required}
          className={INPUT}
        />
      )}

      {field.hint && <span className="text-[11px] text-zinc-600">{field.hint}</span>}
    </label>
  );
}
