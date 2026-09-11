import type { ReminderRecord } from "@/lib/fair-storage";
import { getFairPreregistrationSyncConfig } from "@/lib/fair-config";

type SyncResult = { ok: true } | { ok: false; reason: "configuration" | "rejected" | "unavailable" };

export async function syncFairPreregistration(record: ReminderRecord): Promise<SyncResult> {
  const config = getFairPreregistrationSyncConfig();
  if (!config) return { ok: false, reason: "configuration" };

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 3_000);
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      signal: abortController.signal,
      body: JSON.stringify({
        sourceSubmissionId: record.submissionId,
        email: record.email,
        companyName: record.companyName,
        industrySlug: record.industrySlug,
        industryLabel: record.industryLabel,
        eventName: record.eventName,
        consentAcceptedAt: record.consentAcceptedAt,
        sourceCreatedAt: record.createdAt,
      }),
    });

    if (!response.ok) return { ok: false, reason: "rejected" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
