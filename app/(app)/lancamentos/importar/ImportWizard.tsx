"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportField, ColumnMapping } from "@/lib/import/column-mapping";
import { getFaturaParser } from "@/lib/import/pdf-statement/parsers/registry";
import type { PdfStatementTransaction } from "@/lib/import/pdf-statement/types";

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

interface WalletOption {
  id: string;
  name: string;
  kindCode?: string;
  institutionSlug?: string | null;
}
interface PersonOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  nature: string;
  name: string;
}

export interface ImportWizardProps {
  wallets: WalletOption[];
  people: PersonOption[];
  categories: CategoryOption[];
  /** Vindo de "Importar fatura" na tela de um cartão específico (Cartões de Crédito). */
  preselectedWalletId?: string;
  forcePdf?: boolean;
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

type Format = "csv" | "ofx" | "pdf";

function detectFormat(filename: string): Format {
  if (/\.(ofx|qfx)$/i.test(filename)) return "ofx";
  if (/\.pdf$/i.test(filename)) return "pdf";
  return "csv";
}

export function ImportWizard({ wallets, people, categories, preselectedWalletId, forcePdf }: ImportWizardProps) {
  const router = useRouter();
  const [format, setFormat] = useState<Format | null>(forcePdf ? "pdf" : null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [ofxText, setOfxText] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [commitResult, setCommitResult] = useState<{ imported: number; skipped: number } | null>(null);

  // §18 — OFX não tem carteira/responsável/categoria por linha; escolhidos uma
  // vez para o arquivo inteiro antes de validar. Fatura em PDF (Cartões de
  // Crédito) reaproveita os mesmos campos, só a carteira fica restrita a cartão.
  const [walletId, setWalletId] = useState(preselectedWalletId ?? "");
  const [responsibleId, setResponsibleId] = useState("");
  const [fallbackCategoryDespesaId, setFallbackCategoryDespesaId] = useState("");
  const [fallbackCategoryReceitaId, setFallbackCategoryReceitaId] = useState("");

  // Fluxo específico de PDF de fatura de cartão.
  const [isCardStatement, setIsCardStatement] = useState<boolean | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [passwordConsent, setPasswordConsent] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [noParserWarning, setNoParserWarning] = useState<string | null>(null);
  const [pdfTransactions, setPdfTransactions] = useState<PdfStatementTransaction[] | null>(null);

  const despesaCategories = categories.filter((c) => c.nature === "DESPESA");
  const receitaCategories = categories.filter((c) => c.nature === "RECEITA");
  const cardWallets = wallets.filter((w) => w.kindCode === "CARTAO_CREDITO");
  const ofxFieldsReady = walletId && responsibleId && fallbackCategoryDespesaId && fallbackCategoryReceitaId;
  const pdfFieldsReady = Boolean(ofxFieldsReady && (!hasPassword || (pdfPassword && passwordConsent)));

  async function runCsvPreview(text: string, mappingOverride?: ColumnMapping) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "csv", csvText: text, mapping: mappingOverride }),
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

