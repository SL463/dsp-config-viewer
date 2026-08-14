"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Upload, Check, ArrowRight } from "./icons";

type Status =
  | { state: "idle" }
  | { state: "uploading" }
  | { state: "error"; message: string }
  | { state: "done"; id: string; title: string; format: string };

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setFile(f);
    if (status.state === "error" || status.state === "done") setStatus({ state: "idle" });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setStatus({ state: "error", message: "Choose a .pct6 or JSON file first." });
      return;
    }
    setStatus({ state: "uploading" });
    const form = new FormData(e.currentTarget);
    form.set("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ state: "error", message: data.error ?? "Upload failed." });
        return;
      }
      setStatus({ state: "done", id: data.id, title: data.title, format: data.format });
      setFile(null);
    } catch {
      setStatus({ state: "error", message: "Network error. Please try again." });
    }
  }

  if (status.state === "done") {
    return (
      <div className="panel rounded-2xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color-mix(in_srgb,hsl(var(--success))_18%,transparent)] text-success">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Tune published</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          “{status.title}” was decoded and stored as schema-conformant JSON.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/tunes/${status.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            View tune <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setStatus({ state: "idle" })}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition hover:border-border-strong"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-surface/50 hover:border-border-strong"
        }`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-muted text-primary">
          <Upload className="h-7 w-7" />
        </span>
        <p className="mt-4 font-medium">
          {file ? file.name : "Drop a .pct6 or pct6-tune JSON here"}
        </p>
        <p className="mt-1 text-sm text-faint">
          {file ? `${(file.size / 1024).toFixed(1)} KB · click to change` : "or click to browse"}
        </p>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".pct6,.json,application/json,application/octet-stream"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Title" placeholder="e.g. Stage 2 — front stage" />
        <Field name="vehicle" label="Vehicle / system" placeholder="e.g. 2021 Golf R · HELIX DSP.3" />
      </div>
      <Field name="notes" label="Notes" placeholder="Optional description shown on the tune page" textarea />

      {status.state === "error" && (
        <p className="whitespace-pre-wrap rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.state === "uploading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {status.state === "uploading" ? "Decoding…" : "Decode & publish"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  textarea,
}: {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-primary/50 focus:ring-focus";
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={2} className={cls} />
      ) : (
        <input name={name} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}
