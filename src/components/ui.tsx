import { clsx } from "clsx";
import type { ReactNode } from "react";

/** A labelled numeric readout (mono, tabular). */
export function Readout({
  label,
  value,
  unit,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</span>
      <span className="font-readout text-lg leading-none" style={accent ? { color: accent } : undefined}>
        {value}
        {unit && <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={
        color
          ? { borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color, background: `color-mix(in srgb, ${color} 12%, transparent)` }
          : undefined
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
  tone?: "muted" | "primary" | "accent" | "invert" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary-muted text-primary border-transparent",
    accent: "bg-[color-mix(in_srgb,hsl(var(--accent))_16%,transparent)] text-accent border-transparent",
    invert: "bg-[color-mix(in_srgb,hsl(var(--invert))_16%,transparent)] text-invert border-transparent",
    success: "bg-[color-mix(in_srgb,hsl(var(--success))_16%,transparent)] text-success border-transparent",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  inset,
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div className={clsx(inset ? "panel-inset" : "panel", "rounded-xl", className)}>{children}</div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>
        )}
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
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
    <Panel inset className="p-4">
      <div className="font-readout text-3xl leading-none" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </Panel>
  );
}
