import type { Metadata } from "next";
import Link from "next/link";
import { listTunes, storageMode } from "@/lib/storage";
import AdminTuneList from "@/components/AdminTuneList";
import { Upload } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · DSP Tune Viewer",
};

export default async function AdminPage() {
  const tunes = await listTunes();
  const mode = storageMode();

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Manage tunes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tunes.length} published · storage: {mode === "blob" ? "Vercel Blob" : "local .data (dev)"}
          </p>
        </div>
        <Link href="/upload" className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <Upload className="h-4 w-4" /> Upload
        </Link>
      </div>
      <AdminTuneList tunes={tunes} />
    </div>
  );
}
