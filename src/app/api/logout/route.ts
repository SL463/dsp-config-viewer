import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  res.cookies.set({ ...sessionCookieOptions, value: "", maxAge: 0 });
  return res;
}
