/**
 * Estilos de botão reutilizados nas telas de Cadastros — o padrão antigo
 * (`border-zinc-700 hover:bg-zinc-800`) ficava quase invisível sobre o fundo
 * `#131A47` dos cards. Contraste real: primário sólido, secundário/perigo com
 * borda e fundo translúcido na própria cor.
 */
export const BTN_PRIMARY =
  "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50";

export const BTN_SECONDARY =
  "rounded-lg border border-indigo-400/60 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-50";

export const BTN_GHOST =
  "rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-50";

export const BTN_DANGER =
  "rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50";
