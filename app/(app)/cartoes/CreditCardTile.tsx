import Image from "next/image";
import Link from "next/link";

export interface CreditCardTileData {
  id: string;
  name: string;
  institutionName: string | null;
  imageUrl: string | null;
  isActive: boolean;
  creditLimit: string | null;
  currentInvoice: { total: string; dueDate: string } | null;
}

/** Inicial da instituição (ou do nome do cartão) — usada no retângulo de fundo quando
 * o cartão não tem imagem cadastrada, sem depender de nenhum ativo externo. */
function initial(text: string): string {
  return text.trim().charAt(0).toUpperCase() || "?";
}

export function CreditCardTile({ card }: { card: CreditCardTileData }) {
  return (
    <Link
      href={`/cartoes/${card.id}`}
      className={`flex flex-col gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4 transition-colors hover:border-amber-400 ${
        card.isActive ? "" : "opacity-50"
      }`}
    >
      <div className="relative h-32 w-full overflow-hidden rounded-lg">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={card.name} fill sizes="320px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 to-indigo-950">
            <span className="text-4xl font-semibold text-indigo-200">
              {initial(card.institutionName ?? card.name)}
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="truncate text-sm font-medium text-zinc-100">{card.name}</p>
        {card.institutionName && <p className="truncate text-xs text-indigo-300">{card.institutionName}</p>}
      </div>

      {card.currentInvoice ? (
        <div className="border-t border-indigo-900/50 pt-3">
          <p className="text-xs text-indigo-300">Fatura vigente</p>
          <p className="font-mono text-lg tabular-nums text-zinc-100">{card.currentInvoice.total}</p>
          <p className="text-xs text-zinc-500">vence {card.currentInvoice.dueDate}</p>
        </div>
      ) : (
        <p className="border-t border-indigo-900/50 pt-3 text-xs text-zinc-500">
          Dia de fechamento/vencimento não configurado.
        </p>
      )}

      {card.creditLimit && <p className="text-xs text-zinc-500">Limite: {card.creditLimit}</p>}
    </Link>
  );
}
