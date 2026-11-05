// Tès rabè fidelite a. Menm kalkil la nan firebase/firestore.rules (loyaltyPct / validNewOrder).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loyaltyPercent, discounted, LOYALTY_KEYS } from "../pricing.js";
import { RANKS } from "../ranks.js";

const ON = { bronze: 1, argent: 2, or: 3, diamant: 5 };

test("rang yo ak règ Firestore yo gen menm limit (5 000, 20 000, 50 000, 100 000)", () => {
  assert.deepEqual(RANKS.map((r) => r.min), [5000, 20000, 50000, 100000]);
  assert.equal(LOYALTY_KEYS.length, RANKS.length);
});

test("pousantaj la swiv rang kliyan an", () => {
  assert.equal(loyaltyPercent(0, ON), 0);
  assert.equal(loyaltyPercent(4999, ON), 0);
  assert.equal(loyaltyPercent(5000, ON), 1);
  assert.equal(loyaltyPercent(20000, ON), 2);
  assert.equal(loyaltyPercent(49999, ON), 2);
  assert.equal(loyaltyPercent(50000, ON), 3);
  assert.equal(loyaltyPercent(250000, ON), 5);
});

test("san paramèt, pa gen rabè", () => {
  assert.equal(loyaltyPercent(250000), 0);
  assert.equal(loyaltyPercent(250000, null), 0);
});

test("pri a arondi anfavè kliyan an, menm jan ak règ yo", () => {
  assert.equal(discounted(155, 2), 155 - Math.floor(3.1));
  assert.equal(discounted(1000, 5), 950);
  assert.equal(discounted(99, 0), 99);
});
