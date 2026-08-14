import type { Metadata } from "next";
import UploadForm from "@/components/UploadForm";
import { SectionHeading } from "@/components/ui";
import { storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upload · DSP Tune Viewer",
};

export default function UploadPage() {
  const mode = storageMode();
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      <SectionHeading
        eyebrow="Admin"
        title="Upload a tune"
        description="Drop a raw .pct6 (decoded and archived automatically) or a pct6-tune-compliant JSON. It's validated, stored, and published to the library."
      />
      {mode === "local" && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          Running in local storage mode — tunes are saved to <code className="font-readout">.data/</code>.
          Set <code className="font-readout">BLOB_READ_WRITE_TOKEN</code> to use Vercel Blob in production.
        </p>
      )}
      <UploadForm />
    </div>
  );
}
