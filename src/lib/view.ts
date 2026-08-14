/**
 * Server-side view-models: precompute everything the client visual components
 * need (response curves, formatted values, colors) so the client bundle stays
 * light and does no DSP math.
 */
import { channelResponseDb } from "./dsp";
import { bandColor, bandLabel } from "./colors";
import {
  filterFamily,
  formatGain,
  isConfigured,
  slopeLabel,
  speakerBand,
  speakerName,
  type SpeakerBand,
} from "./tune";
import type { Channel } from "./pct6/types";

export interface XoverView {
  freqHz: number;
  slope: string;
  family: string;
}

export interface EqBandView {
  freqHz: number;
  gainDb: number;
  q: number;
}

export interface ChannelView {
  index: number;
  speaker: string;
  band: SpeakerBand;
  bandLabel: string;
  color: string;
  gainDb: number;
  gainText: string;
  delayMs: number;
  delayCm: number;
  delayRaw: number;
  polarityInverted: boolean;
  eqBypassed: boolean;
  enabled: boolean | null;
  highpass: XoverView | null;
  lowpass: XoverView | null;
  eqBands: EqBandView[];
  eqBandCount: number;
  curve: number[];
  hasResponse: boolean;
  configured: boolean;
}

function xoverView(f: Channel["highpass"]): XoverView | null {
  if (!f) return null;
  return { freqHz: f.freq_hz, slope: slopeLabel(f.gain_db), family: filterFamily(f.label) };
}

export function channelView(ch: Channel, freqs: number[]): ChannelView {
  const band = speakerBand(ch);
  const hasResponse = ch.highpass !== null || ch.lowpass !== null || ch.eq_band_count > 0;
  return {
    index: ch.index,
    speaker: speakerName(ch),
    band,
    bandLabel: bandLabel[band],
    color: bandColor[band],
    gainDb: ch.gain_db,
    gainText: formatGain(ch.gain_db),
    delayMs: ch.delay_ms,
    delayCm: ch.delay_cm,
    delayRaw: ch.delay_raw,
    polarityInverted: ch.polarity_inverted,
    eqBypassed: ch.eq_bypassed,
    enabled: ch.enabled,
    highpass: xoverView(ch.highpass),
    lowpass: xoverView(ch.lowpass),
    eqBands: ch.eq_bands.map((b) => ({ freqHz: b.freq_hz, gainDb: b.gain_db, q: b.q })),
    eqBandCount: ch.eq_band_count,
    curve: hasResponse ? channelResponseDb(ch, freqs) : freqs.map(() => 0),
    hasResponse,
    configured: isConfigured(ch),
  };
}
