import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTune } from "@/lib/storage";
import { logFreqs, responseExtent } from "@/lib/dsp";
import { channelView, type ChannelView } from "@/lib/view";
import { isAssignedButUntuned, isConfigured, summarize } from "@/lib/tune";
import ResponseChart, { type ResponseSeries } from "@/components/ResponseChart";
import ChannelTable from "@/components/ChannelTable";
import { Badge, Card, KV, Stat } from "@/components/ui";

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
  const extent = responseExtent(outConfigured.filter((v) => v.hasResponse).map((v) => v.curve));
  const rawIsHttp = record.rawUrl?.startsWith("http");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/tunes" className="text-sm text-muted-foreground transition hover:text-foreground">
        ← Library
      </Link>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{record.title}</h1>
          {record.vehicle && <p className="text-muted-foreground">{record.vehicle}</p>}
          {record.notes && <p className="max-w-2xl text-sm text-muted-foreground">{record.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={record.format === "pct6" ? "primary" : "muted"}>{record.format}</Badge>
          {tune.meta.Dev && <Badge>Device {tune.meta.Dev}</Badge>}
          {tune.meta.V && <Badge>PC-Tool {tune.meta.V}</Badge>}
          {summary.savedAt && <Badge>{summary.savedAt}</Badge>}
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat value={summary.configuredOutputs} label="Active outputs" sub={`of ${summary.totalOutputs}`} accent="hsl(var(--primary))" />
        <Stat value={summary.totalEqBands} label="EQ bands" />
        <Stat value={summary.configuredInputs} label="Active inputs" sub={`of ${summary.totalInputs}`} />
        <Stat value={summary.hasSub ? "Yes" : "—"} label="Subwoofer" accent={summary.hasSub ? "hsl(var(--sub))" : undefined} />
      </section>

      {/* System response */}
      {overview.length > 0 && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">System response</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {overview.map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <Card className="p-3 sm:p-4">
            <ResponseChart freqs={freqs} series={overview} min={extent.min} max={extent.max} height={300} />
          </Card>
          <p className="text-xs text-faint">Modeled EQ + crossover response for every active output, overlaid. Hover to inspect.</p>
        </section>
      )}

      {/* Output channels */}
      <ChannelTable title="Output channels" configured={outConfigured} untuned={outUntuned} freqs={freqs} extent={extent} defaultExpandFirst />

      {/* Input channels */}
      {(inConfigured.length > 0 || inUntuned.length > 0) && (
        <ChannelTable title="Input channels" configured={inConfigured} untuned={inUntuned} freqs={freqs} extent={extent} />
      )}

      {/* Source */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">File details</h2>
        <div className="grid gap-x-8 gap-y-0 rounded-lg border border-border bg-card px-4 py-2 sm:grid-cols-2">
          <KV label="Source file" value={record.sourceFilename} mono />
          <KV label="Container" value={tune.container_mode} />
          <KV label="Decoder" value={tune.decoder} mono />
          <KV label="XML payload" value={`${tune.xml_bytes.toLocaleString()} bytes`} mono />
          <KV label="Declared I/O" value={`${tune.meta.INS ?? "?"} in · ${tune.meta.OUTS ?? "?"} out`} mono />
          {tune.meta.FN && <KV label="Original path" value={tune.meta.FN} mono />}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`/api/tunes/${record.id}?download=1`}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-border-strong"
          >
            Download JSON
          </a>
          {rawIsHttp && (
            <a
              href={record.rawUrl}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-border-strong"
            >
              Download original .pct6
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
