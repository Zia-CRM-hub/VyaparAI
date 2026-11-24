import { remindersFor } from "./engine.js";
import { composePost } from "./channel.js";
import type { BusinessProfile } from "./types.js";

const tailor: BusinessProfile = {
  name: "Lakshmi Tailors",
  segment: "tailor",
  state: "KA",
  supply: "services",
  annualTurnoverInr: 1_800_000,
  employees: 2,
  gstScheme: "none",
  hasUdyam: false,
  hasShopLicence: true,
  language: "en",
};

const asOf = new Date(process.env.AS_OF ?? Date.now());
console.log(`Channel for ${tailor.name} (${asOf.toISOString().slice(0, 10)})\n`);
for (const r of remindersFor(tailor, asOf).slice(0, 3)) {
  const post = composePost(r, tailor.language);
  console.log(post.text, "\n", post.buttons.map((b) => `[${b.label}]`).join(" "), "\n" + "-".repeat(40));
}
