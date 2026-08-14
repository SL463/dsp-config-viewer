"use client";

import { useId, useMemo, useRef, useState } from "react";

export interface ResponseSeries {
  id: string;
  label: string;
  /** CSS color (use a themed value, e.g. "hsl(var(--lowpass))"). */
  color: string;
  /** dB values aligned to `freqs`. */
  curve: number[];
  dashed?: boolean;
  faint?: boolean;
}

interface Props {
  freqs: number[];
  series: ResponseSeries[];
  min: number;
  max: number;
  height?: number;
  /** Fill under the curve — best for a single hero series. */
  fill?: boolean;
  /** Show the frequency/dB readout on hover. */
  interactive?: boolean;
  /** Compact variant hides axis labels (for cards). */
  compact?: boolean;
}

const F_MIN = 20;
const F_MAX = 20000;
const F_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

function fmtHz(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

export default function ResponseChart({
  freqs,
  series,
  min,
  max,
  height = 220,
  fill = false,
  interactive = true,
  compact = false,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const W = 800;
  const H = height;
  const padL = compact ? 8 : 34;
  const padR = compact ? 8 : 14;
  const padT = 12;
  const padB = compact ? 14 : 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const lminF = Math.log10(F_MIN);
  const lmaxF = Math.log10(F_MAX);

  // Round to 2 dp so SSR and client hydration produce identical attribute
  // strings (Node vs browser Math.log10 can differ in the last digit).
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
      series.map((s) => {
        const d = s.curve
          .map((db, i) => `${i === 0 ? "M" : "L"}${xOf(freqs[i]).toFixed(1)},${yOf(db).toFixed(1)}`)
          .join(" ");
        return { ...s, d };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, freqs, min, max, height, compact],
  );

  // Nearest sample index to the hovered x.
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
            <stop offset="0%" stopColor={series[0]?.color ?? "hsl(var(--primary))"} stopOpacity="0.28" />
            <stop offset="100%" stopColor={series[0]?.color ?? "hsl(var(--primary))"} stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* dB gridlines */}
        {dbTicks.map((db) => (
          <g key={`h${db}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yOf(db)}
              y2={yOf(db)}
              stroke={db === 0 ? "hsl(var(--border-strong))" : "hsl(var(--border))"}
              strokeWidth={db === 0 ? 1.2 : 1}
              strokeDasharray={db === 0 ? "" : "2 5"}
            />
            {!compact && (
              <text x={padL - 6} y={yOf(db) + 3} textAnchor="end" className="fill-faint" fontSize="10">
                {db > 0 ? `+${db}` : db}
              </text>
            )}
          </g>
        ))}

        {/* frequency gridlines */}
        {F_TICKS.map((hz) => (
          <g key={`v${hz}`}>
            <line
              x1={xOf(hz)}
              x2={xOf(hz)}
              y1={padT}
              y2={H - padB}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              strokeDasharray="2 5"
            />
            {!compact && (
              <text x={xOf(hz)} y={H - padB + 14} textAnchor="middle" className="fill-faint" fontSize="10">
                {fmtHz(hz)}
              </text>
            )}
          </g>
        ))}

        {/* fill under first series */}
        {fill && paths[0] && (
          <path d={`${paths[0].d} L${xOf(F_MAX).toFixed(1)},${yOf(min)} L${xOf(F_MIN).toFixed(1)},${yOf(min)} Z`} fill={`url(#fill-${uid})`} />
        )}

        {/* curves */}
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={p.faint ? 1.2 : 2.4}
            strokeOpacity={p.faint ? 0.35 : 1}
            strokeDasharray={p.dashed ? "5 4" : ""}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={p.faint ? undefined : `url(#glow-${uid})`}
          />
        ))}

        {/* hover scrubber */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={xOf(freqs[hoverIdx])}
              x2={xOf(freqs[hoverIdx])}
              y1={padT}
              y2={H - padB}
              stroke="hsl(var(--foreground))"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
            {series.map((s) => (
              <circle
                key={s.id}
                cx={xOf(freqs[hoverIdx])}
                cy={yOf(s.curve[hoverIdx])}
                r={s.faint ? 0 : 3.2}
                fill={s.color}
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}
      </svg>

      {/* hover readout */}
      {interactive && hoverIdx !== null && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-border bg-popover/90 px-2 py-1 font-readout text-xs text-popover-foreground shadow-lg backdrop-blur">
          <div className="text-faint">{Math.round(freqs[hoverIdx])} Hz</div>
          {series
            .filter((s) => !s.faint)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
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
