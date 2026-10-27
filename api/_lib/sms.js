// SMS peman (httpSMS → sit la): verifye siyati a, li SMS la, epi konfime depo ki koresponn lan.
//
// Yon depo konfime poukont li SÈLMAN si:
//   - pwopriyetè a limen l (Panneau admin → Paramèt) e li make nimewo ki voye SMS la kòm ofisyèl
//   - SMS la se kòb ou resevwa, sou menm mòd peman an (NatCash/MonCash)
//   - kòd tranzaksyon an ak montan an menm jan ak sa kliyan an mete a
//   - montan an pa depase limit otomatik la
//   - SMS sa a poko sèvi pou yon lòt depo, e okenn lòt depo pa deja konfime ak menm kòd la
//   - SMS la rive mwens pase 24 è anvan oswa apre depo a (pa yon ansyen tranzaksyon)
import crypto from "node:crypto";
import { SMS_MAX_AGE_MS, duplicateOf, isPhoneNumber, normalizeReference, smsAmount, smsTooOld } from "../../depositCheck.js";
import { isOperatorSender, methodForReceiver, parsePaymentSms, senderKey } from "../../smsParse.js";
import { accountNumbers } from "../../paymentAccounts.js";

export { senderKey };

// Jeton JWT (HS256) httpSMS mete nan chak webhook, siyen ak kle ou mete nan httpSMS la
export function verifyJwt(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || !secret) return null;
  const [head, body, signature] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(head, "base64url").toString());
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;
  const expected = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  const now = Date.now() / 1000;
  if (payload.exp && now > payload.exp + 60) return null;
  if (payload.nbf && now < payload.nbf - 60) return null;
  return payload;
}


// SMS ki soti nan operatè a ("NATCOM", "MonCash"…) oswa nan yon nimewo pwopriyetè a make ofisyèl
export const isOfficial = (settings, sender) => isOperatorSender(sender) || (settings.senders || []).map(senderKey).includes(senderKey(sender));

// Li SMS la: lè tèks la pa di si se NatCash oswa MonCash, nimewo SIM ki resevwa l la di l
export async function readSms(backend, content, sender, receiver) {
  const receiverMethod = methodForReceiver(receiver, accountNumbers(await backend.adminGetPayments()));
  return parsePaymentSms(content, sender, receiverMethod);
}

export const smsId = (sms) => (sms.method && sms.reference ? `${sms.method}_${sms.reference}` : `msg_${String(sms.message_id).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)}`);

// Eseye konfime depo a ak SMS la. Retounen rezon an si li pa ka fèt (pou Panneau admin lan).
export async function tryConfirm(backend, sms, deposit) {
  if (!sms || !deposit) return { confirmed: false, reason: "missing" };
  if (deposit.status !== "pending") return { confirmed: false, reason: "deposit-done" };
  const settings = await backend.adminGetAutomation();
  const max = Number.isInteger(settings.max_auto) ? settings.max_auto : 5000;
  const checks = [
    [settings.sms_auto === true, "off"],
    [isOfficial(settings, sms.sender), "sender"],
    [sms.incoming === true, "not-incoming"],
    [sms.status === "new", "used"],
    [sms.method === deposit.method && sms.reference === deposit.reference, "reference"],
    [smsAmount(sms) === Number(deposit.amount), "amount"],
    [deposit.amount <= max, "limit"],
    [!smsTooOld(deposit, sms), "expired"],
  ];
  const failed = checks.find(([ok]) => !ok);
  if (failed) return { confirmed: false, reason: failed[1] };
  if (duplicateOf(deposit, await backend.adminDepositsByReference(deposit.reference))) return { confirmed: false, reason: "duplicate" };

  if (!(await backend.adminClaimSms(sms.id, deposit.id))) return { confirmed: false, reason: "used" };
  try {
    const method = sms.method === "natcash" ? "NatCash" : "MonCash";
    await backend.adminReviewDeposit(deposit, true, `Konfime otomatikman (SMS ${method}).`);
    return { confirmed: true };
  } catch (error) {
    await backend.adminReleaseSms(sms.id).catch(() => {});
    throw error;
  }
}

// Yon kliyan ka mete 8 kòd ki pa bon pa èdtan: pi plis, li bloke pou yon ti tan (pou l pa devine kòd)
const MAX_CODE_FAILS = 8;

// Ki mòd peman kliyan an peye ak kòd la sèlman (montan an soti nan SMS la): tout, lè
// konfimasyon otomatik la limen
export const autoMethods = (settings) => {
  const on = settings.sms_auto === true;
  return { natcash: on, moncash: on };
};

// Kliyan an mete kòd tranzaksyon li anvan depo a: èske telefòn boutik la resevwa peman sa a?
// Retounen { auto: false } si konfimasyon otomatik la etenn (kliyan an mete montan an, admin nan konfime).
export async function lookupCode(backend, uid, method, reference) {
  const settings = await backend.adminGetAutomation();
  if (settings.sms_auto !== true) return { auto: false };
  // Si règ Firestore yo poko pibliye (koleksyon codeChecks la), verifikasyon an mache kanmenm
  if ((await backend.adminCodeFails(uid).catch(() => 0)) >= MAX_CODE_FAILS) return { auto: true, status: "blocked" };
  const result = await findPayment(backend, settings, method, normalizeReference(reference));
  if (result.status !== "ok") await backend.adminAddCodeFail(uid).catch(() => {});
  return { auto: true, ...result };
}

async function findPayment(backend, settings, method, ref) {
  if (!/^[A-Z0-9]{6,40}$/.test(ref)) return { status: "invalid" };
  if (isPhoneNumber(ref)) return { status: "phone" };
  if (await backend.adminReferenceUsed(ref)) return { status: "used" };
  const found = (await smsFor(backend, ref))
    .filter((sms) => sms.incoming && smsAmount(sms) > 0 && isOfficial(settings, sms.sender));
  const sms = found.find((x) => x.method === method) || found[0];
  if (!sms) return { status: "not-found" };
  if (sms.status !== "new") return { status: "used" };
  if (Date.now() - new Date(sms.received_at).getTime() > SMS_MAX_AGE_MS) return { status: "expired" };
  return { status: "ok", method: sms.method, amount: smsAmount(sms) };
}

// SMS peman ki gen kòd sa a. Yon SMS sit la te anrejistre anvan li te konprann fòma l (ex. "msg_…",
// oswa "moncash_003577973060" ak zewo devan), nou li l ankò epi nou mete l nan bon plas li.
export async function smsFor(backend, ref) {
  const found = (await Promise.all(["natcash", "moncash"].map((m) => backend.adminGetSms(`${m}_${ref}`)))).filter(Boolean);
  if (found.length) return found;
  for (const old of await backend.adminRecentSms(Date.now() - SMS_MAX_AGE_MS)) {
    if (old.status !== "new" || !String(old.content || "").toUpperCase().replace(/[^A-Z0-9]/g, "").includes(ref)) continue;
    const parsed = await readSms(backend, old.content, old.sender, old.phone);
    if (parsed.reference !== ref || !parsed.method || smsId(parsed) === old.id) continue;
    const { id, status, deposit_id, ...data } = old;
    const sms = await backend.adminSaveSms(smsId(parsed), { ...data, ...parsed });
    await backend.adminDeleteSms(id);
    return [{ ...sms, id: smsId(parsed) }];
  }
  return [];
}
