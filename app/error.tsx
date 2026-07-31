"use client";

import { useEffect } from "react";

const RELOAD_KEY = "pf-auto-reloaded-at";
const RELOAD_COOLDOWN_MS = 10_000;

/** Erro genérico de qualquer rota — cobre principalmente o caso de o app ter
 * sido atualizado (novo deploy) enquanto a aba ainda estava aberta na versão
 * antiga: a navegação tenta buscar um chunk que já não existe mais no
 * servidor. Detecta esse padrão e recarrega a página sozinho, uma vez; pra
 * qualquer outro erro, mostra a tela com o botão manual. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isChunkError =
    /ChunkLoadError|Failed to fetch|Loading chunk|dynamically imported module/i.test(error.message) ||
    error.name === "ChunkLoadError";

  useEffect(() => {
    if (!isChunkError) return;
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) return; // já tentou recarregar recentemente, evita loop
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }, [isChunkError]);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold text-zinc-50">
          {isChunkError ? "Atualizando o app…" : "Algo deu errado"}
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          {isChunkError
            ? "O sistema foi atualizado. Recarregando automaticamente…"
            : "Ocorreu um erro inesperado nesta tela."}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Recarregar página
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}
