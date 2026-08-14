import Link from "next/link";
import { Waveform } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-muted text-primary">
        <Waveform className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        That page or tune doesn&apos;t exist.
      </p>
      <Link href="/tunes" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        Back to library
      </Link>
    </div>
  );
}
