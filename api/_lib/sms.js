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
import { SMS_MAX_AGE_MS, duplicateOf, normalizeReference, smsAmount, smsTooOld } from "../../depositCheck.js";

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

// Nimewo/non ki voye SMS la, san espas ni "+", pou n konpare l ak lis ofisyèl la
export const senderKey = (sender) => String(sender || "").replace(/[\s+()-]/g, "").toLowerCase();

export const smsId = (sms) => (sms.method && sms.reference ? `${sms.method}_${sms.reference}` : `msg_${String(sms.message_id).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)}`);

// Eseye konfime depo a ak SMS la. Retounen rezon an si li pa ka fèt (pou Panneau admin lan).
export async function tryConfirm(backend, sms, deposit) {
  if (!sms || !deposit) return { confirmed: false, reason: "missing" };
  if (deposit.status !== "pending") return { confirmed: false, reason: "deposit-done" };
  const settings = await backend.adminGetAutomation();
  const max = Number.isInteger(settings.max_auto) ? settings.max_auto : 5000;
  const checks = [
    [settings.sms_auto === true, "off"],
    [(settings.senders || []).map(senderKey).includes(senderKey(sms.sender)), "sender"],
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

// Kliyan an mete kòd tranzaksyon li anvan depo a: èske telefòn boutik la resevwa peman sa a?
// Retounen { auto: false } si konfimasyon otomatik la etenn (depo a ale kote admin nan kòm anvan).
export async function lookupCode(backend, uid, method, reference) {
  const settings = await backend.adminGetAutomation();
  if (settings.sms_auto !== true) return { auto: false };
  if ((await backend.adminCodeFails(uid)) >= MAX_CODE_FAILS) return { auto: true, status: "blocked" };
  const result = await findPayment(backend, settings, method, normalizeReference(reference));
  if (result.status !== "ok") await backend.adminAddCodeFail(uid);
  return { auto: true, ...result };
}

async function findPayment(backend, settings, method, ref) {
  if (!/^[A-Z0-9]{6,40}$/.test(ref)) return { status: "invalid" };
  if (await backend.adminReferenceUsed(ref)) return { status: "used" };
  const official = (settings.senders || []).map(senderKey);
  const found = (await Promise.all(["natcash", "moncash"].map((m) => backend.adminGetSms(`${m}_${ref}`))))
    .filter((sms) => sms && sms.incoming && smsAmount(sms) > 0 && official.includes(senderKey(sms.sender)));
  const sms = found.find((x) => x.method === method) || found[0];
  if (!sms) return { status: "not-found" };
  if (sms.status !== "new") return { status: "used" };
  if (Date.now() - new Date(sms.received_at).getTime() > SMS_MAX_AGE_MS) return { status: "expired" };
  return { status: "ok", method: sms.method, amount: smsAmount(sms) };
}
