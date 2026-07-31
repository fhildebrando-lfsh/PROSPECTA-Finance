const SIZE_W = 220;
const SIZE_H = 130;
const CX = SIZE_W / 2;
const CY = 110;
const R = 90;
const STROKE = 16;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function arcPath(fromDeg: number, toDeg: number, radius: number) {
  const from = polar(fromDeg, radius);
  const to = polar(toDeg, radius);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`;
}

/** §11.6 — velocímetro de 0 a 100% da meta de reserva, com as mesmas faixas de
 * `lib/finance/reserve.ts::reserveGaugeBand` (vermelho até 33%, âmbar até 66%, verde acima). */
export function ReserveGauge({ percentage }: { percentage: number }) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const needleAngle = 180 - (clamped / 100) * 180;
  const needleTip = polar(needleAngle, R - STROKE / 2 - 6);

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE_W} height={SIZE_H} viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}>
        <path d={arcPath(180, 120, R)} stroke="#ef4444" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        <path d={arcPath(120, 60, R)} stroke="#f59e0b" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        <path d={arcPath(60, 0, R)} stroke="#10b981" strokeWidth={STROKE} fill="none" strokeLinecap="round" />

        <line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y} stroke="#f8fafc" strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={7} fill="#f8fafc" />

        <text x={polar(180, R + 18).x} y={polar(180, R + 18).y} className="fill-indigo-300 text-[10px]" textAnchor="middle">
          0%
        </text>
        <text x={polar(0, R + 18).x} y={polar(0, R + 18).y} className="fill-indigo-300 text-[10px]" textAnchor="middle">
          100%
        </text>
      </svg>
      <p className="-mt-2 text-xs font-medium tracking-wide text-indigo-300">RESULTADO</p>
      <p className="font-mono text-2xl font-semibold tabular-nums text-white">{clamped.toFixed(0)}%</p>
    </div>
  );
}
