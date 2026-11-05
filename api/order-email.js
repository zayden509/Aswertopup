// POST /api/order-email { orderId } oswa { depositId } — Panneau admin lan rele l apre yon admin
// livre/refize yon kòmand oswa konfime/refize yon depo. Sèvè a voye imèl la ak notifikasyon push la
// bay kliyan an (yon sèl fwa pou chak estati).
import { bot, callerId, fail, json, resetBotOnDenied, SetupError } from "./_lib/autotopup.js";
import { notifyDeposit, notifyStatus } from "./_lib/mail.js";

const ID = /^[A-Za-z0-9]{10,40}$/;

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { orderId, depositId } = await request.json().catch(() => ({}));
    if (!(typeof orderId === "string" && ID.test(orderId)) && !(typeof depositId === "string" && ID.test(depositId))) return fail("Kòmand lan pa bon.");

    const backend = await bot();
    if (!(await backend.adminIsAdmin(uid))) return fail("Se admin sèlman.", 403);
    if (orderId) await notifyStatus(backend, orderId);
    else await notifyDeposit(backend, depositId);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof SetupError) return json({ ok: true, setup: false });
    console.error("order-email", error);
    resetBotOnDenied(error);
    return fail("Notifikasyon an pa pati.", 500);
  }
}
