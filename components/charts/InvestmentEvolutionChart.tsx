"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface InvestmentEvolutionPoint {
  label: string;
  posicao: number;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Evolução do valor da posição ao longo do tempo (saldo acumulado dos lançamentos
 * ligados) — mesma paleta/estilo de `MonthlyChart`, mas como linha única (não há
 * receita/despesa/saldo separados aqui, só "valor da posição"). */
export function InvestmentEvolutionChart({ data }: { data: InvestmentEvolutionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
        <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(v) => currency.format(v)} width={80} />
        <Tooltip
          formatter={(value) => currency.format(Number(value))}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5" }}
        />
        <Line type="monotone" dataKey="posicao" name="Valor da posição" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
