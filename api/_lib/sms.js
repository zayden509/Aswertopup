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
import { DEPOSIT_MAX, DEPOSIT_MIN, SMS_MAX_AGE_MS, duplicateOf, isPhoneNumber, normalizeReference, smsAmount, smsTooOld } from "../../depositCheck.js";
import { isOperatorSender, methodForReceiver, parsePaymentSms, senderKey } from "../../smsParse.js";
import { accountNumbers } from "../../paymentAccounts.js";
import { alert, checkSmsSilence } from "./alert.js";
import { httpsmsApiReady, httpsmsMessagesWithCode } from "./httpsmsApi.js";

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

// Anrejistre yon SMS telefòn boutik la resevwa (webhook httpSMS la, oswa rekiperasyon dirèk la).
// Si se yon SMS ofisyèl NatCash/MonCash, SIM sa a make konekte.
export async function saveIncomingSms(backend, { content, contact, owner, messageId, receivedAt = null, encrypted = false }) {
  const text = encrypted ? "" : String(content || "").slice(0, 600);
  const parsed = await readSms(backend, text, contact, owner);
  const record = {
    ...parsed,
    message_id: String(messageId || "").slice(0, 100) || crypto.randomUUID(),
    sender: String(contact || "").slice(0, 40),
    phone: String(owner || "").slice(0, 40),
    content: encrypted ? "(SMS chifre: dezaktive chifreman an nan httpSMS)" : text,
  };
  const id = smsId(record);
  const sms = await backend.adminSaveSms(id, receivedAt ? { ...record, received_at: receivedAt } : record);
  if (parsed.method && isOfficial(await backend.adminGetAutomation(), record.sender)) await backend.adminMarkSmsSeen(parsed.method);
  return { ...sms, id, parsed };
}

// Eseye konfime depo a ak SMS la. Retounen rezon an si li pa ka fèt (pou Panneau admin lan).
export async function tryConfirm(backend, sms, deposit) {
  if (!sms || !deposit) return { confirmed: false, reason: "missing" };
  if (deposit.status !== "pending") return { confirmed: false, reason: "deposit-done" };
  const settings = await backend.adminGetAutomation();
  const max = Number.isInteger(settings.max_auto) ? settings.max_auto : 5000;
  const checks = [
    [isOfficial(settings, sms.sender), "sender"],
    [sms.incoming === true, "not-incoming"],
    [sms.status === "new", "used"],
    [sms.method === deposit.method && sms.reference === deposit.reference, "reference"],
    [smsAmount(sms) === Number(deposit.amount), "amount"],
    [deposit.amount <= max, "limit"],
    [!smsTooOld(deposit, sms), "expired"],
  ];
  const failed = checks.find(([ok]) => !ok);
  if (failed?.[1] === "limit") {
    const name = deposit.method === "natcash" ? "NatCash" : "MonCash";
    await alert(backend, `💰 Yon depo ${deposit.amount} HTG (${name}, kòd ${deposit.reference}) ap tann ou: li pi gwo pase limit otomatik la (${max} HTG). Konfime l nan Panneau admin → Depo.`, { key: `limit_${deposit.id}`, everyMs: 24 * 3600000 });
  }
  if (failed) return { confirmed: false, reason: failed[1] };
  if (duplicateOf(deposit, await backend.adminDepositsByReference(deposit.reference))) return { confirmed: false, reason: "duplicate" };

  if (!(await backend.adminClaimSms(sms.id, deposit.id))) return { confirmed: false, reason: "used" };
  try {
    const method = sms.method === "natcash" ? "NatCash" : "MonCash";
    await backend.adminReviewDeposit(deposit, true, `Konfime otomatikman (SMS ${method}).`);
    // Premye depo yon zanmi envite: bonis parennaj yo (si règ yo pa pèmèt li, depo a rete konfime)
    await backend.adminRewardReferral({ ...deposit, status: "completed" }).catch((error) => console.error("referral", error));
    return { confirmed: true };
  } catch (error) {
    await backend.adminReleaseSms(sms.id).catch(() => {});
    throw error;
  }
}

// 5 kòd ki pa bon nan 30 minit: kliyan an tann 30 minit anvan l eseye ankò (pou l pa devine kòd)
const CODE_MAX_FAILS = 5;
const CODE_WAIT_MS = 30 * 60000;

