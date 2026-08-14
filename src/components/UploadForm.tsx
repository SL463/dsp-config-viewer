"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Upload, Check } from "./icons";

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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[color-mix(in_srgb,hsl(var(--success))_12%,transparent)] text-success">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-3 text-lg font-semibold">Tune published</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          “{status.title}” was decoded and stored as schema-conformant JSON.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link href={`/tunes/${status.id}`} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            View tune
          </Link>
          <button onClick={() => setStatus({ state: "idle" })} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-border-strong">
            Upload another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-primary bg-primary-muted" : "border-border bg-card hover:border-border-strong"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Upload className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-medium">{file ? file.name : "Drop a .pct6 or pct6-tune JSON here"}</p>
        <p className="mt-0.5 text-xs text-faint">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="title" label="Title" placeholder="e.g. Stage 2 — front stage" />
        <Field name="vehicle" label="Vehicle / system" placeholder="e.g. 2021 Golf R · HELIX DSP.3" />
      </div>
      <Field name="notes" label="Notes" placeholder="Optional description shown on the tune page" textarea />

      {status.state === "error" && (
        <p className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,transparent)] px-3 py-2.5 text-sm text-destructive">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.state === "uploading"}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
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
    "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-ring/30";
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={2} className={cls} />
      ) : (
        <input name={name} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}
