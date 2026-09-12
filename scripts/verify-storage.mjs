import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import Module from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const directory = mkdtempSync(join(tmpdir(), "zhotoveno-veletrh-storage-"));
const storageUrl = new URL("../src/lib/fair-storage.ts", import.meta.url);

Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const filePath = join(process.cwd(), "src", specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(filePath) ? filePath : `${filePath}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});

function columns(databasePath) {
  const db = new Database(databasePath, { readonly: true });
  try {
    return db.pragma("table_info(fair_reminders)").map((column) => column.name);
  } finally {
    db.close();
  }
}

function createLegacyDatabase(databasePath) {
  const db = new Database(databasePath);
  try {
    db.exec(`
      CREATE TABLE fair_reminders (
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
      INSERT INTO fair_reminders (
        submission_id, email, company_name, industry_slug, industry_label, source, event_name,
        consent_accepted_at, consent_version, email_status, created_at, updated_at
      ) VALUES (
        '11111111-1111-4111-8111-111111111111', 'legacy@example.com', 'Legacy s.r.o.',
        'stavebnictvi', 'Stavebnictví', 'veletrh.zhotoveno.cz', 'Veletrh',
        '2026-01-01T00:00:00.000Z', '1', 'sent',
        '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
      );
    `);
  } finally {
    db.close();
  }
}

try {
  const legacyPath = join(directory, "legacy.sqlite");
  createLegacyDatabase(legacyPath);
  process.env.FAIR_DB_PATH = legacyPath;
  const storage = await import(storageUrl.href);
  const legacyRows = storage.listReminders();

  assert.ok(columns(legacyPath).includes("heard_about_us"));
  assert.equal(legacyRows.length, 1);
  assert.equal(legacyRows[0].email, "legacy@example.com");
  assert.equal(legacyRows[0].emailStatus, "sent");
  assert.equal(legacyRows[0].heardAboutUs, null);

  const freshPath = join(directory, "fresh.sqlite");
  process.env.FAIR_DB_PATH = freshPath;
  storage.createReminder({
    submissionId: "22222222-2222-4222-8222-222222222222",
    email: "new@example.com",
    companyName: null,
    industrySlug: "stavebnictvi",
    industryLabel: "Stavebnictví",
    heardAboutUs: "Doporučení",
    source: "veletrh.zhotoveno.cz",
    eventName: "Veletrh",
    consentAcceptedAt: "2026-09-12T00:00:00.000Z",
    consentVersion: "1",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    ipHash: null,
    userAgent: "storage-verification",
    createdAt: "2026-09-12T00:00:00.000Z",
  });
  assert.equal(storage.listReminders()[0].heardAboutUs, "Doporučení");
  console.log("storage verification passed: legacy row preserved and new field stored");
} finally {
  delete process.env.FAIR_DB_PATH;
  rmSync(directory, { recursive: true, force: true });
}
