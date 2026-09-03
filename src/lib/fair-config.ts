const LOCAL_ORIGIN = "http://localhost:3000";

function readEnvironment(name: string) {
  return process.env[name]?.trim() || "";
}

function isMockDelivery() {
  return process.env.NODE_ENV !== "production" && process.env.ZHOTOVENO_MOCK_EMAILS === "1";
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:");
  } catch {
    return false;
  }
}

export function getFairConfig() {
  return {
    databasePath: readEnvironment("FAIR_DB_PATH") || ".local-data/fair-reminders.sqlite",
    eventName: readEnvironment("FAIR_EVENT_NAME") || "veletrh",
    origin: readEnvironment("FAIR_ORIGIN") || (process.env.NODE_ENV === "production" ? "" : LOCAL_ORIGIN),
    ipHashSecret: readEnvironment("FAIR_IP_HASH_SECRET") || readEnvironment("REGISTRATIONS_SESSION_SECRET"),
    consentVersion: "1",
    retentionDays: 365,
    mockDelivery: isMockDelivery(),
  };
}

export function getProductionConfigError() {
  if (process.env.NODE_ENV !== "production") return null;
  const config = getFairConfig();
  if (!config.origin || !config.ipHashSecret) return "missing fair security configuration";
  if (!getAdminConfig().keyHash || !getAdminConfig().sessionSecret) return "missing fair admin configuration";
  if (!getReminderUrls()) return "invalid reminder URL configuration";
  if (!readEnvironment("BREVO_API_KEY") || !readEnvironment("BREVO_SENDER_EMAIL") || !readEnvironment("BREVO_SENDER_NAME")) return "missing mail configuration";
  return null;
}

export function getReminderUrls() {
  const urls = {
    web: readEnvironment("NEXT_PUBLIC_ZHOTOVENO_WEB_URL"),
    appStore: readEnvironment("NEXT_PUBLIC_APP_STORE_URL"),
    googlePlay: readEnvironment("NEXT_PUBLIC_GOOGLE_PLAY_URL"),
    privacy: readEnvironment("NEXT_PUBLIC_PRIVACY_URL"),
  };

  if (isMockDelivery()) return urls;
  if (Object.values(urls).some((value) => !isValidHttpUrl(value))) return null;
  return urls;
}

export function getAdminConfig() {
  return {
    keyHash: readEnvironment("FAIR_ADMIN_KEY_HASH") || readEnvironment("REGISTRATIONS_ADMIN_KEY_HASH"),
    sessionSecret: readEnvironment("FAIR_ADMIN_SESSION_SECRET") || readEnvironment("REGISTRATIONS_SESSION_SECRET"),
  };
}
