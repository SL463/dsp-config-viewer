import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("card rounded-lg", className)}>{children}</div>;
}

export function Chip({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={
        color
          ? {
              borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
              color,
              background: `color-mix(in srgb, ${color} 8%, transparent)`,
            }
          : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
      }
    >
      {children}
    </span>
  );
}

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "invert" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary-muted text-primary border-[color-mix(in_srgb,hsl(var(--primary))_25%,transparent)]",
    invert: "bg-[color-mix(in_srgb,hsl(var(--invert))_10%,transparent)] text-invert border-[color-mix(in_srgb,hsl(var(--invert))_25%,transparent)]",
    success: "bg-[color-mix(in_srgb,hsl(var(--success))_10%,transparent)] text-success border-[color-mix(in_srgb,hsl(var(--success))_25%,transparent)]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section title — plain and crisp. */
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** A compact labelled statistic. */
export function Stat({
  value,
  label,
  sub,
  accent,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-3">
      <div className="font-readout text-2xl leading-none" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-faint">{sub}</div>}
    </div>
  );
}

/** Key/value row for spec grids. */
export function KV({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={clsx("truncate text-right text-sm", mono && "font-readout")} title={typeof value === "string" ? value : undefined}>
        {value}
      </span>
    </div>
  );
}
