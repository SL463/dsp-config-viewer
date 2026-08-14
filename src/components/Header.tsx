import Link from "next/link";
import { Waveform } from "./icons";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-muted text-primary ring-1 ring-primary/30 transition group-hover:shadow-[var(--glow-primary)]">
            <Waveform className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">DSP Tune Viewer</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-faint">HELIX · BRAX · MATCH</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/tunes">Library</NavLink>
          <NavLink href="/upload">Upload</NavLink>
          <NavLink href="/admin">Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
