// POST /api/sms-webhook — httpSMS voye chak SMS telefòn Android lan resevwa isit la.
// Si se yon SMS NatCash/MonCash pou kòb ou resevwa, sit la anrejistre l epi li konfime depo ki koresponn lan.
import { parsePaymentSms } from "../smsParse.js";
import { SetupError, bot, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { smsId, tryConfirm, verifyJwt } from "./_lib/sms.js";

export async function POST(request) {
  const secret = process.env.HTTPSMS_SIGNING_KEY;
  if (!secret) return fail("HTTPSMS_SIGNING_KEY poko mete nan Vercel.", 503);
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!verifyJwt(token, secret)) return fail("bad signature", 401);

  const event = await request.json().catch(() => null);
  const type = request.headers.get("x-event-type") || event?.type;
  if (type !== "message.phone.received") return json({ ok: true, ignored: type || "unknown" });
  const data = event?.data || {};

  try {
    const content = data.encrypted ? "" : String(data.content || "").slice(0, 600);
    const parsed = parsePaymentSms(content);
    const record = {
      ...parsed,
      message_id: String(data.message_id || data.id || "").slice(0, 100) || crypto.randomUUID(),
      sender: String(data.contact || "").slice(0, 40),
      phone: String(data.owner || "").slice(0, 40),
      content: data.encrypted ? "(SMS chifre: dezaktive chifreman an nan httpSMS)" : content,
    };
    const backend = await bot();
    const sms = await backend.adminSaveSms(smsId(record), record);
    let result = { confirmed: false, reason: "no-deposit" };
    if (parsed.method && parsed.reference) {
      const deposit = await backend.adminFindDepositByRef(parsed.method, parsed.reference);
      if (deposit) result = await tryConfirm(backend, { ...sms, id: smsId(record) }, deposit);
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
