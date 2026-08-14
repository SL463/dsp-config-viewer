import type { Metadata } from "next";
import UploadForm from "@/components/UploadForm";
import { storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upload · DSP Tune Viewer",
};

export default function UploadPage() {
  const mode = storageMode();
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Upload a tune</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Drop a raw .pct6 (decoded and archived automatically) or a pct6-tune-compliant JSON. It&apos;s validated, stored, and published to the library.
        </p>
      </div>
      {mode === "local" && (
        <p className="rounded-md border border-warning/40 bg-[color-mix(in_srgb,hsl(var(--warning))_10%,transparent)] px-3 py-2.5 text-sm text-warning">
          Local storage mode — tunes are saved to <code className="font-readout">.data/</code>. Set{" "}
          <code className="font-readout">BLOB_READ_WRITE_TOKEN</code> to use Vercel Blob in production.
        </p>
      )}
      <UploadForm />
    </div>
  );
}
