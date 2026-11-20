// Tès kliyan Gift Access la: siyati a (menm ak plugin WooCommerce ofisyèl la), estati ak kòd PIN yo.
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { signature, giftStatus, giftCards, cardsText, orderPayload, giftOrderId } from "../api/_lib/giftaccess.js";

test("siyati a: HMAC-SHA256(timestamp + METHOD + /api/v1/chemen + kò, sekrè)", () => {
  const body = JSON.stringify({ product_id: "12", quantity: 1 });
  const expected = crypto.createHmac("sha256", "s3cret").update(`1700000000POST/api/v1/orders${body}`).digest("hex");
  assert.equal(signature("s3cret", "post", "https://portal.gift-access.com/api/v1/orders", body, "1700000000"), expected);
  const get = crypto.createHmac("sha256", "s3cret").update("1700000000GET/api/v1/orders/AB%2012").digest("hex");
  assert.equal(signature("s3cret", "GET", "https://portal.gift-access.com/api/v1/orders/AB%2012", "", "1700000000"), get);
});

test("estati Gift Access yo", () => {
  assert.equal(giftStatus({ status: "Completed" }), "completed");
  assert.equal(giftStatus({ state: "livrée" }), "completed");
  assert.equal(giftStatus({ status: "failed" }), "failed");
  assert.equal(giftStatus({ status: "refunded" }), "failed");
  assert.equal(giftStatus({ status: "pending" }), "processing");
});

test("kòd PIN yo nan repons lan", () => {
  const order = orderPayload({ success: true, data: { order: { order_id: "GA-1", status: "completed", delivery: { items: [{ type: "pin", pin_code: "FF-1234-5678" }, { code: "XYZ", pin: "9999" }] } } } });
  assert.equal(giftOrderId(order), "GA-1");
  assert.deepEqual(giftCards(order), [{ code: "FF-1234-5678", pin: "" }, { code: "XYZ", pin: "9999" }]);
  assert.equal(cardsText(giftCards(order)), "FF-1234-5678 | XYZ · PIN 9999");
  assert.deepEqual(giftCards({ status: "completed" }), []);
});
