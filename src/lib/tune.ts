/**
 * Presentation helpers over a decoded tune: which channels to show, how to
 * format the numbers, and small derived summaries used across the UI.
 */
import type { Channel, DecodedTune } from "./pct6/types";

/**
 * A channel "carries settings" if it has any EQ bands, a crossover, delay, or
 * non-zero gain — the same test the reference tool uses to decide what's real.
 */
export function isConfigured(ch: Channel): boolean {
  return (
    ch.eq_band_count > 0 ||
    ch.highpass !== null ||
    ch.lowpass !== null ||
    ch.delay_raw !== 0 ||
    Math.abs(ch.gain_db) > 1e-9
  );
}

/** Has a speaker assigned (not CN 0) but no settings dialled in yet. */
export function isAssignedButUntuned(ch: Channel): boolean {
  return !isConfigured(ch) && ch.channel_id !== 0;
}

/** Truly empty: no speaker assigned and no settings. */
export function isUnassigned(ch: Channel): boolean {
  return ch.channel_id === 0 && !isConfigured(ch);
}

/**
 * Channels to display. By default only configured channels are shown
 * (unconfigured channels are hidden, per requirement). With showAll, also
 * include assigned-but-untuned channels; never show fully-unassigned ones.
 */
export function visibleChannels(channels: Channel[], showAll = false): Channel[] {
  return channels.filter((c) =>
    showAll ? isConfigured(c) || isAssignedButUntuned(c) : isConfigured(c),
  );
}

export function speakerName(ch: Channel): string {
  return ch.channel_name || `CN ${ch.channel_id}`;
}

export function formatGain(db: number): string {
  if (!Number.isFinite(db)) return "−∞";
  const sign = db > 0 ? "+" : db < 0 ? "−" : "";
  return `${sign}${Math.abs(db).toFixed(1)}`;
}

export function formatDelayMs(ms: number): string {
  return ms.toFixed(2);
}

export function formatFreq(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 2)}k`;
  return `${Math.round(hz)}`;
}

export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return `${Math.round(hz)} Hz`;
}

/** Short slope label, e.g. "24 dB/oct". gain_db on a crossover holds the slope. */
export function slopeLabel(slopeDb: number): string {
  return `${Math.abs(Math.round(slopeDb))} dB/oct`;
}

/** Filter family name, e.g. "Linkwitz" from "Lowpass Linkwitz". */
export function filterFamily(label: string): string {
  const parts = label.split(" ");
  return parts[parts.length - 1];
}

export interface TuneSummary {
  device?: string;
  pcTool?: string;
  savedAt?: string;
  configuredOutputs: number;
  totalOutputs: number;
  configuredInputs: number;
  totalInputs: number;
  totalEqBands: number;
  hasSub: boolean;
}

/** Parse PC-Tool's DDMMYYYYHHmm timestamp into a Date, if well-formed. */
export function parseSavedDate(d?: string): Date | null {
  if (!d || !/^\d{12}$/.test(d)) return null;
  const day = +d.slice(0, 2);
  const month = +d.slice(2, 4);
  const year = +d.slice(4, 8);
  const hour = +d.slice(8, 10);
  const min = +d.slice(10, 12);
  const dt = new Date(year, month - 1, day, hour, min);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function summarize(tune: DecodedTune): TuneSummary {
  const configuredOut = tune.outputs.filter(isConfigured);
  const configuredIn = tune.inputs.filter(isConfigured);
  const savedDate = parseSavedDate(tune.meta.D);
  return {
    device: tune.meta.Dev,
    pcTool: tune.meta.V,
    savedAt: savedDate
      ? savedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : undefined,
    configuredOutputs: configuredOut.length,
    totalOutputs: tune.outputs.length,
    configuredInputs: configuredIn.length,
    totalInputs: tune.inputs.length,
    totalEqBands: configuredOut.reduce((n, c) => n + c.eq_band_count, 0),
    hasSub: configuredOut.some((c) => /sub/i.test(c.channel_name ?? "")),
  };
}

/** Coarse band a channel covers, for grouping/colour: high / mid / low / sub / full. */
export type SpeakerBand = "high" | "mid" | "low" | "sub" | "full" | "other";

export function speakerBand(ch: Channel): SpeakerBand {
  const n = (ch.channel_name ?? "").toLowerCase();
  if (n.includes("sub")) return "sub";
  if (n.includes("high")) return "high";
  if (n.includes("mid")) return "mid";
  if (n.includes("low")) return "low";
  if (n.includes("full")) return "full";
  return "other";
}
