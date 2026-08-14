/**
 * Tune library storage.
 *
 * Backed by Vercel Blob in production (set BLOB_READ_WRITE_TOKEN). When no
 * token is present — e.g. local dev before you've wired Blob — it transparently
 * falls back to a JSON store under .data/ so the whole app still runs locally.
 *
 * Server-only. Never import from client components.
 */
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DecodedTune } from "./pct6/types";

export type TuneFormat = "pct6" | "json";

/** Full stored record for one tune. */
export interface TuneRecord {
  id: string;
  title: string;
  vehicle?: string;
  notes?: string;
  sourceFilename: string;
  format: TuneFormat;
  /** Public URL of the original .pct6 (only when a raw file was uploaded). */
  rawUrl?: string;
  uploadedAt: string;
  tune: DecodedTune;
}

/** Lightweight entry for list views. */
export interface TuneIndexEntry {
  id: string;
  title: string;
  vehicle?: string;
  sourceFilename: string;
  format: TuneFormat;
  uploadedAt: string;
  device?: string;
  pcTool?: string;
  savedAt?: string;
  configuredOutputs: number;
  totalEqBands: number;
  hasSub: boolean;
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const useBlob = Boolean(TOKEN);

const INDEX_KEY = "index.json";
const recordKey = (id: string) => `tunes/${id}.json`;
const rawKey = (id: string, filename: string) =>
  `tunes/${id}/${filename.replace(/[^\w.\-]+/g, "_")}`;

/* ------------------------------------------------------------------ *
 * Local filesystem backend (dev fallback)
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const localPath = (key: string) => path.join(DATA_DIR, key);

async function localRead(key: string): Promise<string | null> {
  try {
    return await fs.readFile(localPath(key), "utf-8");
  } catch {
    return null;
  }
}

async function localWrite(key: string, body: string | Buffer): Promise<string> {
  const p = localPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body);
  return `/local-blob/${key}`; // not publicly served; raw download disabled in local mode
}

async function localDelete(prefix: string): Promise<void> {
  const p = localPath(prefix);
  await fs.rm(p, { force: true }).catch(() => {});
  await fs.rm(p.replace(/\.json$/, ""), { recursive: true, force: true }).catch(() => {});
}

/* ------------------------------------------------------------------ *
 * Blob backend
 * ------------------------------------------------------------------ */

async function blobReadJson(key: string): Promise<string | null> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: key, token: TOKEN });
  const hit = blobs.find((b) => b.pathname === key);
  if (!hit) return null;
  const res = await fetch(hit.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.text();
}

async function blobWrite(
  key: string,
  body: string | Buffer,
  contentType: string,
): Promise<string> {
  const { put } = await import("@vercel/blob");
  const { url } = await put(key, body, {
    access: "public",
    token: TOKEN,
    contentType,
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return url;
}

async function blobDeletePrefix(prefix: string): Promise<void> {
  const { list, del } = await import("@vercel/blob");
  const { blobs } = await list({ prefix, token: TOKEN });
  if (blobs.length) await del(blobs.map((b) => b.url), { token: TOKEN });
}

/* ------------------------------------------------------------------ *
 * Unified helpers
 * ------------------------------------------------------------------ */

async function readJson<T>(key: string): Promise<T | null> {
  const raw = useBlob ? await blobReadJson(key) : await localRead(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export async function listTunes(): Promise<TuneIndexEntry[]> {
  const index = (await readJson<TuneIndexEntry[]>(INDEX_KEY)) ?? [];
  return index.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function getTune(id: string): Promise<TuneRecord | null> {
  return readJson<TuneRecord>(recordKey(id));
}

async function writeIndex(index: TuneIndexEntry[]): Promise<void> {
  const body = JSON.stringify(index);
  if (useBlob) await blobWrite(INDEX_KEY, body, "application/json");
  else await localWrite(INDEX_KEY, body);
}

export function toIndexEntry(
  record: TuneRecord,
  summary: {
    device?: string;
    pcTool?: string;
    savedAt?: string;
    configuredOutputs: number;
    totalEqBands: number;
    hasSub: boolean;
  },
): TuneIndexEntry {
  return {
    id: record.id,
    title: record.title,
    vehicle: record.vehicle,
    sourceFilename: record.sourceFilename,
    format: record.format,
    uploadedAt: record.uploadedAt,
    ...summary,
  };
}

export interface SaveTuneInput {
  id: string;
  title: string;
  vehicle?: string;
  notes?: string;
  sourceFilename: string;
  format: TuneFormat;
  tune: DecodedTune;
  /** Raw .pct6 bytes to archive alongside, when the upload was a .pct6. */
  rawBytes?: Buffer;
  indexEntry: Omit<TuneIndexEntry, "id" | "title" | "vehicle" | "sourceFilename" | "format" | "uploadedAt">;
}

export async function saveTune(input: SaveTuneInput): Promise<TuneRecord> {
  const uploadedAt = new Date().toISOString();
  let rawUrl: string | undefined;

  if (input.rawBytes && useBlob) {
    rawUrl = await blobWrite(
      rawKey(input.id, input.sourceFilename),
      input.rawBytes,
      "application/octet-stream",
    );
  } else if (input.rawBytes) {
    rawUrl = await localWrite(rawKey(input.id, input.sourceFilename), input.rawBytes);
  }

  const record: TuneRecord = {
    id: input.id,
    title: input.title,
    vehicle: input.vehicle,
    notes: input.notes,
    sourceFilename: input.sourceFilename,
    format: input.format,
    rawUrl,
    uploadedAt,
    tune: input.tune,
  };

  const body = JSON.stringify(record);
  if (useBlob) await blobWrite(recordKey(input.id), body, "application/json");
  else await localWrite(recordKey(input.id), body);

  const index = (await readJson<TuneIndexEntry[]>(INDEX_KEY)) ?? [];
  const entry: TuneIndexEntry = {
    id: input.id,
    title: input.title,
    vehicle: input.vehicle,
    sourceFilename: input.sourceFilename,
    format: input.format,
    uploadedAt,
    ...input.indexEntry,
  };
  const next = [entry, ...index.filter((e) => e.id !== input.id)];
  await writeIndex(next);

  return record;
}

export async function deleteTune(id: string): Promise<void> {
  if (useBlob) {
    await blobDeletePrefix(recordKey(id));
    await blobDeletePrefix(`tunes/${id}/`);
  } else {
    await localDelete(recordKey(id));
  }
  const index = (await readJson<TuneIndexEntry[]>(INDEX_KEY)) ?? [];
  await writeIndex(index.filter((e) => e.id !== id));
}

export function storageMode(): "blob" | "local" {
  return useBlob ? "blob" : "local";
}
