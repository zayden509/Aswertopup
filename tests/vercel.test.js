// Plan gratis Vercel la (Hobby) aksepte 12 fonksyon sèvè omaksimòm: si gen plis, Vercel refize
// deplwaman an e sit la rete sou ansyen vèsyon an san okenn mesaj. Tès sa a bloke sa anvan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

test("pa plis pase 12 fonksyon sèvè nan api/", () => {
  const functions = readdirSync(new URL("../api/", import.meta.url)).filter((f) => f.endsWith(".js") && !f.startsWith("_"));
  assert.ok(functions.length <= 12, `${functions.length} fonksyon (${functions.join(", ")}): mete kèk ansanm`);
});
