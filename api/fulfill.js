// POST /api/fulfill { orderId } — sit la rele l touswit apre yon acha.
// Si pake a otomatik, kòmand lan ale kote FazerCards; sinon pa gen anyen ki fèt.
import { SetupError, bot, callerId, fail, fazerError, fulfill, json, resetBotOnDenied } from "./_lib/autotopup.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { orderId } = await request.json().catch(() => ({}));
    if (typeof orderId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(orderId)) return fail("Kòmand lan pa bon.");

    const backend = await bot();
    const order = await backend.adminGetOrder(orderId);
    if (!order) return fail("Kòmand sa a pa egziste.", 404);
    if (order.user_id !== uid && !(await backend.adminIsAdmin(uid))) return fail("Se pa kòmand ou.", 403);

    const result = await fulfill(orderId);
    return json(result, result.ok ? 200 : 502);
  } catch (error) {
    // Livrezon otomatik la poko konfigire (varyab Vercel yo): kòmand lan rete manyèl, san erè pou kliyan an
    if (error instanceof SetupError) return json({ ok: true, auto: false, setup: false });
    console.error("fulfill", error);
    resetBotOnDenied(error);
    return fail(fazerError(error), 500);
  }
}
