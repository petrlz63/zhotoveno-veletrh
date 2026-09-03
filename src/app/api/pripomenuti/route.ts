import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getFairConfig } from "@/lib/fair-config";
import { beginReminderAttempt, createReminder, getReminder, isRateLimited, markReminderFailed, markReminderSent } from "@/lib/fair-storage";
import { sendReminderEmail } from "@/lib/reminder-mailer";
import { isSubmissionId, readReminderFields, validateReminderFields } from "@/lib/reminder-validation";
import { serviceCategoriesBySlug, type ServiceCategorySlug } from "@/lib/service-categories";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSameOrigin(request: NextRequest) {
  const expectedOrigin = getFairConfig().origin || request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === expectedOrigin;
}

function getIpHash(request: NextRequest) {
  const secret = getFairConfig().ipHashSecret;
  // Caddy appends the directly connected client IP after any untrusted values.
  const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || request.headers.get("x-real-ip")?.trim();
  if (!ip || !secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

function readUserAgent(request: NextRequest) {
  const value = request.headers.get("user-agent")?.trim() || "";
  return value ? value.slice(0, 500) : null;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (!contentType.includes("application/json") || !Number.isFinite(contentLength) || contentLength > 16_384) {
    return response({ ok: false, message: "Odeslaná data nejsou platná." }, 400);
  }
  if (!isSameOrigin(request)) return response({ ok: false, message: "Odeslání z této stránky není povoleno." }, 403);

  let payload: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > 16_384) throw new Error("Payload too large");
      chunks.push(value);
    }
    const body = new TextDecoder().decode(Buffer.concat(chunks));
    const json = JSON.parse(body) as unknown;
    if (!isRecord(json)) throw new Error("Invalid JSON");
    payload = json;
  } catch {
    return response({ ok: false, message: "Odeslaná data nejsou platná." }, 400);
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return response({ ok: false, message: "Připomenutí se nepodařilo odeslat. Zkuste to prosím znovu." }, 400);
  }

  const fields = readReminderFields(payload);
  const errors = validateReminderFields(fields);
  if (!isSubmissionId(fields.submissionId)) return response({ ok: false, message: "Odeslání se nepodařilo ověřit. Obnovte stránku a zkuste to prosím znovu." }, 400);
  if (Object.keys(errors).length) return response({ ok: false, errors }, 400);

  try {
    const existing = getReminder(fields.submissionId);
    if (existing) {
      if (existing.emailStatus === "sent") return response({ ok: true });
      if (existing.emailStatus === "pending" && (existing.emailAttemptCount > 0 || !beginReminderAttempt(fields.submissionId, new Date().toISOString()))) return response({ ok: false, message: "Odeslání se ještě zpracovává. Vyčkejte prosím chvíli a stránku znovu neodesílejte." }, 409);
      if (existing.emailStatus === "failed" && (existing.lastErrorCode !== "rejected" || !beginReminderAttempt(fields.submissionId, new Date().toISOString(), true))) return response({ ok: false, message: "Připomenutí se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu." }, 502);
    }

    if (!existing) {
      const ipHash = getIpHash(request);
      const rateLimitSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      if (isRateLimited(fields.email, ipHash, rateLimitSince)) return NextResponse.json({ ok: false, message: "Odesílání je na chvíli omezené. Zkuste to prosím později." }, { status: 429, headers: { ...noStoreHeaders, "Retry-After": "600" } });
      const industry = serviceCategoriesBySlug.get(fields.industry as ServiceCategorySlug)!;
      const now = new Date().toISOString();
      createReminder({ submissionId: fields.submissionId, email: fields.email, companyName: fields.companyName || null, industrySlug: industry.slug, industryLabel: industry.label, source: "veletrh.zhotoveno.cz", eventName: getFairConfig().eventName, consentAcceptedAt: now, consentVersion: getFairConfig().consentVersion, utmSource: fields.utmSource, utmMedium: fields.utmMedium, utmCampaign: fields.utmCampaign, ipHash, userAgent: readUserAgent(request), createdAt: now });
      if (!beginReminderAttempt(fields.submissionId, now)) return response({ ok: false, message: "Odeslání se ještě zpracovává. Vyčkejte prosím chvíli a stránku znovu neodesílejte." }, 409);
    }

    const delivery = await sendReminderEmail({ toEmail: fields.email });
    if (!delivery.ok) {
      markReminderFailed(fields.submissionId, delivery.errorCode, new Date().toISOString());
      return response({ ok: false, message: "Připomenutí se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu." }, 502);
    }
    markReminderSent(fields.submissionId, delivery.providerMessageId, new Date().toISOString());
    return response({ ok: true });
  } catch {
    // Do not expose database or provider details, which may contain personal data.
    return response({ ok: false, message: "Připomenutí se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu." }, 503);
  }
}
