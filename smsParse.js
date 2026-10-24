// Li yon SMS NatCash/MonCash: ki mòd peman, si se kòb ou resevwa, montan an ak kòd tranzaksyon an.
// Fòma egzak SMS yo ka chanje: Panneau admin → Depo montre sa sit la konprann nan chak SMS,
// e konfimasyon otomatik la mache sèlman lè tout enfòmasyon yo la epi yo koresponn ak depo a.

const METHODS = [
  ["natcash", /nat\s*cash|natcom/i],
  ["moncash", /mon\s*cash|digicel/i],
];

const INCOMING = /re[çc]u|resevwa|received|cr[ée]dit|depot|d[ée]p[ôo]t|transfert de|de la part|soti nan/i;

// 1,500.00 · 1.500,00 · 1500 · 1500.50
const NUMBER = String.raw`(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)`;
const AMOUNT_AFTER = new RegExp(String.raw`(?:HTG|Gdes?|gourdes?)\s*:?\s*` + NUMBER, "i");
const AMOUNT_BEFORE = new RegExp(NUMBER + String.raw`\s*(?:HTG|Gdes?\b|gourdes?|G\b)`, "i");

// Kòd la vin apre yon mo tankou "TransCode", "Trans ID", "Transaction ID", "Txn ID", "Ref", "Code"
const REFERENCE = /\b(?:trans(?:action)?\s*(?:code|id|no\.?|n°|#)|transcode|txn\s*(?:id)?|r[ée]f(?:[ée]rence)?|code|id)\b\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9-]{4,39})/gi;

function toAmount(raw) {
  let s = raw;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function findReference(text) {
  for (const m of text.matchAll(REFERENCE)) {
    const ref = m[1].toUpperCase();
    if (/\d/.test(ref) && ref.replace(/-/g, "").length >= 6) return ref;
  }
  // Pa gen mo kle: yon long nimewo (12 chif oswa plis) ki pa ka yon nimewo telefòn
  const long = text.match(/\b\d{12,20}\b/);
  return long ? long[0] : null;
}

export function parsePaymentSms(content) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  const method = METHODS.find(([, re]) => re.test(text))?.[0] || null;
  const amountMatch = AMOUNT_AFTER.exec(text) || AMOUNT_BEFORE.exec(text);
  return {
    method,
    incoming: INCOMING.test(text),
    amount: amountMatch ? toAmount(amountMatch[1]) : null,
    reference: findReference(text),
  };
}
