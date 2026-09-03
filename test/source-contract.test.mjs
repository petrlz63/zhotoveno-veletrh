import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("form keeps required field validation and shared-device reset", async () => {
  const source = await read("src/components/FairReminderForm.tsx");
  assert.match(source, /Pracovní e-mail/);
  assert.match(source, /Hlavní obor/);
  assert.match(source, /Zadat další kontakt/);
  assert.match(source, /setValues\(initialValues\)/);
  assert.match(source, /disabled=\{status === "loading"\}/);
});

test("reminder endpoint validates and does not return cached responses", async () => {
  const source = await read("src/app/api/pripomenuti/route.ts");
  assert.match(source, /Cache-Control.: .private, no-store/);
  assert.match(source, /isSameOrigin/);
  assert.match(source, /validateReminderFields/);
  assert.match(source, /markReminderSent/);
  assert.match(source, /markReminderFailed/);
});

test("email has no sign-in token and contains each standard destination", async () => {
  const source = await read("src/lib/reminder-mailer.ts");
  assert.match(source, /Začít na webu/);
  assert.match(source, /Stáhnout v App Store/);
  assert.match(source, /Stáhnout na Google Play/);
  assert.doesNotMatch(source, /otpCode|one-time token|managementToken/);
});
