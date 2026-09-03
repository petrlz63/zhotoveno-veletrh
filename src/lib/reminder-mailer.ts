import { getReminderUrls, getFairConfig } from "@/lib/fair-config";

const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

type SendReminderInput = { toEmail: string };
type SendReminderResult = { ok: true; providerMessageId: string | null } | { ok: false; errorCode: "configuration" | "rejected" | "unavailable" };

function htmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildReminderText(urls: NonNullable<ReturnType<typeof getReminderUrls>>) {
  return [
    "Dobrý den,",
    "",
    "děkujeme, že jste se u nás zastavili. Jak jsme slíbili, posíláme vám připomenutí služby Zhotoveno.",
    "",
    "Otevřete Zhotoveno na webu nebo v mobilní aplikaci a přihlaste se pomocí svého e-mailu. Přihlášení potvrdíte jednorázovým kódem, který vám zašleme e-mailem.",
    "",
    "Po přihlášení vás provedeme vytvořením firemního profilu, ve kterém doplníte údaje o firmě, své obory a specializace. Díky tomu vám budeme moci zobrazovat relevantní poptávky.",
    "",
    `Začít na webu: ${urls.web}`,
    `Stáhnout v App Store: ${urls.appStore}`,
    `Stáhnout na Google Play: ${urls.googlePlay}`,
    "",
    "Těšíme se na spolupráci.",
    "Tým Zhotoveno",
    "Stačí poptat. Zhotoveno.",
    "",
    "Tento e-mail jste obdrželi, protože jste si při osobním setkání s týmem Zhotoveno nechali zaslat připomenutí naší služby.",
  ].join("\n");
}

export function buildReminderHtml(urls: NonNullable<ReturnType<typeof getReminderUrls>>) {
  const webUrl = htmlEscape(urls.web);
  const appStoreUrl = htmlEscape(urls.appStore);
  const googlePlayUrl = htmlEscape(urls.googlePlay);
  return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Zhotoveno pro firmy</title></head>
<body style="margin:0;background:#f7fbff;color:#061634;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
    <div style="background:#ffffff;border:1px solid #d7e8f7;border-radius:24px;overflow:hidden;">
      <div style="padding:28px 32px;background:#e9f6fe;"><p style="margin:0;color:#0969f3;font-size:14px;font-weight:700;">Zhotoveno pro firmy</p><h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Děkujeme za setkání</h1></div>
      <div style="padding:32px;font-size:16px;line-height:1.65;">
        <p style="margin:0 0 18px;">Dobrý den,</p>
        <p style="margin:0 0 18px;">děkujeme, že jste se u nás zastavili. Jak jsme slíbili, posíláme vám připomenutí služby Zhotoveno.</p>
        <p style="margin:0 0 18px;">Otevřete Zhotoveno na webu nebo v mobilní aplikaci a přihlaste se pomocí svého e-mailu. Přihlášení potvrdíte jednorázovým kódem, který vám zašleme e-mailem.</p>
        <p style="margin:0 0 24px;">Po přihlášení vás provedeme vytvořením firemního profilu, ve kterém doplníte údaje o firmě, své obory a specializace. Díky tomu vám budeme moci zobrazovat relevantní poptávky.</p>
        <p style="margin:0 0 24px;"><a href="${webUrl}" style="display:inline-block;background:#0969f3;border-radius:12px;color:#ffffff;font-weight:700;padding:14px 22px;text-decoration:none;">Začít na webu</a></p>
        <p style="margin:0 0 8px;"><a href="${appStoreUrl}" style="color:#075bd8;font-weight:700;">Stáhnout v App Store</a></p>
        <p style="margin:0 0 24px;"><a href="${googlePlayUrl}" style="color:#075bd8;font-weight:700;">Stáhnout na Google Play</a></p>
        <p style="margin:0 0 2px;">Těšíme se na spolupráci.</p><p style="margin:0;">Tým Zhotoveno<br>Stačí poptat. Zhotoveno.</p>
      </div>
      <div style="padding:20px 32px;background:#f7fbff;border-top:1px solid #d7e8f7;color:#4d5d78;font-size:12px;line-height:1.55;">Tento e-mail jste obdrželi, protože jste si při osobním setkání s týmem Zhotoveno nechali zaslat připomenutí naší služby.</div>
    </div>
  </div>
</body></html>`;
}

export async function sendReminderEmail({ toEmail }: SendReminderInput): Promise<SendReminderResult> {
  const fairConfig = getFairConfig();
  const urls = getReminderUrls();
  if (fairConfig.mockDelivery) return { ok: true, providerMessageId: null };
  if (!urls) return { ok: false, errorCode: "configuration" };

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();
  if (!apiKey || !senderEmail || !senderName) return { ok: false, errorCode: "configuration" };

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10_000);
  try {
    const response = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "api-key": apiKey },
      signal: abortController.signal,
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        ...(process.env.BREVO_REPLY_TO_EMAIL?.trim() ? {
          replyTo: {
            email: process.env.BREVO_REPLY_TO_EMAIL.trim(),
            ...(process.env.BREVO_REPLY_TO_NAME?.trim() ? { name: process.env.BREVO_REPLY_TO_NAME.trim() } : {}),
          },
        } : {}),
        to: [{ email: toEmail }],
        subject: "Vyzkoušejte Zhotoveno pro svou firmu",
        textContent: buildReminderText(urls),
        htmlContent: buildReminderHtml(urls),
      }),
    });
    if (!response.ok) return { ok: false, errorCode: response.status >= 500 || response.status === 429 ? "unavailable" : "rejected" };
    const payload = await response.json().catch(() => null) as { messageId?: unknown } | null;
    return { ok: true, providerMessageId: typeof payload?.messageId === "string" ? payload.messageId.slice(0, 255) : null };
  } catch {
    return { ok: false, errorCode: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
