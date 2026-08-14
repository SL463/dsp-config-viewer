/** Small inline icons; all inherit currentColor so they theme automatically. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function Waveform(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M3 12h2l2-6 3 15 3-19 3 13 2-3h3" />
    </svg>
  );
}

export function Upload(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 15V3m0 0 4 4m-4-4-4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function Trash(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function Speaker(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="12" cy="15" r="3.5" />
      <circle cx="12" cy="6" r="1" />
    </svg>
  );
}

export function ArrowRight(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

export function Check(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Clock(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function Sliders(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h6M14 18h6" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  );
}

export function Polarity(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

export function Search(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
