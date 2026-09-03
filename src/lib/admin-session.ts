import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getAdminConfig } from "@/lib/fair-config";

const cookieName = "fair_admin_session";
const cookiePath = "/admin";
const sessionTtlSeconds = 12 * 60 * 60;

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.byteLength === rightBuffer.byteLength && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyAdminKey(key: string) {
  const expectedHash = getAdminConfig().keyHash.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  return timingSafeStringEqual(createHash("sha256").update(key).digest("hex"), expectedHash);
}

export async function isAdminSessionValid() {
  const secret = getAdminConfig().sessionSecret;
  const token = (await cookies()).get(cookieName)?.value;
  if (!secret || !token) return false;
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart || !timingSafeStringEqual(sign(payloadPart, secret), signaturePart)) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as { role?: unknown; exp?: unknown };
    return payload.role === "fair-admin" && typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const secret = getAdminConfig().sessionSecret;
  if (!secret) return false;
  const exp = Math.floor(Date.now() / 1000) + sessionTtlSeconds;
  const payload = Buffer.from(JSON.stringify({ role: "fair-admin", exp }), "utf8").toString("base64url");
  (await cookies()).set({ name: cookieName, value: `${payload}.${sign(payload, secret)}`, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: cookiePath, expires: new Date(exp * 1000) });
  return true;
}

export async function clearAdminSession() {
  (await cookies()).set({ name: cookieName, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: cookiePath, expires: new Date(0) });
}
