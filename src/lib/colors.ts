/** Themed colors for speaker bands — always reference design-system tokens. */
import type { SpeakerBand } from "./tune";

export const bandColor: Record<SpeakerBand, string> = {
  high: "hsl(var(--highpass))",
  mid: "hsl(var(--primary))",
  low: "hsl(var(--cut))",
  sub: "hsl(var(--sub))",
  full: "hsl(var(--accent))",
  other: "hsl(var(--muted-foreground))",
};

export const bandLabel: Record<SpeakerBand, string> = {
  high: "High",
  mid: "Mid",
  low: "Low",
  sub: "Sub",
  full: "Full",
  other: "Aux",
};
