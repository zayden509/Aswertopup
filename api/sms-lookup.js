// POST /api/sms-lookup { method, reference } — kliyan an mete kòd tranzaksyon li: sit la gade si
// telefòn boutik la resevwa peman sa a (SMS NatCash/MonCash) anvan l kreye depo a.
// Montan an soti nan SMS la; kliyan an pa janm tape l.
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { lookupCode } from "./_lib/sms.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { method, reference } = await request.json().catch(() => ({}));
    // Ansyen vèsyon paj la mande si kòd la sèlman ase: toujou wi
    if (reference === undefined) return json({ ok: true, auto: true, methods: { natcash: true, moncash: true } });
    const backend = await bot();
    if (!["natcash", "moncash"].includes(method) || typeof reference !== "string") return fail("Kòd la pa bon.");
    return json({ ok: true, ...(await lookupCode(backend, uid, method, reference.slice(0, 60))) });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("sms-lookup", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
