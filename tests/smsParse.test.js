// Tès lekti SMS MonCash/NatCash yo. Chak fwa yon operatè chanje fòma SMS li, ajoute SMS la isit la.
// Lanse yo: npm test (yo kouri tou anvan chak deplwaman Vercel).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePaymentSms, isOperatorSender, methodForReceiver } from "../smsParse.js";

// [SMS, moun ki voye l, sa sit la dwe konprann]
const CASES = [
  ["Ou resevwa G155.00 pa MonCash de 50937963111. Txn ID: 003598068116", "MonCash",
    { method: "moncash", incoming: true, amount: 155, reference: "3598068116" }],
  ["Ou resevwa G1,500.00 pa MonCash de 50937963111. Txn ID: 003598068117", "MonCash",
    { method: "moncash", incoming: true, amount: 1500, reference: "3598068117" }],
  ["Ou resevwa G 250 pa MonCash de 50937963111. Balans ou: G 1,200.00. Txn ID: 003598068118", "MonCash",
    { method: "moncash", incoming: true, amount: 250, reference: "3598068118" }],
  ["Vous avez encaisse 100 HTG a 18:09 25/10/2026 de JEAN PIERRE, code 207685. Votre solde: 1,438.7 HTG. TransCode: 26102571206784. Merci", "NATCOM",
    { method: "natcash", incoming: true, amount: 100, reference: "26102571206784" }],
  ["Vous avez encaisse 2,500 HTG a 09:12 01/11/2026 de MARIE, code 118822. Votre solde: 12,000.00 HTG. TransCode: 26110198765432. Merci", "NATCOM",
    { method: "natcash", incoming: true, amount: 2500, reference: "26110198765432" }],
];

for (const [text, sender, expected] of CASES) {
  test(`li: ${text.slice(0, 50)}…`, () => {
    assert.deepEqual(parsePaymentSms(text, sender), expected);
  });
}

test("balans lan pa janm pran pou montan an", () => {
  const r = parsePaymentSms("Votre solde: 9,999.00 HTG. Vous avez encaisse 300 HTG de PAUL. TransCode: 26110100000001", "NATCOM");
  assert.equal(r.amount, 300);
});

test("yon SMS ki pa yon peman resevwa pa make incoming", () => {
  const r = parsePaymentSms("Ou voye G500.00 bay 50934431664. Txn ID: 003598060000", "MonCash");
  assert.equal(r.incoming, false);
});

test("operatè yo rekonèt, men pa yon nimewo moun", () => {
  assert.equal(isOperatorSender("NATCOM"), true);
  assert.equal(isOperatorSender("MonCash"), true);
  assert.equal(isOperatorSender("202"), true);
  assert.equal(isOperatorSender("+509 3796 3111"), false);
});

test("SIM ki resevwa SMS la di ki mòd peman", () => {
  assert.equal(methodForReceiver("+50934431664", { moncash: "34431664", natcash: "41112222" }), "moncash");
  assert.equal(methodForReceiver("+50999999999", { moncash: "34431664" }), null);
});
