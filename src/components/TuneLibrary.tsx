"use client";

import { useMemo, useState } from "react";
import type { TuneIndexEntry } from "@/lib/storage";
import TuneCard from "./TuneCard";
import { Search } from "./icons";

export default function TuneLibrary({ tunes }: { tunes: TuneIndexEntry[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tunes;
    return tunes.filter((t) =>
      [t.title, t.vehicle, t.device, t.pcTool, t.sourceFilename]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle)),
    );
  }, [q, tunes]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tunes, vehicles…"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-primary/50 focus:ring-focus"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-faint">
          {tunes.length === 0 ? "No tunes published yet." : "No tunes match your search."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TuneCard key={t.id} tune={t} />
          ))}
        </div>
      )}
    </div>
  );
}
