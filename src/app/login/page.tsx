import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { Waveform } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in · DSP Tune Viewer",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const cls =
    "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 sm:px-6">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
        <Waveform className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Admin sign in</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">Sign in to upload and manage tunes.</p>

      <Card className="mt-6 w-full p-5">
        <form action="/api/login" method="post" className="space-y-3">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Username</span>
            <input type="text" name="username" autoComplete="username" autoFocus required className={cls} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input type="password" name="password" autoComplete="current-password" required className={cls} />
          </label>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,transparent)] px-3 py-2 text-sm text-destructive">
              Incorrect username or password.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </Card>
    </div>
  );
}
