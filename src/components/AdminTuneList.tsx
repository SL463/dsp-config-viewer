"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TuneIndexEntry } from "@/lib/storage";
import { Badge } from "./ui";
import { Trash, ArrowRight } from "./icons";

export default function AdminTuneList({ tunes }: { tunes: TuneIndexEntry[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tunes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed.");
        return;
      }
      setConfirmId(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  }

  if (tunes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-faint">
        No tunes yet. Upload one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
      {tunes.map((t) => (
        <div
          key={t.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl panel px-4 py-3.5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/tunes/${t.id}`} className="truncate font-medium hover:text-primary">
                {t.title}
              </Link>
              <Badge tone={t.format === "pct6" ? "primary" : "muted"}>{t.format}</Badge>
            </div>
            <div className="mt-0.5 truncate text-xs text-faint">
              {t.vehicle ? `${t.vehicle} · ` : ""}
              {t.configuredOutputs} channels · {t.totalEqBands} EQ bands
              {t.savedAt ? ` · ${t.savedAt}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/tunes/${t.id}`}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {confirmId === t.id ? (
              <>
                <button
                  onClick={() => remove(t.id)}
                  disabled={busy === t.id}
                  className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy === t.id ? "Deleting…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmId(t.id)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
              >
                <Trash className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
