"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MonthlyChartPoint {
  label: string;
  receita: number;
  /** Sinal original (negativo) — a barra desenha o valor absoluto (§ pedido do usuário,
   * 2026-08-12: despesa aparece acima do zero, igual receita, diferenciada só pela cor,
   * pra comparar as duas mais intuitivamente). */
  despesa: number;
  saldo: number;
  /** Opcional — só o Painel usa (Últimos 6 meses/Provisão). Os outros usos deste
   * componente (evolução de dívida/patrimônio/renda) não têm essa dimensão. Com sinal
   * real, ao contrário de `despesa` — pode desenhar abaixo do zero de propósito. */
  investimento?: number;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function MonthlyChart({ data }: { data: MonthlyChartPoint[] }) {
  const chartData = data.map((d) => ({ ...d, despesa: Math.abs(d.despesa) }));
  const showInvestimento = data.some((d) => d.investimento !== undefined);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
        <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(v) => currency.format(v)} width={80} />
        <Tooltip
          formatter={(value) => currency.format(Number(value))}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5" }}
        />
        <Legend />
        <Bar dataKey="receita" name="Receita" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesa" name="Despesa" fill="#f87171" radius={[4, 4, 0, 0]} />
        {showInvestimento && (
          <Line type="monotone" dataKey="investimento" name="Investimento" stroke="#ffffff" strokeWidth={2} dot={false} />
        )}
        <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#fbbf24" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
