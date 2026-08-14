"use client";

import { useState } from "react";
import type { ChannelView } from "@/lib/view";
import ChannelCard from "./ChannelCard";
import { Speaker } from "./icons";

export default function TuneChannels({
  title,
  configured,
  untuned,
  freqs,
  extent,
}: {
  title: string;
  configured: ChannelView[];
  untuned: ChannelView[];
  freqs: number[];
  extent: { min: number; max: number };
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? [...configured, ...untuned] : configured;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Speaker className="h-5 w-5 text-primary" />
          {title}
          <span className="font-readout text-sm text-faint">{configured.length}</span>
        </h2>
        {untuned.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-border-strong hover:text-foreground"
          >
            {showAll
              ? "Hide untuned channels"
              : `Show ${untuned.length} assigned but untuned`}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-faint">
          No configured channels.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((ch) => (
            <ChannelCard key={`${ch.index}-${ch.speaker}`} ch={ch} freqs={freqs} extent={extent} />
          ))}
        </div>
      )}
    </section>
  );
}
