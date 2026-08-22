import type { FormInstrumentCode } from "./catalog";

/**
 * Etapa 10-B — o motor puro do envio automático dos instrumentos (§12.4/§12.8).
 *
 * Decide **o que enviar e quando lembrar** a partir de dado já lido. Não toca em
 * banco nem manda e-mail: quem faz isso é `run-dispatches.ts`. A separação
 * importa mais aqui do que nos outros motores, porque o efeito colateral desta
 * lógica chega na caixa de entrada de um cliente — e engano em e-mail não tem
 * desfazer.
 *
 * §12.8 fixa o protocolo em dias:
 *   D0  (Fase 0) contrato + envio do A1
 *   D0–D5        cliente preenche o A1
 *   D8  (Fase 1) entrevista; envio do C e abertura do A2
 *   D9–D16       cliente completa o A2
 *
 * Daí as duas âncoras: o **A1 sai quando o contrato abre**; **A2 e C saem
 * quando a Fase 1 começa** — que é o registro que o sistema tem da entrevista
 * ter acontecido. Amarrar o A2 a "D8 corridos" seria pior: se a entrevista
 * atrasar, o cliente receberia um formulário que a conversa ainda não preparou.
 */

/** Prazo de cada instrumento, em dias a partir do envio (§12.8). */
export const PRAZO_DIAS: Record<FormInstrumentCode, number> = {
  A1: 5, // D0–D5
  A2: 8, // D9–D16, contados do envio em D8
  // §12.8 é silencioso quanto ao prazo do C; herda a janela do A2, que sai no
  // mesmo momento. Documentado para não parecer número escolhido a esmo.
  C: 8,
};

/**
 * No máximo dois lembretes por instrumento: um na metade do prazo e outro no
 * vencimento. Depois disso o sistema **para** e o atraso vira assunto do
 * consultor. Rotina que cobra para sempre vira spam, e cliente que marca a
 * PROSPECTA como spam deixa de receber o que importa.
 */
export const MAX_LEMBRETES = 2;

export interface DispatchState {
  instrument: FormInstrumentCode;
  dispatchedAt: Date;
  dueAt: Date;
  remindersSent: number;
  lastReminderAt: Date | null;
  completedAt: Date | null;
}

export interface DispatchInput {
  engagementStartsAt: Date;
  /** Fases já iniciadas do contrato — usado para saber se a entrevista ocorreu. */
  phasesStarted: number[];
  dispatches: DispatchState[];
  /** Instrumentos cuja resposta já foi enviada. */
  submitted: FormInstrumentCode[];
  today: Date;
}

export type DispatchAction =
  | { kind: "ENVIAR"; instrument: FormInstrumentCode; dueAt: Date }
  | { kind: "LEMBRAR"; instrument: FormInstrumentCode; numero: number; diasParaPrazo: number }
  | { kind: "CONCLUIR"; instrument: FormInstrumentCode };

const DIA_MS = 86_400_000;

export function addDays(d: Date, dias: number): Date {
  return new Date(d.getTime() + dias * DIA_MS);
}

/** Dias inteiros entre duas datas, truncando — nunca fracionário. */
export function diasEntre(de: Date, ate: Date): number {
  return Math.floor((ate.getTime() - de.getTime()) / DIA_MS);
}

/** Mesmo dia do calendário, em UTC — evita dois lembretes no mesmo dia. */
function mesmoDia(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function planDispatches(input: DispatchInput): DispatchAction[] {
  const acoes: DispatchAction[] = [];
  const porInstrumento = new Map(input.dispatches.map((d) => [d.instrument, d]));

  // --- 1. o que ainda precisa ser enviado ---
  const devidos: { instrument: FormInstrumentCode; quando: Date }[] = [];
  devidos.push({ instrument: "A1", quando: input.engagementStartsAt });

  // A2 e C dependem da entrevista, registrada como início da Fase 1.
  if (input.phasesStarted.includes(1)) {
    devidos.push({ instrument: "A2", quando: input.today });
    devidos.push({ instrument: "C", quando: input.today });
  }

  for (const { instrument, quando } of devidos) {
    if (porInstrumento.has(instrument)) continue;
    // Já respondido antes de existir envio (o cliente entrou na tela sozinho):
    // não faz sentido pedir o que já veio.
    if (input.submitted.includes(instrument)) continue;
    if (quando.getTime() > input.today.getTime()) continue;
    acoes.push({ kind: "ENVIAR", instrument, dueAt: addDays(input.today, PRAZO_DIAS[instrument]) });
  }

  // --- 2. conclusões e lembretes do que já foi enviado ---
  for (const d of input.dispatches) {
    if (d.completedAt !== null) continue;

    if (input.submitted.includes(d.instrument)) {
      acoes.push({ kind: "CONCLUIR", instrument: d.instrument });
      continue;
    }

    if (d.remindersSent >= MAX_LEMBRETES) continue;
    // Um lembrete por dia, no máximo — protege contra o cron rodar duas vezes.
    if (d.lastReminderAt && mesmoDia(d.lastReminderAt, input.today)) continue;

    const prazoTotal = Math.max(1, diasEntre(d.dispatchedAt, d.dueAt));
    const decorridos = diasEntre(d.dispatchedAt, input.today);
    const diasParaPrazo = diasEntre(input.today, d.dueAt);

    // Primeiro lembrete na metade do prazo; segundo no vencimento.
    const gatilho = d.remindersSent === 0 ? Math.ceil(prazoTotal / 2) : prazoTotal;
    if (decorridos >= gatilho) {
      acoes.push({ kind: "LEMBRAR", instrument: d.instrument, numero: d.remindersSent + 1, diasParaPrazo });
    }
  }

  return acoes;
}
