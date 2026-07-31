"use client";

/** Só dispara se o erro acontecer no próprio root layout (raro) — precisa
 * renderizar <html>/<body> porque substitui o layout inteiro nesse caso. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-50">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Algo deu errado</h1>
          <p className="mb-6 text-sm text-zinc-400">Ocorreu um erro inesperado ao carregar o app.</p>
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
      </body>
    </html>
  );
}
