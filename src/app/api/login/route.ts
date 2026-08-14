import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, credentialsMatch, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

function safeNext(next: string | null): string {
  // Only allow same-site relative paths to protected areas.
  if (next && /^\/(admin|upload)(\/|$)/.test(next)) return next;
  return "/admin";
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const username = ((form?.get("username") as string | null) ?? "").trim();
  const password = (form?.get("password") as string | null) ?? "";
  const next = safeNext(form?.get("next") as string | null);

  if (!credentialsMatch(username, password)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await createSessionToken();
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set({ ...sessionCookieOptions, value: token });
  return res;
}
