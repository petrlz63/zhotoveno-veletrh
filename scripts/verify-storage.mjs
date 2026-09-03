import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "zhotoveno-veletrh-storage-"));
const databasePath = join(directory, "fair-reminders.sqlite");
try {
  execFileSync("node", ["-e", `
    const Database = require('better-sqlite3');
    const db = new Database(${JSON.stringify(databasePath)});
    db.exec("CREATE TABLE fair_reminders (id INTEGER PRIMARY KEY, submission_id TEXT NOT NULL UNIQUE, email_status TEXT NOT NULL CHECK (email_status IN ('pending', 'sent', 'failed')))");
    db.prepare("INSERT INTO fair_reminders (submission_id, email_status) VALUES (?, ?)").run('11111111-1111-4111-8111-111111111111', 'pending');
    db.prepare("UPDATE fair_reminders SET email_status = 'sent' WHERE submission_id = ?").run('11111111-1111-4111-8111-111111111111');
    const row = db.prepare("SELECT email_status FROM fair_reminders").get();
    if (row.email_status !== 'sent') process.exit(1);
  `], { stdio: "inherit" });
  assert.ok(true);
  console.log("storage verification passed");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
