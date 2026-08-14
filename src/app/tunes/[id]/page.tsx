import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTune } from "@/lib/storage";
import { logFreqs, responseExtent } from "@/lib/dsp";
import { channelView, type ChannelView } from "@/lib/view";
import { isAssignedButUntuned, isConfigured, parseSavedDate, summarize } from "@/lib/tune";
import ResponseChart, { type ResponseSeries } from "@/components/ResponseChart";
import TuneChannels from "@/components/TuneChannels";
import { Badge, Panel, SectionHeading, StatTile } from "@/components/ui";
import { ArrowRight } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const record = await getTune(id);
  if (!record) return { title: "Tune not found · DSP Tune Viewer" };
  return {
    title: `${record.title} · DSP Tune Viewer`,
    description: `DSP tune ${record.title}${record.vehicle ? ` — ${record.vehicle}` : ""}`,
  };
}

function overviewSeries(views: ChannelView[]): ResponseSeries[] {
  return views
    .filter((v) => v.hasResponse)
    .map((v) => ({ id: `o-${v.index}`, label: v.speaker, color: v.color, curve: v.curve }));
}

export default async function TuneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getTune(id);
  if (!record) notFound();

  const tune = record.tune;
  const summary = summarize(tune);
  const freqs = logFreqs(20, 20000, 240);

  const outConfigured = tune.outputs.filter(isConfigured).map((c) => channelView(c, freqs));
  const outUntuned = tune.outputs.filter(isAssignedButUntuned).map((c) => channelView(c, freqs));
  const inConfigured = tune.inputs.filter(isConfigured).map((c) => channelView(c, freqs));
  const inUntuned = tune.inputs.filter(isAssignedButUntuned).map((c) => channelView(c, freqs));

  const overview = overviewSeries(outConfigured);
  const extent = responseExtent(
    outConfigured.filter((v) => v.hasResponse).map((v) => v.curve),
  );

  const savedDate = parseSavedDate(tune.meta.D);
  const rawIsHttp = record.rawUrl?.startsWith("http");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      {/* Back */}
      <Link
        href="/tunes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rotate-180" /> Library
      </Link>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {record.title}
            </h1>
            {record.vehicle && <p className="text-lg text-muted-foreground">{record.vehicle}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={record.format === "pct6" ? "primary" : "muted"}>{record.format}</Badge>
            {tune.meta.Dev && <Badge>Device {tune.meta.Dev}</Badge>}
            {tune.meta.V && <Badge>PC-Tool {tune.meta.V}</Badge>}
            {savedDate && <Badge>Saved {summary.savedAt}</Badge>}
          </div>
        </div>
        {record.notes && <p className="max-w-2xl text-sm text-muted-foreground">{record.notes}</p>}
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={summary.configuredOutputs} label="Active outputs" sub={`of ${summary.totalOutputs}`} accent="hsl(var(--primary))" />
        <StatTile value={summary.totalEqBands} label="EQ bands" />
        <StatTile value={summary.configuredInputs} label="Active inputs" sub={`of ${summary.totalInputs}`} />
        <StatTile value={summary.hasSub ? "Yes" : "—"} label="Subwoofer" accent={summary.hasSub ? "hsl(var(--sub))" : undefined} />
      </section>

      {/* System response overview */}
      {overview.length > 0 && (
        <section className="space-y-4">
          <SectionHeading eyebrow="Overview" title="System response" description="Modeled EQ + crossover response for every active output, overlaid. Hover to inspect." />
          <Panel className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
              {overview.map((s) => (
                <span key={s.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
            <ResponseChart freqs={freqs} series={overview} min={extent.min} max={extent.max} height={320} />
          </Panel>
        </section>
      )}

      {/* Output channels */}
      <TuneChannels title="Output channels" configured={outConfigured} untuned={outUntuned} freqs={freqs} extent={extent} />

      {/* Input channels */}
      {(inConfigured.length > 0 || inUntuned.length > 0) && (
        <TuneChannels title="Input channels" configured={inConfigured} untuned={inUntuned} freqs={freqs} extent={extent} />
      )}

      {/* Source details */}
      <section className="space-y-4">
        <SectionHeading eyebrow="Source" title="File details" />
        <Panel className="grid gap-x-8 gap-y-4 p-6 sm:grid-cols-2">
          <Detail label="Source file" value={record.sourceFilename} mono />
          <Detail label="Container" value={tune.container_mode} />
          <Detail label="Decoder" value={tune.decoder} mono />
          <Detail label="XML payload" value={`${tune.xml_bytes.toLocaleString()} bytes`} />
          {tune.meta.FN && <Detail label="Original path" value={tune.meta.FN} mono />}
          <Detail label="Declared I/O" value={`${tune.meta.INS ?? "?"} in · ${tune.meta.OUTS ?? "?"} out`} />
          <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
            <a
              href={`/api/tunes/${record.id}?download=1`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-border-strong"
            >
              Download JSON
            </a>
            {rawIsHttp && (
              <a
                href={record.rawUrl}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-border-strong"
              >
                Download original .pct6
              </a>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</div>
      <div className={`truncate text-sm ${mono ? "font-readout" : ""}`} title={value}>
        {value}
      </div>
    </div>
  );
}
