import Link from "next/link";
import { listTunes } from "@/lib/storage";
import { logFreqs, bandResponseDb } from "@/lib/dsp";
import type { Filter } from "@/lib/pct6/types";
import ResponseChart, { type ResponseSeries } from "@/components/ResponseChart";
import { Badge, Card } from "@/components/ui";
import { Upload } from "@/components/icons";

export const dynamic = "force-dynamic";

function peak(freq: number, gain: number, q: number): Filter {
  return { type_id: 17, kind: "peak", label: "Peak", freq_hz: freq, gain_db: gain, q, bypassed: false };
}

function heroSeries(freqs: number[]): ResponseSeries[] {
  const sum = (bands: Filter[]) => {
    const parts = bands.map((b) => bandResponseDb(b, freqs));
    return freqs.map((_, i) => parts.reduce((a, p) => a + p[i], 0));
  };
  return [
    { id: "a", label: "High", color: "hsl(var(--highpass))", curve: sum([peak(3200, 4, 1.2), peak(8000, -5, 2), peak(12000, 3, 1.5)]) },
    { id: "b", label: "Mid", color: "hsl(var(--lowpass))", curve: sum([peak(320, 5, 3), peak(900, -6, 1.4), peak(2000, 3, 2)]) },
    { id: "c", label: "Low", color: "hsl(var(--sub))", curve: sum([peak(45, 4, 1), peak(120, -8, 1.3), peak(70, 3, 2)]) },
  ];
}

export default async function HomePage() {
  const tunes = await listTunes();
  const recent = tunes.slice(0, 6);
  const freqs = logFreqs(20, 20000, 200);
  const hero = heroSeries(freqs);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Read your DSP tune, channel by channel.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Upload a <code className="rounded bg-muted px-1 py-0.5 font-readout text-sm">.pct6</code> file
            or pct6-tune JSON and get every channel&apos;s gain, delay, crossover and parametric EQ as a clean,
            data-dense report — decoded, validated and stored automatically.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/tunes" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Browse the library
            </Link>
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-border-strong">
              <Upload className="h-4 w-4" /> Upload a tune
            </Link>
          </div>
        </div>

        <Card className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Example system response</span>
            <div className="flex gap-2.5">
              {hero.map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <ResponseChart freqs={freqs} series={hero} min={-15} max={15} height={220} interactive={false} />
        </Card>
      </section>

      {/* Recent tunes */}
      <section className="mt-10 space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-semibold">Recent tunes</h2>
          <Link href="/tunes" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No tunes published yet.</p>
            <Link href="/upload" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> Upload the first one
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Tune</th>
                  <th className="px-3 py-2 text-left font-medium">Vehicle</th>
                  <th className="px-3 py-2 text-right font-medium">Channels</th>
                  <th className="px-3 py-2 text-right font-medium">EQ bands</th>
                  <th className="px-3 py-2 text-right font-medium">Format</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-b border-border/70 transition last:border-0 hover:bg-surface/70">
                    <td className="px-3 py-2.5">
                      <Link href={`/tunes/${t.id}`} className="font-medium hover:text-primary">
                        {t.title}
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">{t.vehicle ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-readout">{t.configuredOutputs}</td>
                    <td className="px-3 py-2.5 text-right font-readout">{t.totalEqBands}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Badge tone={t.format === "pct6" ? "primary" : "muted"}>{t.format}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
