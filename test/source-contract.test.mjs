import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("form keeps required field validation and shared-device reset", async () => {
  const source = await read("src/components/FairReminderForm.tsx");
  assert.match(source, /Pracovní e-mail/);
  assert.match(source, /Hlavní obor/);
  assert.match(source, /Odkud jste se o nás dozvěděli\?/);
  assert.match(source, /maxLength=\{300\}/);
  assert.match(source, /Zadat další kontakt/);
  assert.match(source, /setValues\(initialValues\)/);
  assert.match(source, /disabled=\{status === "loading"\}/);
  assert.match(source, /předvyplnění při následném dokončení registrace/);
  assert.match(source, /Uložit první krok/);
});

test("reminder endpoint validates and does not return cached responses", async () => {
  const source = await read("src/app/api/pripomenuti/route.ts");
  assert.match(source, /Cache-Control.: .private, no-store/);
  assert.match(source, /isSameOrigin/);
  assert.match(source, /validateReminderFields/);
  assert.match(source, /markReminderSent/);
  assert.match(source, /markReminderFailed/);
});

test("email continues registration without a sign-in token and contains each standard destination", async () => {
  const source = await read("src/lib/reminder-mailer.ts");
  const route = await read("src/app/api/pripomenuti/route.ts");
  assert.match(source, /Dokončit registraci na webu/);
  assert.match(source, /Stáhnout v App Store/);
  assert.match(source, /Stáhnout na Google Play/);
  assert.match(source, /getFairRegistrationUrl\(urls\.web, industrySlug, toEmail\)/);
  assert.match(route, /industrySlug: reminder\?\.industrySlug \?\? fields\.industry/);
  assert.doesNotMatch(source, /otpCode|one-time token|managementToken/);
});

test("accepted preregistration is copied through the protected PostgreSQL sync", async () => {
  const route = await read("src/app/api/pripomenuti/route.ts");
  const sync = await read("src/lib/fair-preregistration-sync.ts");
  const config = await read("src/lib/fair-config.ts");
  const preflight = await read("scripts/preflight-prod.sh");
  assert.match(route, /syncFairPreregistration/);
  assert.match(route, /syncResult\.reason !== "configuration"/);
  assert.match(sync, /authorization: `Bearer \$\{config\.token\}`/);
  assert.match(sync, /sourceSubmissionId: record\.submissionId/);
  assert.match(sync, /heardAboutUs: record\.heardAboutUs/);
  assert.doesNotMatch(sync, /ipHash|userAgent|utmSource|utmMedium|utmCampaign/);
  assert.match(config, /if \(!url && !token\) return null/);
  assert.match(preflight, /FAIR_POSTGRES_SYNC_URL and FAIR_POSTGRES_SYNC_TOKEN must be configured together/);
});
