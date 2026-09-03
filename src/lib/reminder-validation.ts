import { serviceCategoriesBySlug, type ServiceCategorySlug } from "@/lib/service-categories";

export type ReminderFields = {
  email: string;
  companyName: string;
  industry: string;
  consent: boolean;
  submissionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export type ReminderFieldErrors = Partial<Record<"email" | "companyName" | "industry" | "consent", string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function readNullableString(value: unknown, maxLength: number) {
  const stringValue = readString(value, maxLength);
  return stringValue || null;
}

export function readReminderFields(payload: Record<string, unknown>): ReminderFields {
  return {
    email: readString(payload.email, 254).toLowerCase(),
    companyName: readString(payload.companyName, 150),
    industry: readString(payload.industry, 80),
    consent: payload.consent === true,
    submissionId: readString(payload.submissionId, 64),
    utmSource: readNullableString(payload.utmSource, 120),
    utmMedium: readNullableString(payload.utmMedium, 120),
    utmCampaign: readNullableString(payload.utmCampaign, 120),
  };
}

export function validateReminderFields(fields: ReminderFields): ReminderFieldErrors {
  const errors: ReminderFieldErrors = {};
  if (!fields.email) errors.email = "Zadejte pracovní e-mail.";
  else if (!emailPattern.test(fields.email)) errors.email = "Zadejte e-mail ve správném formátu.";
  if (!serviceCategoriesBySlug.has(fields.industry as ServiceCategorySlug)) errors.industry = "Vyberte hlavní obor ze seznamu.";
  if (!fields.consent) errors.consent = "Potvrďte prosím souhlas se zpracováním údajů.";
  return errors;
}

export function isSubmissionId(value: string) {
  return uuidPattern.test(value);
}
