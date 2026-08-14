import type { Metadata } from "next";
import { listTunes } from "@/lib/storage";
import TuneLibrary from "@/components/TuneLibrary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tune Library · DSP Tune Viewer",
  description: "Browse published HELIX / BRAX / MATCH DSP tunes.",
};

export default async function TunesPage() {
  const tunes = await listTunes();
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tune library</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {tunes.length} published {tunes.length === 1 ? "tune" : "tunes"}. Select a row to view its channels, EQ and crossovers.
        </p>
      </div>
      <TuneLibrary tunes={tunes} />
    </div>
  );
}
