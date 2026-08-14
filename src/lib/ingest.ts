/**
 * Ingest an uploaded file into the tune library.
 *
 * Accepts either a raw .pct6 (decoded immediately and archived alongside the
 * JSON) or a pct6-tune-compliant JSON (validated against the v1 schema). The
 * resulting schema-conformant JSON is what gets stored and displayed.
 *
 * Server-only.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { decodePct6 } from "./pct6/decode";
import { validateTuneJson } from "./pct6/validate";
import type { DecodedTune } from "./pct6/types";
import { summarize } from "./tune";
import { saveTune, type TuneRecord } from "./storage";

export class IngestError extends Error {}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/\.[^.]+$/, "") // drop extension
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tune"
  );
}

function newId(title: string): string {
  return `${slugify(title)}-${randomBytes(3).toString("hex")}`;
}

function looksLikeJson(filename: string, bytes: Buffer): boolean {
  if (/\.json$/i.test(filename)) return true;
  const head = bytes.subarray(0, 64).toString("utf-8").trimStart();
  return head.startsWith("{");
}

export interface IngestInput {
  filename: string;
  bytes: Buffer;
  title?: string;
  vehicle?: string;
  notes?: string;
}

export async function ingestFile(input: IngestInput): Promise<TuneRecord> {
  const { filename, bytes } = input;
  if (!bytes || bytes.length === 0) throw new IngestError("The uploaded file is empty.");

  let tune: DecodedTune;
  let format: "pct6" | "json";
  let rawBytes: Buffer | undefined;

  if (looksLikeJson(filename, bytes)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(bytes.toString("utf-8"));
    } catch {
      throw new IngestError("That JSON file could not be parsed.");
    }
    const result = validateTuneJson(parsed);
    if (!result.valid || !result.data) {
      throw new IngestError(
        `JSON does not match the pct6-tune v1 schema:\n${result.errors.join("\n")}`,
      );
    }
    tune = result.data;
    format = "json";
  } else {
    try {
      tune = decodePct6(bytes, filename);
    } catch (e) {
      throw new IngestError(
        `Could not decode this .pct6 file: ${(e as Error).message}`,
      );
    }
    format = "pct6";
    rawBytes = bytes; // archive the original
  }

  const title =
    input.title?.trim() ||
    tune.meta.FN?.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "") ||
    filename.replace(/\.[^.]+$/, "");

  const summary = summarize(tune);
  const id = newId(title);

  return saveTune({
    id,
    title,
    vehicle: input.vehicle?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    sourceFilename: filename,
    format,
    tune,
    rawBytes,
    indexEntry: {
      device: summary.device,
      pcTool: summary.pcTool,
      savedAt: summary.savedAt,
      configuredOutputs: summary.configuredOutputs,
      totalEqBands: summary.totalEqBands,
      hasSub: summary.hasSub,
    },
  });
}
