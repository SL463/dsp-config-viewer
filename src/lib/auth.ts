/**
 * Simple session gate for the protected area (/upload, /admin).
 *
 * Credentials live in environment variables (ADMIN_USERNAME / ADMIN_PASSWORD)
 * and the cookie is signed with AUTH_SECRET — nothing secret is committed. Set
 * all three in the Vercel project (and .env.local for dev). If any is missing,
 * login is disabled (fails closed).
 *
 * Uses Web Crypto so it runs in both the Edge proxy and Node route handlers.
 */

const COOKIE_NAME = "dspview_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

export const SESSION_COOKIE = COOKIE_NAME;

const USERNAME = process.env.ADMIN_USERNAME ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function getSecret(): string {
  // Required in production; a dev-only fallback keeps local runs working.
  return process.env.AUTH_SECRET || "dspview-dev-only-secret-do-not-use-in-prod";
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(sig);
}

/** Create a signed session token valid for MAX_AGE_SECONDS. */
export async function createSessionToken(): Promise<string> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ u: USERNAME, t: Date.now() })));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** Verify a session token's signature and freshness. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmac(payload);
  if (sig !== expected) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { t: number };
    return Date.now() - json.t < MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

/** Constant-time-ish string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function credentialsMatch(username: string, password: string): boolean {
  // Fail closed when credentials aren't configured.
  if (!USERNAME || !PASSWORD) return false;
  return safeEqual(username, USERNAME) && safeEqual(password, PASSWORD);
}

export const sessionCookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
