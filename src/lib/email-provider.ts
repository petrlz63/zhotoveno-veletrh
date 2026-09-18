const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

type EmailProviderConfig = {
  provider: "resend" | "brevo";
  apiKey: string;
  senderEmail: string;
  senderName: string;
  replyToEmail: string | null;
  replyToName: string | null;
};

type EmailMessage = {
  to: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
};

const readEnvironment = (name: string) => process.env[name]?.trim() ?? "";
const formatEmailAddress = (email: string, name?: string | null) => name ? `${name} <${email}>` : email;

export function getEmailProviderConfig(): EmailProviderConfig | null {
  const configuredProvider = readEnvironment("EMAIL_PROVIDER").toLowerCase();
  const provider = configuredProvider || (readEnvironment("RESEND_API_KEY") ? "resend" : "brevo");
  if (provider !== "resend" && provider !== "brevo") return null;

  const prefix = provider === "resend" ? "RESEND" : "BREVO";
  const apiKey = readEnvironment(`${prefix}_API_KEY`);
  const senderEmail = readEnvironment(`${prefix}_SENDER_EMAIL`);
  const senderName = readEnvironment(`${prefix}_SENDER_NAME`);
  if (!apiKey || !senderEmail || !senderName) return null;

  return {
    provider,
    apiKey,
    senderEmail,
    senderName,
    replyToEmail: readEnvironment(`${prefix}_REPLY_TO_EMAIL`) || null,
    replyToName: readEnvironment(`${prefix}_REPLY_TO_NAME`) || null,
  };
}

export function sendEmailViaProvider(
  config: EmailProviderConfig,
  message: EmailMessage,
  options: { signal?: AbortSignal } = {},
) {
  if (config.provider === "resend") {
    return fetch(RESEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      ...(options.signal ? { signal: options.signal } : {}),
      body: JSON.stringify({
        from: formatEmailAddress(config.senderEmail, config.senderName),
        ...(config.replyToEmail ? { reply_to: formatEmailAddress(config.replyToEmail, config.replyToName) } : {}),
        to: message.to,
        ...(message.bcc?.length ? { bcc: message.bcc } : {}),
        subject: message.subject,
        ...(message.text !== undefined ? { text: message.text } : {}),
        ...(message.html !== undefined ? { html: message.html } : {}),
      }),
    });
  }

  return fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "api-key": config.apiKey,
    },
    ...(options.signal ? { signal: options.signal } : {}),
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      ...(config.replyToEmail ? {
        replyTo: {
          email: config.replyToEmail,
          ...(config.replyToName ? { name: config.replyToName } : {}),
        },
      } : {}),
      to: message.to.map((email) => ({ email })),
      ...(message.bcc?.length ? { bcc: message.bcc.map((email) => ({ email })) } : {}),
      subject: message.subject,
      ...(message.text !== undefined ? { textContent: message.text } : {}),
      ...(message.html !== undefined ? { htmlContent: message.html } : {}),
    }),
  });
}
