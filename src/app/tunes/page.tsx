import type { Metadata } from "next";
import { listTunes } from "@/lib/storage";
import TuneLibrary from "@/components/TuneLibrary";
import { SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tune Library · DSP Tune Viewer",
  description: "Browse published HELIX / BRAX / MATCH DSP tunes.",
};

export default async function TunesPage() {
  const tunes = await listTunes();
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <SectionHeading
        eyebrow="Library"
        title="Tune library"
        description={`${tunes.length} published ${tunes.length === 1 ? "tune" : "tunes"}. Tap any card to explore its channels, EQ and crossovers.`}
      />
      <TuneLibrary tunes={tunes} />
    </div>
  );
}
