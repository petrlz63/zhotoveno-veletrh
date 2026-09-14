import assert from "node:assert/strict";
import test from "node:test";

import { getFairRegistrationUrl } from "../src/lib/fair-registration-url.ts";

test("fair reminder continues directly in B2B registration with the selected industry", () => {
  assert.equal(
    getFairRegistrationUrl("https://b2b.zhotoveno.cz", "stavebnictvi", " Firma+Veletrh@Example.COM "),
    "https://b2b.zhotoveno.cz/registrace?source=veletrh&industry=stavebnictvi&email=firma%2Bveletrh%40example.com",
  );
});
