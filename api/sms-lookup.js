// POST /api/sms-lookup { method, reference } — kliyan an mete kòd tranzaksyon li: sit la gade si
// telefòn boutik la resevwa peman sa a (SMS NatCash/MonCash) anvan l kreye depo a.
// San kòd ({}): retounen sèlman ki mòd peman sit la verifye otomatikman ({ auto, methods }).
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { autoMethods, lookupCode } from "./_lib/sms.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { method, reference } = await request.json().catch(() => ({}));
    const backend = await bot();
    if (reference === undefined) {
      const settings = await backend.adminGetAutomation();
      return json({ ok: true, auto: settings.sms_auto === true, methods: await autoMethods(backend, settings) });
    }
    if (!["natcash", "moncash"].includes(method) || typeof reference !== "string") return fail("Kòd la pa bon.");
    return json({ ok: true, ...(await lookupCode(backend, uid, method, reference.slice(0, 60))) });
  } catch (error) {
    // Sèvè a poko konfigire: depo yo ale kote admin nan kòm anvan
    if (error instanceof SetupError) return json({ ok: true, auto: false });
    console.error("sms-lookup", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
