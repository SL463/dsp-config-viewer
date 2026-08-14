/**
 * Server-side decoder for Audiotec Fischer .pct6 tunes.
 *
 * Port of pct6_extract.py (v1.2.0). Container format:
 *     file = XOR(qCompress(utf-8 XML), key)
 * where qCompress is Qt's format — a 4-byte big-endian uncompressed length
 * followed by a zlib stream — and the key is one of a small set of ASCII
 * literals, tried in the same order PC-Tool 6 tries them.
 *
 * Node-only (uses node:zlib). Import from server code / route handlers.
 */

import { inflateSync } from "node:zlib";
import { XMLParser } from "fast-xml-parser";
import {
  FILTER_TYPES,
  INPUT_CHANNEL_NAMES,
  OUTPUT_CHANNEL_NAMES,
} from "./channelNames";
import {
  PCT6_SCHEMA_URL,
  type Channel,
  type ContainerMode,
  type DecodedTune,
  type Filter,
  type TuneMeta,
} from "./types";

const TOOL_VERSION = "1.2.0"; // matches the pct6-tools decoder we port from
const SAMPLE_RATE = 96000.0; // ACO DSPs run 96 kHz natively
const SPEED_OF_SOUND_CM_S = 34300.0;

// Ordered exactly as PC-Tool 6 tries them.
const KEYS: (Buffer | null)[] = [
  null,
  Buffer.from("ATFV6"),
  Buffer.from("ATFV6P"),
  Buffer.from("ATF"),
];

const MODE_NAMES = new Map<string, ContainerMode>([
  ["null", "compression only (no obfuscation)"],
  ["ATFV6", "V6 obfuscation"],
  ["ATFV6P", "V6 keypass obfuscation"],
  ["ATF", "AFPX legacy obfuscation"],
]);

function xor(data: Buffer, key: Buffer | null): Buffer {
  if (key === null) return data;
  const out = Buffer.allocUnsafe(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
  return out;
}

/** Return the decompressed XML and which container variant matched. */
export function decodeContainer(data: Buffer): { xml: Buffer; mode: ContainerMode } {
  for (const key of KEYS) {
    const blob = xor(data, key);
    try {
      const expected = blob.readUInt32BE(0);
      const out = inflateSync(blob.subarray(4));
      if (out.length !== expected) continue;
      return { xml: out, mode: MODE_NAMES.get(key === null ? "null" : key.toString())! };
    } catch {
      continue;
    }
  }
  // Last resort: the file may be plain XML ("No compression used").
  const trimmed = data.subarray(0, 64).toString("latin1").trimStart();
  if (trimmed.startsWith("<")) return { xml: data, mode: "no compression" };
  throw new Error("failed to detect .pct6 container format");
}

function db(linear: number): number {
  if (linear <= 0) return Number.NEGATIVE_INFINITY;
  return 20.0 * Math.log10(linear);
}

function num(v: unknown, fallback = 0): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function intAttr(attrs: Record<string, string>, key: string, fallback: number): number {
  const v = attrs[key];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  parseAttributeValue: false, // keep as strings, convert ourselves (like the Python)
  trimValues: true,
  isArray: (name) => name === "OC" || name === "IC" || name === "Fil",
});

/** Pull the bare attributes off a parsed element into a plain string map. */
function attribs(el: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(el)) {
    if (k.startsWith("@_")) out[k.slice(2)] = String(v);
  }
  return out;
}

function parseFilter(fil: Record<string, unknown>): Filter {
  const a = attribs(fil);
  const t = intAttr(a, "T", 0);
  const [kind, label] = FILTER_TYPES[t] ?? ["unknown", `unknown type ${t}`];
  return {
    type_id: t,
    kind: kind as Filter["kind"],
    label,
    freq_hz: num(a.F),
    // For peaking bands G is gain in dB; for crossovers it is slope in dB/oct.
    gain_db: num(a.G),
    q: num(a.Q),
    bypassed: a.FilBy === "1",
  };
}

function parseChannel(el: Record<string, unknown>, role: "output" | "input"): Channel {
  const a = attribs(el);
  const fils: Filter[] = Array.isArray(el.Fil)
    ? (el.Fil as Record<string, unknown>[]).map(parseFilter)
    : [];

  const vol = el.Vol as Record<string, unknown> | undefined;
  const time = el.T as Record<string, unknown> | undefined;
  const level = vol ? num((vol as Record<string, string>)["@_L"], 1.0) : 1.0;
  const rawDelay = time ? intAttr(attribs(time), "T", 0) : 0;

  const eq = fils.filter(
    (f) => f.kind === "peak" && !f.bypassed && (f.gain_db !== 0.0 || f.q !== 4.3),
  );

  const channelId = intAttr(a, "CN", -1);
  const table = role === "output" ? OUTPUT_CHANNEL_NAMES : INPUT_CHANNEL_NAMES;

  const highpass =
    fils.find((f) => f.kind === "highpass" && !f.bypassed && f.gain_db !== 0.0) ?? null;
  const lowpass =
    fils.find((f) => f.kind === "lowpass" && !f.bypassed && f.gain_db !== 0.0) ?? null;

  return {
    role,
    index: intAttr(a, role === "output" ? "ON" : "IN", -1),
    channel_id: channelId,
    channel_name: table[channelId] ?? null,
    // <IC> carries no CE flag of its own.
    enabled: role === "output" ? a.CE === "1" : null,
    eq_bypassed: a.EqBy === "1",
    polarity_inverted: a.CINV === "1",
    delay_group: role === "output" ? (a.DG ?? null) : null,
    link_group: role === "output" ? (a.LG ?? null) : null,
    gain_db: db(level),
    gain_linear: level,
    delay_raw: rawDelay,
    delay_ms: (rawDelay / SAMPLE_RATE) * 1000.0,
    delay_cm: (rawDelay / SAMPLE_RATE) * SPEED_OF_SOUND_CM_S,
    highpass,
    lowpass,
    eq_bands: eq,
    eq_band_count: eq.length,
    raw_attrib: a,
  };
}

/**
 * Decode a raw .pct6 file into schema-conformant JSON.
 * @param data raw bytes of the .pct6 file
 * @param sourceFile original filename (recorded in source_file)
 */
export function decodePct6(data: Buffer, sourceFile: string): DecodedTune {
  const { xml, mode } = decodeContainer(data);
  const doc = parser.parse(xml.toString("utf-8"));
  const root = (doc.ATF ?? {}) as Record<string, unknown>;

  const meta: TuneMeta = attribs(root);
  const outputs = (Array.isArray(root.OC) ? (root.OC as Record<string, unknown>[]) : [])
    .map((c) => parseChannel(c, "output"));
  const inputs = (Array.isArray(root.IC) ? (root.IC as Record<string, unknown>[]) : [])
    .map((c) => parseChannel(c, "input"));

  return {
    $schema: PCT6_SCHEMA_URL,
    source_file: sourceFile,
    decoder: `pct6_extract.ts v${TOOL_VERSION}`,
    container_mode: mode,
    xml_bytes: xml.length,
    meta,
    outputs,
    inputs,
  };
}