  async function runOfxPreview(text: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "ofx",
          ofxText: text,
          walletId,
          responsibleId,
          fallbackCategoryDespesaId,
          fallbackCategoryReceitaId,
        }),
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

  async function runPdfPreview(transactions: PdfStatementTransaction[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pdf",
          transactions: transactions.map((t) => ({
            postedDate: t.postedDate.toISOString(),
            amount: t.amount.toString(),
            description: t.description,
            installmentNumber: t.installmentNumber,
            installmentTotal: t.installmentTotal,
          })),
          walletId,
          responsibleId,
          fallbackCategoryDespesaId,
          fallbackCategoryReceitaId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao validar a fatura.");
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
    const detected = detectFormat(file.name);
    setFilename(file.name);
    setFormat(detected);
    setCommitResult(null);
    setPreview(null);
    setError(null);

    if (detected === "csv") {
      const text = await file.text();
      setCsvText(text);
      setOfxText(null);
      setPdfFile(null);
      await runCsvPreview(text);
    } else if (detected === "ofx") {
      // OFX não roda a prévia sozinho — precisa de carteira/responsável/categorias primeiro.
      const text = await file.text();
      setOfxText(text);
      setCsvText(null);
      setPdfFile(null);
    } else {
      setPdfFile(file);
      setCsvText(null);
      setOfxText(null);
      setIsCardStatement(null);
      setHasPassword(false);
      setPdfPassword("");
      setPasswordConsent(false);
      setNoParserWarning(null);
      setPdfTransactions(null);
    }
  }

  async function handleExtractPdf() {
    if (!pdfFile) return;
    setExtracting(true);
    setError(null);
    setNoParserWarning(null);
    try {
      const wallet = wallets.find((w) => w.id === walletId);
      const parser = getFaturaParser(wallet?.institutionSlug ?? null);
      if (!parser) {
        setNoParserWarning(
          "Ainda não sei ler fatura desse banco — me mande um PDF de exemplo (pode remover dados sensíveis antes) que eu adiciono o leitor.",
        );
        return;
      }

      const { extractPdfText } = await import("@/lib/import/pdf-statement/extract-text");
      const { pages } = await extractPdfText(pdfFile, hasPassword ? pdfPassword : undefined);
      const transactions = parser(pages);
      if (transactions.length === 0) {
        setError("Não encontrei nenhuma compra nesta fatura — confira se é o PDF certo.");
        return;
      }
      setPdfTransactions(transactions);
      await runPdfPreview(transactions);
    } catch (err) {
      const message = err instanceof Error && err.name === "PdfPasswordError" ? "Senha incorreta." : (err as Error).message;
      setError(message);
    } finally {
      setExtracting(false);
    }
  }

  function updateMappingField(field: ImportField, header: string) {
    const next = { ...mapping, [field]: header || undefined };
    setMapping(next);
  }

  async function handleRevalidate() {
    if (csvText) await runCsvPreview(csvText, mapping);
  }

  async function handleValidateOfx() {
    if (ofxText && ofxFieldsReady) await runOfxPreview(ofxText);
  }

  async function handleCommit() {
    setLoading(true);
    setError(null);
    try {
      const body =
        format === "ofx"
          ? {
              format: "ofx",
              ofxText,
              filename,
              skipDuplicates,
              walletId,
              responsibleId,
              fallbackCategoryDespesaId,
              fallbackCategoryReceitaId,
            }
          : format === "pdf"
            ? {
                format: "pdf",
                transactions: (pdfTransactions ?? []).map((t) => ({
                  postedDate: t.postedDate.toISOString(),
                  amount: t.amount.toString(),
                  description: t.description,
                  installmentNumber: t.installmentNumber,
                  installmentTotal: t.installmentTotal,
                })),
                filename,
                skipDuplicates,
                walletId,
                responsibleId,
                fallbackCategoryDespesaId,
                fallbackCategoryReceitaId,
              }
            : { format: "csv", csvText, mapping, filename, skipDuplicates };

      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
            accept=".csv,text/csv,.ofx,.qfx,application/x-ofx,.pdf,application/pdf"
            onChange={handleFileChange}
            className="text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-zinc-100"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {loading && <p className="text-sm text-zinc-500">Processando…</p>}

          {format === "ofx" && !preview && (
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-300">
                OFX não traz carteira, responsável nem categoria por lançamento — escolha uma vez para o extrato
                inteiro. A categoria é sugerida automaticamente pelo histórico de descrições já usadas; quando não
                houver histórico, a categoria padrão abaixo é aplicada e a linha fica marcada para revisão em
                Compromissos → Incidentes.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Carteira
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Responsável
                  <select
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Categoria padrão (despesas sem histórico)
                  <select
                    value={fallbackCategoryDespesaId}
                    onChange={(e) => setFallbackCategoryDespesaId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {despesaCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Categoria padrão (receitas sem histórico)
                  <select
                    value={fallbackCategoryReceitaId}
                    onChange={(e) => setFallbackCategoryReceitaId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {receitaCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                disabled={loading || !ofxFieldsReady}
                onClick={handleValidateOfx}
                className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Validar
              </button>
            </div>
          )}

          {format === "pdf" && !preview && isCardStatement === null && (
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-300">Este PDF é uma fatura de cartão de crédito?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardStatement(true)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setIsCardStatement(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Não
                </button>
              </div>
            </div>
          )}

          {format === "pdf" && isCardStatement === false && (
            <p className="text-sm text-amber-400">
              Por enquanto só oferecemos importação de PDF para fatura de cartão de crédito.
            </p>
          )}

          {format === "pdf" && isCardStatement === true && !preview && (
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-300">
                Escolha o cartão desta fatura, o responsável e as categorias padrão (usadas quando não houver
                histórico de descrição) — a fatura só lista compras dele.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Cartão de crédito
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {cardWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {cardWallets.length === 0 && (
                    <span className="text-amber-400">
                      Nenhum cartão cadastrado ainda —{" "}
                      <a href="/cartoes/novo" className="underline">
                        cadastre um em Cartões de Crédito
                      </a>
                      .
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Responsável
                  <select
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Categoria padrão (despesas sem histórico)
                  <select
                    value={fallbackCategoryDespesaId}
                    onChange={(e) => setFallbackCategoryDespesaId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {despesaCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Categoria padrão (receitas sem histórico — ex.: estorno)
                  <select
                    value={fallbackCategoryReceitaId}
                    onChange={(e) => setFallbackCategoryReceitaId(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">—</option>
                    {receitaCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} />
                O PDF tem senha
              </label>
              {hasPassword && (
                <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <label className="flex flex-col gap-1 text-xs text-zinc-400">
                    Senha do PDF
                    <input
                      type="password"
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="flex items-start gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={passwordConsent}
                      onChange={(e) => setPasswordConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    Autorizo o uso desta senha só para abrir este arquivo agora — ela não é salva em lugar nenhum.
                  </label>
                </div>
              )}

              {noParserWarning && <p className="text-sm text-amber-400">{noParserWarning}</p>}

              <button
                type="button"
                disabled={loading || extracting || !pdfFieldsReady}
                onClick={handleExtractPdf}
                className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {extracting ? "Lendo o PDF…" : "Extrair fatura"}
              </button>
            </div>
          )}

          {preview && (
            <>
              {preview.skippedRows > 0 && (
                <p className="text-sm text-zinc-500">
                  Ignorei {preview.skippedRows}{" "}
                  {preview.skippedRows === 1 ? "linha" : "linhas"}{" "}
                  {format === "ofx"
                    ? "sem data ou valor válidos no extrato"
                    : format === "pdf"
                      ? "de parcelas que já tinham sido lançadas antes (não duplicadas)"
                      : "antes do cabeçalho (não pareciam fazer parte da tabela)"}
                  .
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Stat label="Linhas" value={preview.summary.total} />
                <Stat label="Importáveis" value={preview.summary.importable} tone="emerald" />
                <Stat label="Erros" value={preview.summary.errors} tone="red" />
                <Stat label="Avisos" value={preview.summary.warnings} tone="amber" />
                <Stat label="Duplicatas" value={preview.summary.duplicates} tone="amber" />
              </div>

              {format === "csv" && (
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
              )}

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
