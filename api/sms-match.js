// POST /api/sms-match { depositId } — kliyan an fin voye yon depo: si SMS NatCash/MonCash la
// deja rive sou telefòn boutik la, depo a konfime touswit.
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { tryConfirm } from "./_lib/sms.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { depositId } = await request.json().catch(() => ({}));
    if (typeof depositId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(depositId)) return fail("Depo a pa bon.");

    const backend = await bot();
    const deposit = await backend.adminGetDeposit(depositId);
    if (!deposit) return fail("Depo sa a pa egziste.", 404);
    if (deposit.user_id !== uid && !(await backend.adminIsAdmin(uid))) return fail("Se pa depo ou.", 403);

    const sms = await backend.adminGetSms(`${deposit.method}_${deposit.reference}`);
    if (!sms) return json({ ok: true, confirmed: false, reason: "no-sms" });
    return json({ ok: true, ...(await tryConfirm(backend, sms, deposit)) });
  } catch (error) {
    // Konfimasyon SMS la poko konfigire: depo a rete pou admin nan, san erè pou kliyan an
    if (error instanceof SetupError) return json({ ok: true, confirmed: false, reason: "setup" });
    console.error("sms-match", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
