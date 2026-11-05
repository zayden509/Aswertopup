// POST /api/winback { uids: [...], code, message } — Panneau admin → Kliyan → "Pa tounen":
// voye yon imèl ak yon kòd pwomo bay kliyan ki pa achte depi lontan (admin konplè sèlman).
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { mailReady, sendWinbackEmail } from "./_lib/mail.js";

const MAX = 100; // Gmail: anviwon 500 imèl pa jou

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { uids, code, message } = await request.json().catch(() => ({}));
    if (!Array.isArray(uids) || uids.length === 0 || uids.length > MAX || !uids.every((u) => typeof u === "string" && /^[A-Za-z0-9]{10,40}$/.test(u))) {
      return fail(`Chwazi ant 1 ak ${MAX} kliyan.`);
    }
    const promoCode = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z0-9]{3,20}$/.test(promoCode)) return fail("Kòd pwomo a pa bon.");
    const text = typeof message === "string" ? message.trim().slice(0, 300) : "";

    const backend = await bot();
    if (!(await backend.adminIsFullAdmin(uid))) return fail("Se yon admin konplè ki ka fè sa.", 403);
    if (!mailReady()) return fail("Imèl yo poko konfigire (SMTP_USER / SMTP_PASS nan Vercel).", 503);
    const promo = await backend.adminGetPromo(promoCode);
    if (!promo || !promo.active) return fail("Kòd pwomo sa a pa egziste oswa li pa aktif.");

    let sent = 0;
    for (const id of [...new Set(uids)]) {
      const customer = await backend.adminGetUser(id);
      if (customer?.email) sent += (await sendWinbackEmail(customer, { code: promoCode, percent: promo.percent, message: text })).sent;
    }
    return json({ ok: true, sent });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("winback", error);
    resetBotOnDenied(error);
    return fail("Imèl yo pa pati.", 500);
  }
}
