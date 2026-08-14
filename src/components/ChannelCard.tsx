import type { ChannelView } from "@/lib/view";
import { formatHz } from "@/lib/tune";
import ResponseChart from "./ResponseChart";
import { Badge, Chip, Panel, Readout } from "./ui";

const F_MIN = 20;
const F_MAX = 20000;

/** Parametric bands plotted on a log-frequency strip: up = boost, down = cut. */
function EqStrip({ bands }: { bands: ChannelView["eqBands"] }) {
  if (bands.length === 0) return null;
  const W = 800;
  const H = 54;
  const mid = H / 2;
  const maxAbs = Math.max(6, ...bands.map((b) => Math.abs(b.gainDb)));
  const lmin = Math.log10(F_MIN);
  const lmax = Math.log10(F_MAX);
  // Round to 2 dp so server and client render identical attribute strings
  // (Node and the browser round Math.log10's last digit differently otherwise,
  // which would trip a hydration mismatch).
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const xOf = (hz: number) => r2(((Math.log10(hz) - lmin) / (lmax - lmin)) * W);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-full" role="img" aria-label="EQ bands">
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="hsl(var(--border))" strokeDasharray="2 4" />
      {bands.map((b, i) => {
        const x = xOf(b.freqHz);
        const h = r2((Math.abs(b.gainDb) / maxAbs) * (mid - 4));
        const boost = b.gainDb >= 0;
        const y = boost ? mid - h : mid + h;
        const color = boost ? "hsl(var(--boost))" : "hsl(var(--cut))";
        return (
          <g key={i}>
            <line
              x1={x}
              x2={x}
              y1={mid}
              y2={y}
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx={x} cy={y} r="2.4" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

export default function ChannelCard({
  ch,
  freqs,
  extent,
}: {
  ch: ChannelView;
  freqs: number[];
  extent: { min: number; max: number };
}) {
  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-5">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-readout text-sm font-semibold"
            style={{
              color: ch.color,
              background: `color-mix(in srgb, ${ch.color} 14%, transparent)`,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ch.color} 35%, transparent)`,
            }}
          >
            {ch.index}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-tight">{ch.speaker}</h3>
              <Chip color={ch.color} className="px-2 py-0.5">
                {ch.bandLabel}
              </Chip>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ch.polarityInverted && <Badge tone="invert">Inverted</Badge>}
              {ch.eqBypassed && <Badge tone="muted">EQ bypassed</Badge>}
              {ch.enabled === false && <Badge tone="muted">Disabled</Badge>}
              {!ch.configured && <Badge tone="muted">No settings</Badge>}
            </div>
          </div>
        </div>
        <Readout label="Gain" value={ch.gainText} unit="dB" accent={ch.gainDb > 0 ? "hsl(var(--boost))" : undefined} className="items-end text-right" />
      </div>

      {/* readouts */}
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/60 bg-surface/60 p-3">
        <Readout label="Delay" value={ch.delayMs.toFixed(2)} unit="ms" />
        <Readout label="Distance" value={ch.delayCm.toFixed(1)} unit="cm" />
        <Readout label="Polarity" value={ch.polarityInverted ? "INV" : "+"} accent={ch.polarityInverted ? "hsl(var(--invert))" : undefined} />
      </div>

      {/* crossover chips */}
      <div className="flex flex-wrap gap-2">
        {ch.highpass ? (
          <Chip color="hsl(var(--highpass))">
            <span className="font-semibold">HP</span>
            <span className="font-readout">{formatHz(ch.highpass.freqHz)}</span>
            <span className="text-faint">· {ch.highpass.slope} · {ch.highpass.family}</span>
          </Chip>
        ) : (
          <Chip className="text-faint">HP —</Chip>
        )}
        {ch.lowpass ? (
          <Chip color="hsl(var(--lowpass))">
            <span className="font-semibold">LP</span>
            <span className="font-readout">{formatHz(ch.lowpass.freqHz)}</span>
            <span className="text-faint">· {ch.lowpass.slope} · {ch.lowpass.family}</span>
          </Chip>
        ) : (
          <Chip className="text-faint">LP —</Chip>
        )}
        <Chip color={ch.eqBandCount ? "hsl(var(--primary))" : undefined} className={ch.eqBandCount ? "" : "text-faint"}>
          <span className="font-readout">{ch.eqBandCount}</span> EQ {ch.eqBandCount === 1 ? "band" : "bands"}
        </Chip>
      </div>

      {/* response */}
      {ch.hasResponse ? (
        <div className="rounded-lg border border-border/60 bg-surface/40 p-2">
          <ResponseChart
            freqs={freqs}
            series={[{ id: `ch-${ch.index}`, label: ch.speaker, color: ch.color, curve: ch.curve }]}
            min={extent.min}
            max={extent.max}
            height={150}
            fill
            compact
          />
          <EqStrip bands={ch.eqBands} />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-faint">
          No EQ or crossover on this channel.
        </p>
      )}
    </Panel>
  );
}
