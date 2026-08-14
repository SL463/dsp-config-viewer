import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { Waveform } from "./icons";

export default async function Header() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const signedIn = await verifySessionToken(token);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Waveform className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">DSP Tune Viewer</span>
          <span className="hidden text-[11px] text-faint sm:inline">HELIX · BRAX · MATCH</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm">
          <NavLink href="/tunes">Library</NavLink>
          <NavLink href="/upload">Upload</NavLink>
          <NavLink href="/admin">Admin</NavLink>
          {signedIn && (
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
      {children}
    </Link>
  );
}
