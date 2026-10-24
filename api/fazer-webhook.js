// POST /api/fazer-webhook — FazerCards avèti nou lè estati yon kòmand chanje.
// Nou verifye siyati a, epi nou mande FazerCards estati a dirèkteman anvan nou chanje anyen.
import { verifyWebhookSignature } from "fazercards";
import { applyStatus, bot, fail, fazer, json, resetBotOnDenied, webhookSecret } from "./_lib/autotopup.js";

export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") || "";
  try {
    let valid = verifyWebhookSignature(raw, signature, await webhookSecret());
    if (!valid) valid = verifyWebhookSignature(raw, signature, await webhookSecret(true)); // sekrè a ka chanje
    if (!valid) return fail("bad signature", 401);

    const event = JSON.parse(raw);
    if (!String(event.event || "").startsWith("order.")) return json({ ok: true });
    const data = event.data || {};
    const fzId = data.id || data.order_id || data.order?.id;
    if (!fzId) return json({ ok: true });

    const backend = await bot();
    const order = await backend.adminFindOrderBySupplier(String(fzId));
    if (!order) return json({ ok: true, ignored: true });
    await applyStatus(backend, order, await fazer().orders.get(String(fzId)));
    return json({ ok: true });
  } catch (error) {
    console.error("fazer-webhook", error);
    resetBotOnDenied(error);
    // Yon erè: FazerCards ap eseye ankò (apre 1 min, 5 min, 30 min)
    return fail("error", 500);
  }
}
