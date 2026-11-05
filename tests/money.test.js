// Tès kalkil ki touche kòb: kòd tranzaksyon depo yo, SMS ki twò ansyen, konvèsyon (Meru, PayPal…).
// Menm kalkil yo nan firebase/firestore.rules: si youn chanje, lòt la dwe chanje tou.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeReference, sameReference, isPhoneNumber, smsAmount, smsTooOld, duplicateOf } from "../depositCheck.js";
import { quote, tierIndex, amountForBudget, DEFAULT_TIERS } from "../exchange.js";

test("kòd tranzaksyon: espas, tirè ak zewo devan pa konte", () => {
  assert.equal(normalizeReference("2607-2853 633942"), "26072853633942");
  assert.equal(normalizeReference("003598068116"), "3598068116");
  assert.equal(normalizeReference("ab12-cd"), "AB12CD");
  assert.ok(sameReference("003598068116", "3598068116"));
});

test("yon nimewo telefòn pa ka sèvi kòm kòd tranzaksyon", () => {
  assert.ok(isPhoneNumber("50934431664"));
  assert.ok(isPhoneNumber("34431664"));
  assert.ok(!isPhoneNumber("3598068116"));
});

test("montan SMS la: goud antye sèlman", () => {
  assert.equal(smsAmount({ amount: 1500.5 }), 1500);
  assert.equal(smsAmount({ amount: null }), 0);
});

test("SMS plis pase 24 è de depo a pa konfime otomatikman", () => {
  const deposit = { created_at: "2026-11-03T12:00:00Z" };
  assert.equal(smsTooOld(deposit, { received_at: "2026-11-03T20:00:00Z" }), false);
  assert.equal(smsTooOld(deposit, { received_at: "2026-11-05T12:00:01Z" }), true);
});

test("menm kòd tranzaksyon an pa ka konfime de depo", () => {
  const deposit = { id: "b", reference: "3598068116" };
  const others = [{ id: "a", status: "completed", reference: "003598068116" }];
  assert.equal(duplicateOf(deposit, others)?.id, "a");
  assert.equal(duplicateOf(deposit, [{ id: "a", status: "refused", reference: "3598068116" }]), null);
});

const MERU = { rate: 140, min: 1, max: 1000, tiers: DEFAULT_TIERS };

test("konvèsyon: palye frè a ak pri a arondi anlè", () => {
  assert.equal(tierIndex(DEFAULT_TIERS, 5), 0);
  assert.equal(tierIndex(DEFAULT_TIERS, 10), 1);
  assert.equal(tierIndex(DEFAULT_TIERS, 999999), DEFAULT_TIERS.length - 1);
  assert.deepEqual(quote(MERU, 10), { amount: 10, tier: 1, fee: 2, price: Math.ceil(12 * 140) });
});

test("konvèsyon: bidjè a pa janm depase", () => {
  for (const budget of [100, 1000, 5000, 20000, 150000]) {
    const amount = amountForBudget(MERU, budget);
    if (amount) assert.ok(quote(MERU, amount).price <= budget);
    if (amount && amount < MERU.max) assert.ok(quote(MERU, amount + 1).price > budget);
  }
});
