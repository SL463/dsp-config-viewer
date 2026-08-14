import Link from "next/link";
import type { TuneIndexEntry } from "@/lib/storage";
import { Badge } from "./ui";
import { ArrowRight, Clock, Sliders, Speaker } from "./icons";

export default function TuneCard({ tune }: { tune: TuneIndexEntry }) {
  return (
    <Link
      href={`/tunes/${tune.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl panel p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--glow-primary)]"
    >
      {/* accent wash */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight">{tune.title}</h3>
          {tune.vehicle && <p className="truncate text-sm text-muted-foreground">{tune.vehicle}</p>}
        </div>
        <Badge tone={tune.format === "pct6" ? "primary" : "muted"}>{tune.format}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric icon={<Speaker className="h-4 w-4" />} value={tune.configuredOutputs} label="channels" />
        <Metric icon={<Sliders className="h-4 w-4" />} value={tune.totalEqBands} label="EQ bands" />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          {tune.savedAt ? (
            <>
              <Clock className="h-3.5 w-3.5" /> {tune.savedAt}
            </>
          ) : (
            tune.pcTool && `PC-Tool ${tune.pcTool}`
          )}
          {tune.hasSub && <span className="ml-1 text-sub">· Sub</span>}
        </span>
        <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition group-hover:opacity-100">
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface/60 px-3 py-2">
      <span className="text-primary">{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="font-readout text-lg">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      </span>
    </div>
  );
}
