"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TuneIndexEntry } from "@/lib/storage";
import { Badge } from "./ui";
import { Search } from "./icons";

type SortKey = "title" | "configuredOutputs" | "totalEqBands" | "uploadedAt";

export default function TuneLibrary({ tunes }: { tunes: TuneIndexEntry[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("uploadedAt");
  const [dir, setDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? tunes.filter((t) =>
          [t.title, t.vehicle, t.device, t.pcTool, t.sourceFilename]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(needle)),
        )
      : tunes;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sort] ?? 0;
      const bv = b[sort] ?? 0;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return sorted;
  }, [q, tunes, sort, dir]);

  function sortBy(key: SortKey) {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(key === "title" ? 1 : -1);
    }
  }

  const arrow = (key: SortKey) => (sort === key ? (dir === 1 ? " ↑" : " ↓") : "");

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tunes, vehicles…"
          className="w-full rounded-md border border-input bg-card py-1.5 pl-8 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
          {tunes.length === 0 ? "No tunes published yet." : "No tunes match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <Th onClick={() => sortBy("title")} className="text-left">Tune{arrow("title")}</Th>
                <Th className="text-left">Vehicle</Th>
                <Th className="text-left">Device</Th>
                <Th onClick={() => sortBy("configuredOutputs")} className="text-right">Ch{arrow("configuredOutputs")}</Th>
                <Th onClick={() => sortBy("totalEqBands")} className="text-right">EQ{arrow("totalEqBands")}</Th>
                <Th onClick={() => sortBy("uploadedAt")} className="text-right">Saved{arrow("uploadedAt")}</Th>
                <Th className="text-right">Fmt</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/tunes/${t.id}`)}
                  className="cursor-pointer border-b border-border/70 transition last:border-0 hover:bg-surface/70"
                >
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-foreground">{t.title}</span>
                    {t.hasSub && <span className="ml-1.5 text-xs text-sub">sub</span>}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">{t.vehicle ?? "—"}</td>
                  <td className="px-3 py-2.5 font-readout text-muted-foreground">{t.device ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-readout">{t.configuredOutputs}</td>
                  <td className="px-3 py-2.5 text-right font-readout">{t.totalEqBands}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{t.savedAt ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Badge tone={t.format === "pct6" ? "primary" : "muted"}>{t.format}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 font-medium ${onClick ? "cursor-pointer select-none hover:text-foreground" : ""} ${className}`}
    >
      {children}
    </th>
  );
}
