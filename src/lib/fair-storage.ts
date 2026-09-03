import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { getFairConfig } from "@/lib/fair-config";

export type ReminderStatus = "pending" | "sent" | "failed";

export type ReminderRecord = {
  submissionId: string;
  email: string;
  companyName: string | null;
  industrySlug: string;
  industryLabel: string;
  source: string;
  eventName: string;
  consentAcceptedAt: string;
  consentVersion: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type ReminderListRecord = ReminderRecord & {
  id: number;
  emailStatus: ReminderStatus;
  emailAttemptCount: number;
  providerMessageId: string | null;
  lastErrorCode: string | null;
  sentAt: string | null;
  updatedAt: string;
};

let database: Database.Database | null = null;
let activePath: string | null = null;

function getDatabase() {
  const path = getFairConfig().databasePath;
  if (database && activePath === path) return database;
  if (database) database.close();

  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS fair_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      company_name TEXT,
      industry_slug TEXT NOT NULL,
      industry_label TEXT NOT NULL,
      source TEXT NOT NULL,
      event_name TEXT NOT NULL,
      consent_accepted_at TEXT NOT NULL,
      consent_version TEXT NOT NULL,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      email_status TEXT NOT NULL CHECK (email_status IN ('pending', 'sent', 'failed')),
      email_attempt_count INTEGER NOT NULL DEFAULT 0,
      provider_message_id TEXT,
      last_error_code TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS fair_reminders_created_at_idx ON fair_reminders (created_at);
    CREATE INDEX IF NOT EXISTS fair_reminders_email_created_at_idx ON fair_reminders (email, created_at);
    CREATE INDEX IF NOT EXISTS fair_reminders_ip_created_at_idx ON fair_reminders (ip_hash, created_at);
  `);
  const retentionSince = new Date(Date.now() - getFairConfig().retentionDays * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM fair_reminders WHERE created_at < ?").run(retentionSince);
  database = db;
  activePath = path;
  return db;
}

function rowToRecord(row: Record<string, unknown>): ReminderListRecord {
  return {
    id: row.id as number,
    submissionId: row.submission_id as string,
    email: row.email as string,
    companyName: row.company_name as string | null,
    industrySlug: row.industry_slug as string,
    industryLabel: row.industry_label as string,
    source: row.source as string,
    eventName: row.event_name as string,
    consentAcceptedAt: row.consent_accepted_at as string,
    consentVersion: row.consent_version as string,
    utmSource: row.utm_source as string | null,
    utmMedium: row.utm_medium as string | null,
    utmCampaign: row.utm_campaign as string | null,
    ipHash: row.ip_hash as string | null,
    userAgent: row.user_agent as string | null,
    emailStatus: row.email_status as ReminderStatus,
    emailAttemptCount: row.email_attempt_count as number,
    providerMessageId: row.provider_message_id as string | null,
    lastErrorCode: row.last_error_code as string | null,
    sentAt: row.sent_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createReminder(record: ReminderRecord) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO fair_reminders (
      submission_id, email, company_name, industry_slug, industry_label, source, event_name,
      consent_accepted_at, consent_version, utm_source, utm_medium, utm_campaign, ip_hash,
      user_agent, email_status, created_at, updated_at
    ) VALUES (
      @submissionId, @email, @companyName, @industrySlug, @industryLabel, @source, @eventName,
      @consentAcceptedAt, @consentVersion, @utmSource, @utmMedium, @utmCampaign, @ipHash,
      @userAgent, 'pending', @createdAt, @createdAt
    )
  `).run(record);
}

export function getReminder(submissionId: string) {
  const row = getDatabase().prepare("SELECT * FROM fair_reminders WHERE submission_id = ?").get(submissionId) as Record<string, unknown> | undefined;
  return row ? rowToRecord(row) : null;
}

export function markReminderSent(submissionId: string, providerMessageId: string | null, now: string) {
  getDatabase().prepare(`
    UPDATE fair_reminders
    SET email_status = 'sent',
      provider_message_id = @providerMessageId, last_error_code = NULL, sent_at = @now, updated_at = @now
    WHERE submission_id = @submissionId
  `).run({ submissionId, providerMessageId, now });
}

export function markReminderFailed(submissionId: string, errorCode: string, now: string) {
  getDatabase().prepare(`
    UPDATE fair_reminders
    SET email_status = 'failed',
      last_error_code = @errorCode, updated_at = @now
    WHERE submission_id = @submissionId
  `).run({ submissionId, errorCode, now });
}

export function beginReminderAttempt(submissionId: string, now: string, retryRejected = false) {
  const db = getDatabase();
  const result = retryRejected
    ? db.prepare(`UPDATE fair_reminders SET email_status = 'pending', email_attempt_count = email_attempt_count + 1, last_error_code = NULL, updated_at = @now WHERE submission_id = @submissionId AND email_status = 'failed' AND last_error_code = 'rejected' AND email_attempt_count < 2`).run({ submissionId, now })
    : db.prepare(`UPDATE fair_reminders SET email_attempt_count = 1, updated_at = @now WHERE submission_id = @submissionId AND email_status = 'pending' AND email_attempt_count = 0`).run({ submissionId, now });
  return result.changes === 1;
}

export function checkFairStorageHealth() {
  getDatabase().prepare("SELECT 1").get();
}

export function isRateLimited(email: string, ipHash: string | null, since: string) {
  const db = getDatabase();
  const emailCount = db.prepare("SELECT COUNT(*) AS count FROM fair_reminders WHERE email = ? AND created_at >= ?").get(email, since) as { count: number };
  if (emailCount.count >= 2) return true;
  if (!ipHash) return false;
  const ipCount = db.prepare("SELECT COUNT(*) AS count FROM fair_reminders WHERE ip_hash = ? AND created_at >= ?").get(ipHash, since) as { count: number };
  return ipCount.count >= 20;
}

export function listReminders(limit = 200) {
  const rows = getDatabase().prepare("SELECT * FROM fair_reminders ORDER BY created_at DESC, id DESC LIMIT ?").all(Math.max(1, Math.min(limit, 200))) as Record<string, unknown>[];
  return rows.map(rowToRecord);
}

export function getFairDatabasePath() {
  return getFairConfig().databasePath;
}
