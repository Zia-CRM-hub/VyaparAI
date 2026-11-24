import { test } from "node:test";
import assert from "node:assert/strict";
import { remindersFor } from "../src/engine.js";
import { composePost } from "../src/channel.js";
import { gstThreshold } from "../src/rules/index.js";
import type { BusinessProfile } from "../src/types.js";

const base: BusinessProfile = {
  name: "T",
  segment: "tailor",
  state: "KA",
  supply: "services",
  annualTurnoverInr: 1_000_000,
  employees: 0,
  gstScheme: "none",
  hasUdyam: true,
  hasShopLicence: true,
  language: "en",
};
const NOW = new Date("2026-11-24");
const ids = (p: BusinessProfile) => remindersFor(p, NOW).map((r) => r.obligationId);
const find = (p: BusinessProfile, id: string, d = NOW) => remindersFor(p, d).find((x) => x.obligationId === id)!;
const iso = (d: Date | null) => d!.toISOString().slice(0, 10);

test("thresholds: services 20L, goods 40L, special-category halves them", () => {
  assert.equal(gstThreshold(base), 2_000_000);
  assert.equal(gstThreshold({ ...base, supply: "goods" }), 4_000_000);
  assert.equal(gstThreshold({ ...base, state: "MN" }), 1_000_000);
});

test("small unregistered tailor gets no GST returns, does get ITR and DPDP", () => {
  const got = ids(base);
  assert.ok(!got.includes("gstr-3b-monthly"));
  assert.ok(!got.includes("gst-registration"));
  assert.ok(got.includes("itr-annual") && got.includes("dpdp-consent"));
});

test("near the limit: registration nudge; above it: due now and urgent", () => {
  assert.ok(ids({ ...base, annualTurnoverInr: 1_700_000 }).includes("gst-registration"));
  assert.equal(find({ ...base, annualTurnoverInr: 2_500_000 }, "gst-registration").urgency, "overdue-risk");
});

test("regular filer: GSTR-3B due 20th, rolls to next month after the 20th", () => {
  const p = { ...base, gstScheme: "regular" as const };
  assert.equal(iso(find(p, "gstr-3b-monthly", new Date("2026-11-18")).due), "2026-11-20");
  const b = find(p, "gstr-3b-monthly");
  assert.equal(iso(b.due), "2026-12-20");
  assert.equal(b.period, "Nov 2026");
});

test("composition and QRMP dates", () => {
  assert.equal(iso(find({ ...base, gstScheme: "composition" }, "gst-composition-cmp08").due), "2027-01-18");
  assert.equal(iso(find({ ...base, gstScheme: "qrmp" }, "gst-qrmp-3b").due), "2027-01-22");
});

test("staff-based and segment-based rules", () => {
  assert.ok(ids({ ...base, employees: 12 }).includes("esi-epf"));
  assert.ok(!ids(base).includes("esi-epf"));
  assert.ok(ids({ ...base, segment: "food" }).includes("fssai"));
  assert.ok(!ids(base).includes("fssai"));
});

test("posts: trader's language, 3 buttons, disclaimer, short enough for WhatsApp", () => {
  const p = { ...base, language: "hi" as const, annualTurnoverInr: 1_700_000 };
  const post = composePost(remindersFor(p, NOW)[0]!, "hi");
  assert.equal(post.buttons.length, 3);
  assert.match(post.text, /GST/);
  assert.match(post.text, /not legal or tax advice/);
  assert.ok(post.text.length < 1400);
});
