import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { daysBetween } from "@/lib/finance/dates";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { markSettled } from "../actions";
import { CompromissosTabs } from "../CompromissosTabs";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function parseMonthParam(raw: string | undefined) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export default async function CompromissosCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month: monthRaw, day: dayRaw } = await searchParams;
  const workspaceId = await requireWorkspaceId();
  const { year, month } = parseMonthParam(monthRaw);

  const firstOfMonth = utcDate(year, month, 1);
  const lastOfMonth = utcDate(year, month + 1, 0);
  const gridStart = utcDate(year, month, 1 - firstOfMonth.getUTCDay());
  const gridEnd = utcDate(year, month, lastOfMonth.getUTCDate() + (6 - lastOfMonth.getUTCDay()));

  const entries = await prisma.entry.findMany({
    where: {
      workspaceId,
      statusCode: { in: ["A_PAGAR", "A_RECEBER"] },
      dueDate: { gte: gridStart, lte: gridEnd },
    },
    include: { wallet: true, category: true, responsible: true },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const byDay = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = dayKey(entry.dueDate);
    const list = byDay.get(key);
    if (list) list.push(entry);
    else byDay.set(key, [entry]);
  }

  const weeks: Date[][] = [];
  for (const d = new Date(gridStart); d <= gridEnd; d.setUTCDate(d.getUTCDate() + 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i)));
  }

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const selectedKey = dayRaw && /^\d{4}-\d{2}-\d{2}$/.test(dayRaw) ? dayRaw : null;
  const selectedEntries = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const selectedDate = selectedKey ? new Date(`${selectedKey}T00:00:00Z`) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Compromissos</h1>
        <p className="text-sm text-zinc-500">O que ainda está a pagar ou a receber, num calendário mensal (§13).</p>
      </div>

      <CompromissosTabs active="calendario" />

      <div className="flex items-center justify-between">
        <Link
          href={`/compromissos/calendario?month=${monthParam(prev.year, prev.month)}`}
          className="rounded-lg border border-indigo-900/50 px-3 py-1.5 text-sm text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
        >
          ← Anterior
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-zinc-100">
            {MONTH_LABELS[month]} {year}
          </h2>
          <Link
            href="/compromissos/calendario"
            className="rounded-lg border border-indigo-900/50 px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
          >
            Hoje
          </Link>
        </div>
        <Link
          href={`/compromissos/calendario?month=${monthParam(next.year, next.month)}`}
          className="rounded-lg border border-indigo-900/50 px-3 py-1.5 text-sm text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
        >
          Próximo →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div className="grid min-w-[608px] grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-1 pb-1 text-center text-xs font-medium text-zinc-500">
              {label}
            </div>
          ))}
          {weeks.flatMap((week) =>
            week.map((date) => {
              const key = dayKey(date);
              const inMonth = date.getUTCMonth() === month;
              const isToday = key === dayKey(today);
              const isSelected = key === selectedKey;
              const dayEntries = byDay.get(key) ?? [];
              const overdue = daysBetween(today, date) < 0;
              const visible = dayEntries.slice(0, 3);
              const extra = dayEntries.length - visible.length;

              return (
                <Link
                  key={key}
                  href={`/compromissos/calendario?month=${monthParam(year, month)}&day=${key}`}
                  className={`flex min-h-[92px] flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10"
                      : inMonth
                        ? "border-indigo-900/50 bg-[#3264a8] hover:border-amber-400"
                        : "border-transparent bg-transparent opacity-40 hover:opacity-70"
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-zinc-950"
                        : "text-zinc-400"
                    }`}
                  >
                    {date.getUTCDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {visible.map((entry) => (
                      <span
                        key={entry.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                          overdue ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {entry.description}
                      </span>
                    ))}
                    {extra > 0 && <span className="text-[10px] text-zinc-500">+{extra} mais</span>}
                  </div>
                </Link>
              );
            }),
          )}
        </div>
      </div>

      {selectedDate && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">
            {formatDateBR(selectedDate)} ({selectedEntries.length})
          </h2>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-zinc-600">Nada nesse dia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                    daysBetween(today, entry.dueDate) < 0 ? "border-rose-900 bg-rose-950/30" : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-100">{entry.description}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.wallet.name} · {entry.category.name} · {entry.responsible.name} · vence{" "}
                      {formatDateBR(entry.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        entry.amount.isNegative() ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {formatCurrencyBRL(entry.amount)}
                    </span>
                    <form action={markSettled}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400"
                      >
                        {entry.statusCode === "A_RECEBER" ? "Marcar como recebido" : "Marcar como pago"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
