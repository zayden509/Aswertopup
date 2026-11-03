// POST /api/order-email { orderId } — Panneau admin lan rele l apre yon admin livre oswa refize
// yon kòmand. Sèvè a voye imèl la bay kliyan an (yon sèl fwa pou chak estati).
import { bot, callerId, fail, json, resetBotOnDenied, SetupError } from "./_lib/autotopup.js";
import { notifyStatus } from "./_lib/mail.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { orderId } = await request.json().catch(() => ({}));
    if (typeof orderId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(orderId)) return fail("Kòmand lan pa bon.");

    const backend = await bot();
    if (!(await backend.adminIsAdmin(uid))) return fail("Se admin sèlman.", 403);
    await notifyStatus(backend, orderId);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof SetupError) return json({ ok: true, setup: false });
    console.error("order-email", error);
    resetBotOnDenied(error);
    return fail("Imèl la pa pati.", 500);
  }
}