// Kliyan an mete kòd tranzaksyon li (sèl sa li mete): èske telefòn boutik la resevwa peman sa a?
// Si wi, montan an soti nan SMS la.
export async function lookupCode(backend, uid, method, reference) {
  const settings = await backend.adminGetAutomation();
  // Si règ Firestore yo poko pibliye (koleksyon codeChecks la), verifikasyon an mache kanmenm
  const wait = await backend.adminCodeWait(uid).catch(() => 0);
  if (wait > 0) return { status: "blocked", wait_minutes: Math.ceil(wait / 60000) };
  const result = await findPayment(backend, settings, method, normalizeReference(reference));
  // Bon kòd (menm si montan an pa ka antre otomatikman): li pa konte kòm yon erè
  if (result.status === "ok" || result.status === "amount") {
    await backend.adminClearCodeFails(uid).catch(() => {});
    return result;
  }
  // Kòd la pa jwenn: petèt telefòn httpSMS la pa voye SMS yo ankò (pwopriyetè a resevwa yon alèt)
  if (result.status === "not-found") await checkSmsSilence(backend);
  const left = await backend.adminAddCodeFail(uid, CODE_MAX_FAILS, CODE_WAIT_MS).catch(() => null);
  return left === null ? result : { ...result, attempts_left: left };
}

async function findPayment(backend, settings, method, ref) {
  if (!/^[A-Z0-9]{6,40}$/.test(ref)) return { status: "invalid" };
  if (isPhoneNumber(ref)) return { status: "phone" };
  if (await backend.adminReferenceUsed(ref)) return { status: "used" };
  const usable = (list) => list.filter((sms) => sms.incoming && smsAmount(sms) > 0 && isOfficial(settings, sms.sender));
  let found = usable(await smsFor(backend, ref));
  // Webhook la pa t voye SMS la sou sit la: nou al chèche l dirèkteman sou httpSMS
  if (!found.length && (await pullFromHttpsms(backend, ref))) found = usable(await smsFor(backend, ref));
  const sms = found.find((x) => x.method === method) || found[0];
  if (!sms) return { status: "not-found" };
  if (sms.status !== "new") return { status: "used" };
  if (Date.now() - new Date(sms.received_at).getTime() > SMS_MAX_AGE_MS) return { status: "expired" };
  const amount = smsAmount(sms);
  // Peman an rive, men montan an pa ka fè yon depo otomatik (ex. 31 HTG < 50): pwopriyetè a ranje l alamen
  if (amount < DEPOSIT_MIN || amount > DEPOSIT_MAX) return { status: "amount", method: sms.method, amount };
  return { status: "ok", method: sms.method, amount };
}

// Rekiperasyon dirèk: SMS ki gen kòd sa a sou httpSMS (ak HTTPSMS_API_KEY). Retounen true si nou
// jwenn epi anrejistre youn: sa vle di webhook la pa t voye l, pwopriyetè a resevwa yon alèt.
async function pullFromHttpsms(backend, ref) {
  if (!httpsmsApiReady()) return false;
  try {
    const owners = Object.values(accountNumbers(await backend.adminGetPayments()));
    const messages = await httpsmsMessagesWithCode(owners, ref);
    for (const m of messages) {
      await saveIncomingSms(backend, {
        content: m.content, contact: m.contact, owner: m.owner, messageId: m.id,
        receivedAt: m.received_at || m.request_received_at || m.created_at || null,
      });
    }
    if (!messages.length) return false;
    await backend.adminSetHookStatus({ missed_at: new Date() }).catch(() => {});
    await alert(backend, "⚠️ Webhook httpSMS la pa voye SMS yo sou sit la: sit la te oblije al chèche yon SMS peman dirèkteman sou httpSMS. Tcheke webhook la (Panneau admin → Paramèt).", { key: "hook_missed", everyMs: 6 * 3600000 });
    return true;
  } catch (error) {
    console.error("httpsms pull", error);
    await backend.adminSetHookStatus({ pull_error: String(error.message || error).slice(0, 120), pull_error_at: new Date() }).catch(() => {});
    return false;
  }
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
