"use client";

import Link from "next/link";

/**
 * Aviso mostrado depois de salvar dados pessoais — não é só um texto
 * decorativo: existe pra cumprir o princípio da transparência da LGPD
 * (Art. 6º, VI e Art. 9º) toda vez que um dado pessoal é gravado, com link
 * direto pra política de privacidade e um resumo dos direitos garantidos
 * pela lei que já funcionam de verdade no sistema hoje.
 */
export function LgpdSavedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-indigo-900/50 bg-zinc-900 p-6">
        <h2 className="mb-2 text-base font-semibold text-zinc-100">Dados salvos</h2>
        <p className="mb-3 text-sm text-zinc-300">
          Seus dados pessoais são tratados conforme a{" "}
          <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)</strong>. Você pode, a qualquer
          momento:
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Corrigir ou atualizar esses dados voltando aqui e clicando em &ldquo;Editar&rdquo;</li>
          <li>Baixar uma cópia de tudo que temos sobre você (portabilidade)</li>
          <li>Excluir sua conta e todos os seus dados permanentemente, quando quiser</li>
        </ul>
        <p className="mb-4 text-xs text-zinc-500">
          Detalhes completos — finalidade do tratamento, base legal, prazo de retenção e quem tem acesso — na{" "}
          <Link href="/politica-privacidade" className="text-indigo-300 underline hover:text-white">
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
