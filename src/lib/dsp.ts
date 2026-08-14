/**
 * Modeled magnitude response for a channel, for visualization.
 *
 * Peaking EQ bands use the standard RBJ biquad magnitude at the DSP's native
 * 96 kHz. Crossovers are drawn as idealized Butterworth-shaped roll-offs whose
 * order is derived from the stored slope (order = |dB per octave| / 6). This is
 * a faithful *shape* — corner and slope are exact — not a bit-accurate model of
 * the specific alignment (Bessel/Linkwitz phase differences aren't shown).
 */
import type { Channel, Filter } from "./pct6/types";

const FS = 96000;
const TWO_PI = Math.PI * 2;

/** Log-spaced frequency axis (Hz). */
export function logFreqs(min = 20, max = 20000, count = 240): number[] {
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  const step = (lmax - lmin) / (count - 1);
  return Array.from({ length: count }, (_, i) => 10 ** (lmin + i * step));
}

/** RBJ peaking-EQ biquad magnitude in dB at frequency f. */
function peakingDb(f: number, f0: number, gainDb: number, q: number): number {
  if (gainDb === 0) return 0;
  const A = 10 ** (gainDb / 40);
  const w0 = (TWO_PI * f0) / FS;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const alpha = sw / (2 * Math.max(q, 1e-6));

  const b0 = 1 + alpha * A;
  const b1 = -2 * cw;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * cw;
  const a2 = 1 - alpha / A;

  const w = (TWO_PI * f) / FS;
  // |H(e^jw)| via cos/sin sums.
  const cos1 = Math.cos(w);
  const cos2 = Math.cos(2 * w);
  const sin1 = Math.sin(w);
  const sin2 = Math.sin(2 * w);

  const numRe = b0 + b1 * cos1 + b2 * cos2;
  const numIm = -(b1 * sin1 + b2 * sin2);
  const denRe = a0 + a1 * cos1 + a2 * cos2;
  const denIm = -(a1 * sin1 + a2 * sin2);

  const numMag = Math.hypot(numRe, numIm);
  const denMag = Math.hypot(denRe, denIm);
  return 20 * Math.log10(numMag / denMag);
}

/** Idealized crossover magnitude in dB. Filter.gain_db carries the slope. */
function crossoverDb(f: number, filter: Filter): number {
  const order = Math.max(1, Math.round(Math.abs(filter.gain_db) / 6));
  const ratio = f / filter.freq_hz;
  if (filter.kind === "lowpass") {
    return -10 * Math.log10(1 + ratio ** (2 * order));
  }
  if (filter.kind === "highpass") {
    const inv = filter.freq_hz / f;
    return -10 * Math.log10(1 + inv ** (2 * order));
  }
  return 0;
}

/**
 * Total modeled response (dB) for a channel across the given frequencies:
 * crossovers + active peaking bands. Channel gain is intentionally excluded so
 * the curve shows filter shape, matching how tuning software plots the EQ.
 */
export function channelResponseDb(ch: Channel, freqs: number[]): number[] {
  return freqs.map((f) => {
    let db = 0;
    if (ch.highpass) db += crossoverDb(f, ch.highpass);
    if (ch.lowpass) db += crossoverDb(f, ch.lowpass);
    for (const band of ch.eq_bands) {
      db += peakingDb(f, band.freq_hz, band.gain_db, band.q);
    }
    return db;
  });
}

/** Response of a single peaking band alone (for per-band overlays). */
export function bandResponseDb(band: Filter, freqs: number[]): number[] {
  return freqs.map((f) => peakingDb(f, band.freq_hz, band.gain_db, band.q));
}

export interface ResponseExtent {
  min: number;
  max: number;
}

/** Nice symmetric-ish dB extent for a set of curves, padded and clamped. */
export function responseExtent(curves: number[][], floor = -18, ceil = 18): ResponseExtent {
  let lo = 0;
  let hi = 0;
  for (const c of curves) {
    for (const v of c) {
      if (Number.isFinite(v)) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  }
  lo = Math.max(floor, Math.floor((lo - 2) / 3) * 3);
  hi = Math.min(ceil, Math.ceil((hi + 2) / 3) * 3);
  if (hi - lo < 12) {
    const mid = (hi + lo) / 2;
    lo = mid - 6;
    hi = mid + 6;
  }
  return { min: lo, max: hi };
}
