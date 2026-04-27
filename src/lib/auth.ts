import { createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "armario_auth";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

function getPassword(): string {
  const pw = process.env.AUTH_PASSWORD;
  if (!pw) throw new Error("AUTH_PASSWORD env var not set");
  return pw;
}

export function generateToken(): string {
  const timestamp = Date.now().toString();
  const hmac = createHmac("sha256", getPassword())
    .update(timestamp)
    .digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifyToken(token: string): boolean {
  const sep = token.indexOf(":");
  if (sep === -1) return false;
  const timestamp = token.slice(0, sep);
  const hmac = token.slice(sep + 1);
  if (!timestamp || !hmac) return false;

  const expected = createHmac("sha256", getPassword())
    .update(timestamp)
    .digest("hex");
  if (hmac !== expected) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  if (Date.now() - ts > SESSION_MAX_AGE_MS) return false;

  return true;
}

export function checkPassword(password: string): boolean {
  return password === getPassword();
}

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token)) {
    throw new Error("No autenticado");
  }
}

export { COOKIE_NAME, SESSION_MAX_AGE_S };