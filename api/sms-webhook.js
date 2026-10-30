// POST /api/sms-webhook — httpSMS voye chak SMS telefòn Android lan resevwa isit la.
// Si se yon SMS NatCash/MonCash pou kòb ou resevwa, sit la anrejistre l epi li konfime depo ki koresponn lan.
// Chak apèl kite yon tras (smsPayments/hook_status) pou Panneau admin lan montre si webhook la mache.
import { SetupError, bot, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { saveIncomingSms, tryConfirm, verifyJwt } from "./_lib/sms.js";

// Yon move siyati: nou note l pou pwopriyetè a wè l, men pa plis pase yon fwa pa minit
let lastBadNote = 0;
async function noteBadSignature() {
  if (Date.now() - lastBadNote < 60000) return;
  lastBadNote = Date.now();
  try {
    await (await bot()).adminSetHookStatus({ last_at: new Date(), result: "bad-signature" });
  } catch (error) {
    console.error("sms-webhook status", error);
  }
}

export async function POST(request) {
  const secret = process.env.HTTPSMS_SIGNING_KEY;
  if (!secret) return fail("HTTPSMS_SIGNING_KEY poko mete nan Vercel.", 503);
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!verifyJwt(token, secret)) {
    await noteBadSignature();
    return fail("bad signature", 401);
  }

  const event = await request.json().catch(() => null);
  const type = request.headers.get("x-event-type") || event?.type;
  if (type !== "message.phone.received") return json({ ok: true, ignored: type || "unknown" });
  const data = event?.data || {};

  try {
    const backend = await bot();
    const sms = await saveIncomingSms(backend, {
      content: data.content, contact: data.contact, owner: data.owner,
      messageId: data.message_id || data.id, encrypted: Boolean(data.encrypted),
    });
    await backend.adminSetHookStatus({ last_at: new Date(), result: "ok", last_ok_at: new Date() }).catch(() => {});
    let result = { confirmed: false, reason: "no-deposit" };
    const { parsed } = sms;
    if (parsed.method && parsed.reference) {
      const deposit = await backend.adminFindDepositByRef(parsed.method, parsed.reference);
      if (deposit) result = await tryConfirm(backend, sms, deposit);
    }
    return json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("sms-webhook", error);
    resetBotOnDenied(error);
    // 500: httpSMS ap voye l ankò
    return fail("error", 500);
  }
}
