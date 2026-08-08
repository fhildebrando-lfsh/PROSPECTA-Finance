import {
  UtensilsCrossed,
  Home,
  Sofa,
  Shirt,
  Car,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Smartphone,
  TrendingUp,
  ArrowLeftRight,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/** Mapeamento por palavra-chave no nome da categoria — a taxonomia é livre (§7), então
 * não é possível usar um enum fixo de ícones; cai em HelpCircle quando nada bate. */
function iconForCategory(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("aliment")) return UtensilsCrossed;
  if (n.includes("habita") || n.includes("moradia")) return Home;
  if (n.includes("resid")) return Sofa;
  if (n.includes("vestu") || n.includes("roupa")) return Shirt;
  if (n.includes("transport")) return Car;
  if (n.includes("saúde") || n.includes("saude")) return HeartPulse;
  if (n.includes("pessoa") || n.includes("lazer")) return Gamepad2;
  if (n.includes("educa")) return GraduationCap;
  if (n.includes("comunica")) return Smartphone;
  if (n.includes("invest")) return TrendingUp;
  if (n.includes("transfer")) return ArrowLeftRight;
  return HelpCircle;
}

export interface CategoryRingItem {
  categoryId: string;
  name: string;
  percentage: number;
  totalFormatted: string;
}

const SIZE = 88;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CategoryRings({ items }: { items: CategoryRingItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item, index) => {
        const Icon = iconForCategory(item.name);
        const pct = Math.min(Math.max(item.percentage, 0), 100);
        const dash = (pct / 100) * CIRCUMFERENCE;
        return (
          <div
            key={item.categoryId}
            className="flex flex-col items-center gap-2 rounded-xl border border-indigo-900/50 bg-[#131A47] p-3 text-center"
          >
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#3730a3" strokeWidth={STROKE} fill="none" />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#f59e0b"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              </svg>
              <Icon className="absolute inset-0 m-auto h-7 w-7 text-white" aria-hidden />
            </div>
            <p className="text-xs font-medium text-indigo-100">
              {index + 1}. {item.name}
            </p>
            <p className="font-mono text-xs tabular-nums text-indigo-300">
              {pct.toFixed(0)}% · {item.totalFormatted}
            </p>
          </div>
        );
      })}
      {items.length === 0 && <p className="text-sm text-indigo-300">Sem despesas no período.</p>}
    </div>
  );
}
