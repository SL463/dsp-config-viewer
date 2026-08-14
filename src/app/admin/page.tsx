import type { Metadata } from "next";
import Link from "next/link";
import { listTunes, storageMode } from "@/lib/storage";
import AdminTuneList from "@/components/AdminTuneList";
import { SectionHeading } from "@/components/ui";
import { Upload } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · DSP Tune Viewer",
};

export default async function AdminPage() {
  const tunes = await listTunes();
  const mode = storageMode();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <SectionHeading
        eyebrow="Admin"
        title="Manage tunes"
        description={`${tunes.length} published. Storage: ${mode === "blob" ? "Vercel Blob" : "local .data (dev)"}.`}
        action={
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Upload className="h-4 w-4" /> Upload
          </Link>
        }
      />

      <AdminTuneList tunes={tunes} />
    </div>
  );
}
