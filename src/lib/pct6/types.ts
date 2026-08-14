/**
 * TypeScript shapes for a decoded Audiotec Fischer .pct6 tune.
 *
 * These mirror the canonical JSON Schema published by pct6-tools:
 *   schema/v1/pct6-tune.schema.json
 * (kept in ./../../../reference/pct6-tune.schema.json). v1 is additive-only,
 * so these types are safe to pin against long-term.
 */

export const PCT6_SCHEMA_URL =
  "https://raw.githubusercontent.com/sl463/pct6-tools/main/schema/v1/pct6-tune.schema.json";

export type ContainerMode =
  | "no compression"
  | "compression only (no obfuscation)"
  | "V6 obfuscation"
  | "V6 keypass obfuscation"
  | "AFPX legacy obfuscation";

export type FilterKind = "unused" | "lowpass" | "highpass" | "peak" | "unknown";

export interface Filter {
  /** Raw <Fil T="..."> attribute. */
  type_id: number;
  kind: FilterKind;
  /** Human-readable name for type_id, e.g. "Lowpass Linkwitz". */
  label: string;
  /** Corner (crossover) or center (peak) frequency in Hz. */
  freq_hz: number;
  /** peak: band gain in dB. lowpass/highpass: slope in dB/oct (negative). */
  gain_db: number;
  q: number;
  bypassed: boolean;
}

export interface Channel {
  role: "output" | "input";
  /** ON (output) or IN (input) attribute; -1 if missing. */
  index: number;
  /** Internal CN attribute. */
  channel_id: number;
  /** Speaker/channel name resolved from channel_id, or null if unknown. */
  channel_name: string | null;
  /** CE flag — output only; null for inputs. */
  enabled: boolean | null;
  eq_bypassed: boolean;
  polarity_inverted: boolean;
  delay_group: string | null;
  link_group: string | null;
  gain_db: number;
  gain_linear: number;
  delay_raw: number;
  delay_ms: number;
  delay_cm: number;
  highpass: Filter | null;
  lowpass: Filter | null;
  /** Active parametric peaking bands only. */
  eq_bands: Filter[];
  eq_band_count: number;
  /** Every source attribute, verbatim. */
  raw_attrib: Record<string, string>;
}

export interface TuneMeta {
  V?: string;
  D?: string;
  Dev?: string;
  FN?: string;
  INS?: string;
  OUTS?: string;
  [key: string]: string | undefined;
}

export interface DecodedTune {
  $schema: string;
  source_file: string;
  decoder: string;
  container_mode: ContainerMode;
  xml_bytes: number;
  meta: TuneMeta;
  outputs: Channel[];
  inputs: Channel[];
  labels?: {
    description?: string;
    by_output_index?: Record<string, { role?: string; side?: string }>;
  };
}
