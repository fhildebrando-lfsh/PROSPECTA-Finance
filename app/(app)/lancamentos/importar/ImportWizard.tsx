"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportField, ColumnMapping } from "@/lib/import/column-mapping";

interface RowIssue {
  field: string;
  severity: "erro" | "aviso";
  message: string;
}

interface PreviewRow {
  index: number;
  raw: Record<string, string>;
  issues: RowIssue[];
  hasError: boolean;
  isDuplicate: boolean;
}

interface PreviewResponse {
  headers: string[];
  mapping: ColumnMapping;
  missingRequiredFields: ImportField[];
  rows: PreviewRow[];
  summary: { total: number; errors: number; warnings: number; duplicates: number; importable: number };
  skippedRows: number;
}

const FIELD_LABELS: Record<ImportField, string> = {
  transactionDate: "Compra (data)",
  dueDate: "Vence (data)",
  walletName: "Tipo de Carteira",
  nature: "Tipo",
  categoryName: "Categoria",
  subcategoryName: "Subcategoria",
  description: "Descrição",
  responsibleName: "Responsáveis",
  amount: "Valor",
  recorrencia: "Recorrência",
  statusLabel: "Situação",
  note: "Observação",
  tags: "Organização (tags)",
};

const ALL_FIELDS = Object.keys(FIELD_LABELS) as ImportField[];

export function ImportWizard() {
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [commitResult, setCommitResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function runPreview(text: string, mappingOverride?: ColumnMapping) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text, mapping: mappingOverride }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao validar o arquivo.");
      setPreview(json);
      setMapping(json.mapping);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setCommitResult(null);
    const text = await file.text();
    setCsvText(text);
    await runPreview(text);
  }

  function updateMappingField(field: ImportField, header: string) {
    const next = { ...mapping, [field]: header || undefined };
    setMapping(next);
  }

  async function handleRevalidate() {
    if (csvText) await runPreview(csvText, mapping);
  }

  async function handleCommit() {
    if (!csvText) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, mapping, filename, skipDuplicates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao importar.");
      setCommitResult({ imported: json.imported, skipped: json.skipped });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const rowsWithIssues = preview?.rows.filter((r) => r.issues.length > 0).slice(0, 100) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {commitResult ? (
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-100">
            Importação concluída: <strong>{commitResult.imported}</strong> lançamentos importados,{" "}
            <strong>{commitResult.skipped}</strong> ignorados (erro ou duplicata).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/lancamentos")}
              className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Ver lançamentos
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="w-fit rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Importar outro arquivo
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-zinc-100"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {loading && <p className="text-sm text-zinc-500">Processando…</p>}

          {preview && (
            <>
              {preview.skippedRows > 0 && (
                <p className="text-sm text-zinc-500">
                  Ignorei {preview.skippedRows}{" "}
                  {preview.skippedRows === 1 ? "linha" : "linhas"} antes do cabeçalho (não pareciam fazer parte da
                  tabela).
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Stat label="Linhas" value={preview.summary.total} />
                <Stat label="Importáveis" value={preview.summary.importable} tone="emerald" />
                <Stat label="Erros" value={preview.summary.errors} tone="red" />
                <Stat label="Avisos" value={preview.summary.warnings} tone="amber" />
                <Stat label="Duplicatas" value={preview.summary.duplicates} tone="amber" />
              </div>

              <div>
                <h2 className="mb-2 text-sm font-medium text-zinc-300">Mapeamento de colunas</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ALL_FIELDS.map((field) => (
                    <label key={field} className="flex flex-col gap-1 text-xs text-zinc-400">
                      {FIELD_LABELS[field]}
                      <select
                        value={mapping[field] ?? ""}
                        onChange={(e) => updateMappingField(field, e.target.value)}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                      >
                        <option value="">—</option>
                        {preview.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRevalidate}
                  className="mt-3 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Revalidar com este mapeamento
                </button>
              </div>

              {preview.missingRequiredFields.length > 0 && (
                <p className="text-sm text-amber-400">
                  Faltam mapear: {preview.missingRequiredFields.map((f) => FIELD_LABELS[f]).join(", ")}.
                </p>
              )}

              {rowsWithIssues.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-medium text-zinc-300">
                    Linhas com erro ou aviso (mostrando até 100)
                  </h2>
                  <div className="max-h-96 overflow-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-900 text-left text-zinc-500">
                        <tr>
                          <th className="px-2 py-1.5">#</th>
                          <th className="px-2 py-1.5">Problemas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsWithIssues.map((row) => (
                          <tr key={row.index} className="border-t border-zinc-800">
                            <td className="px-2 py-1.5 align-top text-zinc-400">{row.index + 1}</td>
                            <td className="px-2 py-1.5">
                              {row.issues.map((issue, i) => (
                                <div
                                  key={i}
                                  className={issue.severity === "erro" ? "text-red-400" : "text-amber-400"}
                                >
                                  [{issue.field}] {issue.message}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                Ignorar possíveis duplicatas (recomendado)
              </label>

              <button
                type="button"
                disabled={loading || preview.missingRequiredFields.length > 0 || preview.summary.importable === 0}
                onClick={handleCommit}
                className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Confirmar importação ({preview.summary.importable} lançamentos)
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "red" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-400" : tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-400" : "text-zinc-50";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`font-mono text-xl tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
