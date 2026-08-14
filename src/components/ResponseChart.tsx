"use client";

import { useId, useMemo, useRef, useState } from "react";

export interface ResponseSeries {
  id: string;
  label: string;
  /** CSS color (use a themed token, e.g. "hsl(var(--lowpass))"). */
  color: string;
  curve: number[];
  faint?: boolean;
}

interface Props {
  freqs: number[];
  series: ResponseSeries[];
  min: number;
  max: number;
  height?: number;
  fill?: boolean;
  interactive?: boolean;
}

const F_MIN = 20;
const F_MAX = 20000;
const F_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

const fmtHz = (hz: number) => (hz >= 1000 ? `${hz / 1000}k` : `${hz}`);

export default function ResponseChart({
  freqs,
  series,
  min,
  max,
  height = 220,
  fill = false,
  interactive = true,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const W = 820;
  const H = height;
  const padL = 30;
  const padR = 12;
  const padT = 10;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const lminF = Math.log10(F_MIN);
  const lmaxF = Math.log10(F_MAX);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const xOf = (hz: number) => r2(padL + ((Math.log10(hz) - lminF) / (lmaxF - lminF)) * innerW);
  const yOf = (db: number) => r2(padT + ((max - db) / (max - min)) * innerH);

  const dbTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = max - min > 24 ? 12 : 6;
    const start = Math.ceil(min / step) * step;
    for (let v = start; v <= max; v += step) ticks.push(v);
    if (!ticks.includes(0) && min < 0 && max > 0) ticks.push(0);
    return ticks;
  }, [min, max]);

  const paths = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        d: s.curve.map((db, i) => `${i === 0 ? "M" : "L"}${xOf(freqs[i])},${yOf(db)}`).join(" "),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, freqs, min, max, height],
  );

  const hoverIdx = useMemo(() => {
    if (hoverX === null) return null;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < freqs.length; i++) {
      const d = Math.abs(xOf(freqs[i]) - hoverX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverX, freqs]);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setHoverX(Math.max(padL, Math.min(W - padR, x)));
  }

  return (
    <div className="relative w-full">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverX(null)}
        role="img"
        aria-label="Frequency response"
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0]?.color ?? "hsl(var(--primary))"} stopOpacity="0.14" />
            <stop offset="100%" stopColor={series[0]?.color ?? "hsl(var(--primary))"} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`plot-${uid}`}>
            <rect x={padL} y={padT} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {dbTicks.map((db) => (
          <g key={`h${db}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yOf(db)}
              y2={yOf(db)}
              stroke={db === 0 ? "hsl(var(--border-strong))" : "hsl(var(--border))"}
              strokeWidth={1}
            />
            <text x={padL - 5} y={yOf(db) + 3} textAnchor="end" className="fill-faint" fontSize="9">
              {db > 0 ? `+${db}` : db}
            </text>
          </g>
        ))}

        {F_TICKS.map((hz) => (
          <g key={`v${hz}`}>
            <line x1={xOf(hz)} x2={xOf(hz)} y1={padT} y2={H - padB} stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={xOf(hz)} y={H - padB + 12} textAnchor="middle" className="fill-faint" fontSize="9">
              {fmtHz(hz)}
            </text>
          </g>
        ))}

        <g clipPath={`url(#plot-${uid})`}>
          {fill && paths[0] && (
            <path d={`${paths[0].d} L${xOf(F_MAX)},${yOf(min)} L${xOf(F_MIN)},${yOf(min)} Z`} fill={`url(#fill-${uid})`} />
          )}

          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.faint ? 1 : 1.75}
              strokeOpacity={p.faint ? 0.4 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {hoverIdx !== null && (
          <g>
            <line x1={xOf(freqs[hoverIdx])} x2={xOf(freqs[hoverIdx])} y1={padT} y2={H - padB} stroke="hsl(var(--foreground))" strokeOpacity="0.2" strokeWidth="1" />
            {series.map((s) => (
              <circle
                key={s.id}
                cx={xOf(freqs[hoverIdx])}
                cy={yOf(s.curve[hoverIdx])}
                r={s.faint ? 0 : 2.6}
                fill={s.color}
                stroke="hsl(var(--card))"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}
      </svg>

      {interactive && hoverIdx !== null && (
        <div className="pointer-events-none absolute right-1.5 top-1.5 rounded-md border border-border bg-popover/95 px-2 py-1 font-readout text-[11px] shadow-sm">
          <div className="text-faint">{Math.round(freqs[hoverIdx])} Hz</div>
          {series
            .filter((s) => !s.faint)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                <span className="tabular-nums">
                  {s.curve[hoverIdx] > 0 ? "+" : ""}
                  {s.curve[hoverIdx].toFixed(1)} dB
                </span>
                {series.length > 1 && <span className="text-faint">{s.label}</span>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/** Tiny inline response sparkline for dense table rows. */
export function Sparkline({
  curve,
  color,
  min,
  max,
  width = 120,
  height = 30,
}: {
  curve: number[];
  color: string;
  min: number;
  max: number;
  width?: number;
  height?: number;
}) {
  const n = curve.length;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const clamp = (db: number) => Math.max(min, Math.min(max, db));
  const xOf = (i: number) => r2((i / (n - 1)) * width);
  const yOf = (db: number) => r2(((max - clamp(db)) / (max - min)) * height);
  const d = curve.map((db, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(db)}`).join(" ");
  const zeroY = yOf(0);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block" aria-hidden>
      {min < 0 && max > 0 && (
        <line x1="0" x2={width} y1={zeroY} y2={zeroY} stroke="hsl(var(--border))" strokeWidth="1" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
