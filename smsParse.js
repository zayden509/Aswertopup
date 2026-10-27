// Li yon SMS NatCash/MonCash: ki mòd peman, si se kòb ou resevwa, montan an ak kòd tranzaksyon an.
// Fòma egzak SMS yo ka chanje: Panneau admin → Depo montre sa sit la konprann nan chak SMS,
// e konfimasyon otomatik la mache sèlman lè tout enfòmasyon yo la epi yo koresponn ak depo a.
//
// Egzanp SMS NatCash (soti nan "NATCOM"):
//   Vous avez encaisse 100 HTG a 18:09 25/10/2026 de JEAN …, code 207685. Votre solde: 1,438.7 HTG.
//   TransCode: 26102571206784. Merci
import { normalizeReference } from "./depositCheck.js";

const METHODS = [
  ["natcash", /nat\s*cash|natcom/i],
  ["moncash", /mon\s*cash|digicel/i],
];

// Non operatè yo voye SMS yo ak li (pa yon nimewo telefòn moun ka itilize)
export const OPERATOR_SENDERS = ["natcom", "natcash", "moncash", "digicel"];

// Nimewo/non ki voye SMS la, san espas ni "+", pou n konpare l ak lis ofisyèl la
export const senderKey = (sender) => String(sender || "").replace(/[\s+()-]/g, "").toLowerCase();

// "NATCOM", "MonCash", "MONCASH INFO"…: yon non (pa yon nimewo) ki gen non operatè a ladan l,
// oswa yon kout nimewo operatè (3 a 6 chif, ex. "202"): yon telefòn moun gen 8 chif oswa plis
export function isOperatorSender(sender) {
  const key = senderKey(sender);
  if (/^\d{3,6}$/.test(key)) return true;
  return /[a-z]/.test(key) && OPERATOR_SENDERS.some((name) => key.includes(name));
}

// Ki mòd peman yon nimewo telefòn ye (SIM ki resevwa SMS la): `accounts` = { moncash: "34431664", … }
export function methodForReceiver(receiver, accounts) {
  const digits = String(receiver || "").replace(/\D/g, "");
  if (!digits) return null;
  const found = Object.entries(accounts || {}).find(([, number]) => {
    const n = String(number || "").replace(/\D/g, "");
    return n.length >= 8 && digits.endsWith(n);
  });
  return found ? found[0] : null;
}

const INCOMING = /re[çc]u|resevwa|received|cr[ée]dit|depot|d[ée]p[ôo]t|transfert de|de la part|soti nan|vous avez (?:bien )?encaiss/i;

// 1,500.00 · 1.500,00 · 1500 · 1500.50
const NUMBER = String.raw`(\d{1,3}(?:[,.]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)`;
const CURRENCY = String.raw`(?:HTG|Gdes?\b|gourdes?|G\b)`;
const AMOUNT_AFTER = new RegExp(String.raw`(?:HTG|Gdes?|gourdes?)\s*:?\s*` + NUMBER, "i");
const AMOUNT_BEFORE = new RegExp(NUMBER + String.raw`\s*` + CURRENCY, "i");
// "Votre solde: 1,438.7 HTG" se sa ki rete sou kont lan, pa kòb ou resevwa a
const BALANCE = new RegExp(String.raw`\b(?:solde|balance|sold)\b[^0-9]{0,30}` + NUMBER + String.raw`\s*` + CURRENCY + "?", "gi");
// "Frais: HTG 0.00", "Taxe 0.00 HTG": se pa kòb ou resevwa a non plis
const FEES = new RegExp(String.raw`\b(?:frais|fees?|taxes?|komisyon)\b[^0-9]{0,15}` + NUMBER + String.raw`\s*` + CURRENCY + "?", "gi");

// Kòd la vin apre "TransCode", "Trans ID", "Transaction ID", "ID tranzaksyon", "Txn ID"…
const STRONG_LABEL = String.raw`(?:id|n[o°]\.?|num[ée]ro|nimewo)\s*(?:de\s+)?(?:la\s+)?tran[sz]a[ck]?[st]?[iy]on|trans(?:action)?\s*(?:code|id|no\.?|n°|#)|transcode|txn\s*(?:id)?`;
// …oswa, si pa gen youn nan yo, apre "Ref", "Code", "ID" ("code 207685" se pa kòd tranzaksyon an
// lè gen yon TransCode nan menm SMS la)
const WEAK_LABEL = String.raw`r[ée]f(?:[ée]rence)?|code|id`;
const labelled = (label) => new RegExp(String.raw`\b(?:` + label + String.raw`)\b\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9-]{4,39})`, "gi");
const REFERENCES = [labelled(STRONG_LABEL), labelled(WEAK_LABEL)];

function toAmount(raw) {
  let s = raw;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function findReference(text) {
  for (const pattern of REFERENCES) {
    for (const m of text.matchAll(pattern)) {
      const ref = normalizeReference(m[1]);
      if (/\d/.test(ref) && ref.length >= 6) return ref;
    }
  }
  // Pa gen mo kle: yon long nimewo (12 chif oswa plis) ki pa ka yon nimewo telefòn
  const long = text.match(/\b\d{12,20}\b/);
  return long ? normalizeReference(long[0]) : null;
}

// `sender`: non oswa nimewo ki voye SMS la (ex. "NATCOM"): li di ki mòd peman lè tèks la pa di l.
// `receiverMethod`: mòd peman SIM ki resevwa SMS la (methodForReceiver), si ni tèks la ni non an pa di l.
export function parsePaymentSms(content, sender = "", receiverMethod = null) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  const method = METHODS.find(([, re]) => re.test(text) || re.test(String(sender)))?.[0] || receiverMethod || null;
  const body = text.replace(BALANCE, " ").replace(FEES, " ");
  const amountMatch = AMOUNT_AFTER.exec(body) || AMOUNT_BEFORE.exec(body);
  return {
    method,
    incoming: INCOMING.test(text),
    amount: amountMatch ? toAmount(amountMatch[1]) : null,
    reference: findReference(text),
  };
}
