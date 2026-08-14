import Link from "next/link";
import { listTunes } from "@/lib/storage";
import { logFreqs, bandResponseDb } from "@/lib/dsp";
import type { Filter } from "@/lib/pct6/types";
import TuneCard from "@/components/TuneCard";
import ResponseChart, { type ResponseSeries } from "@/components/ResponseChart";
import { SectionHeading } from "@/components/ui";
import { ArrowRight, Upload, Sliders, Speaker, Waveform } from "@/components/icons";

export const dynamic = "force-dynamic";

function peak(freq: number, gain: number, q: number): Filter {
  return { type_id: 17, kind: "peak", label: "Peak", freq_hz: freq, gain_db: gain, q, bypassed: false };
}

/** Decorative but real: three summed EQ curves for the hero graphic. */
function heroSeries(freqs: number[]): ResponseSeries[] {
  const sum = (bands: Filter[]) => {
    const parts = bands.map((b) => bandResponseDb(b, freqs));
    return freqs.map((_, i) => parts.reduce((a, p) => a + p[i], 0));
  };
  return [
    { id: "a", label: "High", color: "hsl(var(--highpass))", curve: sum([peak(3200, 4, 1.2), peak(8000, -5, 2), peak(12000, 3, 1.5)]) },
    { id: "b", label: "Mid", color: "hsl(var(--primary))", curve: sum([peak(320, 5, 3), peak(900, -6, 1.4), peak(2000, 3, 2)]) },
    { id: "c", label: "Low", color: "hsl(var(--sub))", curve: sum([peak(45, 4, 1), peak(120, -8, 1.3), peak(70, 3, 2)]) },
  ];
}

export default async function HomePage() {
  const tunes = await listTunes();
  const recent = tunes.slice(0, 6);
  const freqs = logFreqs(20, 20000, 200);
  const hero = heroSeries(freqs);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative grid animate-rise gap-10 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Waveform className="h-4 w-4 text-primary" /> HELIX · BRAX · MATCH DSP tunes
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your DSP tune, <span className="text-gradient-brand">beautifully</span> read.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-muted-foreground">
            Upload a <code className="rounded bg-muted px-1.5 py-0.5 font-readout text-sm">.pct6</code> file
            or pct6-tune JSON and see every channel&apos;s gain, delay, crossover and full
            parametric EQ — visualized, organized, and readable on any device.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tunes"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Browse the library <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-border-strong"
            >
              <Upload className="h-4 w-4" /> Upload a tune
            </Link>
          </div>
        </div>

        {/* Hero chart */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <div className="panel rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-faint">System response</span>
              <div className="flex gap-3 text-xs">
                {hero.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <ResponseChart freqs={freqs} series={hero} min={-15} max={15} height={260} />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="grid gap-4 py-6 sm:grid-cols-3">
        <Feature icon={<Speaker className="h-5 w-5" />} title="Every channel" body="Gain, delay, distance and polarity per output — unconfigured channels hidden automatically." />
        <Feature icon={<Sliders className="h-5 w-5" />} title="Full parametric EQ" body="All active peaking bands and crossover slopes, drawn as a modeled response curve." />
        <Feature icon={<Upload className="h-5 w-5" />} title="Two formats" body="Drop a raw .pct6 and it's decoded and stored as schema-conformant JSON instantly." />
      </section>

      {/* Recent tunes */}
      <section className="space-y-6 py-10">
        <SectionHeading
          eyebrow="Library"
          title="Recent tunes"
          description="Browse published DSP configurations."
          action={
            <Link href="/tunes" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No tunes published yet.</p>
            <Link href="/upload" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> Upload the first one
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <TuneCard key={t.id} tune={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/50 p-5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-muted text-primary">{icon}</span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
