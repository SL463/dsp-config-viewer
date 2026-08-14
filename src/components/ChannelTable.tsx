"use client";

import { Fragment, useState } from "react";
import type { ChannelView } from "@/lib/view";
import { formatHz } from "@/lib/tune";
import ResponseChart, { Sparkline } from "./ResponseChart";
import { Chip } from "./ui";

const F_MIN = 20;
const F_MAX = 20000;

function XoverCell({ x, color }: { x: ChannelView["highpass"]; color: string }) {
  if (!x) return <span className="text-faint">—</span>;
  return (
    <span className="whitespace-nowrap">
      <span className="font-readout" style={{ color }}>
        {formatHz(x.freqHz)}
      </span>{" "}
      <span className="text-faint">{x.slope.replace(" dB/oct", "")}·{x.family.slice(0, 4)}</span>
    </span>
  );
}

/** Parametric bands on a log-frequency strip: up = boost, down = cut. */
function EqStrip({ bands }: { bands: ChannelView["eqBands"] }) {
  if (bands.length === 0) return null;
  const W = 760;
  const H = 46;
  const mid = H / 2;
  const maxAbs = Math.max(6, ...bands.map((b) => Math.abs(b.gainDb)));
  const lmin = Math.log10(F_MIN);
  const lmax = Math.log10(F_MAX);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const xOf = (hz: number) => r2(((Math.log10(hz) - lmin) / (lmax - lmin)) * W);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-full" role="img" aria-label="EQ bands">
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="hsl(var(--border))" />
      {bands.map((b, i) => {
        const x = xOf(b.freqHz);
        const h = r2((Math.abs(b.gainDb) / maxAbs) * (mid - 3));
        const boost = b.gainDb >= 0;
        const y = boost ? mid - h : mid + h;
        const color = boost ? "hsl(var(--boost))" : "hsl(var(--cut))";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={mid} y2={y} stroke={color} strokeWidth="2" strokeLinecap="round" />
            <circle cx={x} cy={y} r="2" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function Detail({ ch, freqs, extent }: { ch: ChannelView; freqs: number[]; extent: { min: number; max: number } }) {
  return (
    <div className="grid gap-5 bg-surface/60 px-4 py-4 lg:grid-cols-2">
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">Modeled response</div>
        {ch.hasResponse ? (
          <div className="rounded-md border border-border bg-card p-2">
            <ResponseChart
              freqs={freqs}
              series={[{ id: `d-${ch.index}`, label: ch.speaker, color: ch.color, curve: ch.curve }]}
              min={extent.min}
              max={extent.max}
              height={150}
              fill
            />
            <EqStrip bands={ch.eqBands} />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-faint">
            No EQ or crossover on this channel.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {ch.eqBandCount} parametric {ch.eqBandCount === 1 ? "band" : "bands"}
        </div>
        {ch.eqBands.length > 0 ? (
          <div className="max-h-[188px] overflow-y-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">#</th>
                  <th className="px-3 py-1.5 text-right font-medium">Freq</th>
                  <th className="px-3 py-1.5 text-right font-medium">Gain</th>
                  <th className="px-3 py-1.5 text-right font-medium">Q</th>
                </tr>
              </thead>
              <tbody className="font-readout">
                {ch.eqBands.map((b, i) => (
                  <tr key={i} className="border-t border-border/70">
                    <td className="px-3 py-1 text-faint">{i + 1}</td>
                    <td className="px-3 py-1 text-right">{formatHz(b.freqHz)}</td>
                    <td
                      className="px-3 py-1 text-right"
                      style={{ color: b.gainDb >= 0 ? "hsl(var(--boost))" : "hsl(var(--cut))" }}
                    >
                      {b.gainDb > 0 ? "+" : ""}
                      {b.gainDb.toFixed(1)}
                    </td>
                    <td className="px-3 py-1 text-right">{b.q.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-faint">
            No parametric EQ bands.
          </p>
        )}
      </div>
    </div>
  );
}

const rowKey = (ch: ChannelView) => `${ch.index}-${ch.speaker}`;

export default function ChannelTable({
  title,
  configured,
  untuned,
  freqs,
  extent,
  defaultExpandFirst = false,
}: {
  title: string;
  configured: ChannelView[];
  untuned: ChannelView[];
  freqs: number[];
  extent: { min: number; max: number };
  defaultExpandFirst?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() =>
    defaultExpandFirst && configured.length > 0 ? new Set([rowKey(configured[0])]) : new Set(),
  );
  const rows = showAll ? [...configured, ...untuned] : configured;

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {title} <span className="font-readout text-sm text-faint">· {configured.length}</span>
        </h2>
        {untuned.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-border-strong hover:text-foreground"
          >
            {showAll ? "Hide untuned" : `+${untuned.length} assigned but untuned`}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
          No configured channels.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <Th className="w-10 text-center">#</Th>
                <Th className="text-left">Speaker</Th>
                <Th className="text-right">Gain</Th>
                <Th className="text-right">Delay</Th>
                <Th className="text-right">Dist</Th>
                <Th className="text-center">Pol</Th>
                <Th className="text-left">Highpass</Th>
                <Th className="text-left">Lowpass</Th>
                <Th className="text-right">EQ</Th>
                <Th className="text-left">Response</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ch) => {
                const key = `${ch.index}-${ch.speaker}`;
                const isOpen = open.has(key);
                return (
                  <Fragment key={key}>
                    <tr
                      onClick={() => toggle(key)}
                      className={`cursor-pointer border-b border-border/70 transition hover:bg-surface/70 ${isOpen ? "bg-surface/70" : ""}`}
                    >
                      <td className="px-2 py-2 text-center font-readout text-faint">{ch.index}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: ch.color }} />
                          <span className="font-medium">{ch.speaker}</span>
                          {!ch.configured && <span className="text-[10px] text-faint">untuned</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-readout" style={ch.gainDb > 0 ? { color: "hsl(var(--boost))" } : ch.gainDb < 0 ? undefined : undefined}>
                        {ch.gainText}
                        <span className="text-faint"> dB</span>
                      </td>
                      <td className="px-2 py-2 text-right font-readout">
                        {ch.delayMs.toFixed(2)}
                        <span className="text-faint"> ms</span>
                      </td>
                      <td className="px-2 py-2 text-right font-readout text-muted-foreground">{ch.delayCm.toFixed(1)}</td>
                      <td className="px-2 py-2 text-center">
                        {ch.polarityInverted ? (
                          <span className="font-readout font-semibold text-invert">INV</span>
                        ) : (
                          <span className="text-faint">+</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-left">
                        <XoverCell x={ch.highpass} color="hsl(var(--highpass))" />
                      </td>
                      <td className="px-2 py-2 text-left">
                        <XoverCell x={ch.lowpass} color="hsl(var(--lowpass))" />
                      </td>
                      <td className="px-2 py-2 text-right font-readout">
                        {ch.eqBandCount > 0 ? ch.eqBandCount : <span className="text-faint">0</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        {ch.hasResponse ? (
                          <Sparkline curve={ch.curve} color={ch.color} min={extent.min} max={extent.max} />
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <Detail ch={ch} freqs={freqs} extent={extent} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-faint">Tap a row for its modeled response and full EQ band list.</p>
      {rows.some((r) => r.eqBypassed) && (
        <div className="flex items-center gap-2 text-xs text-faint">
          <Chip>EqBy</Chip> = channel EQ bypassed
        </div>
      )}
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 py-2 font-medium ${className}`}>{children}</th>;
}
