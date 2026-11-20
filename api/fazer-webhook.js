// POST /api/fazer-webhook — FazerCards oswa Gift Access avèti nou lè estati yon kòmand chanje.
// Nou verifye siyati a, epi nou mande founisè a estati a dirèkteman anvan nou chanje anyen.
// (Yon sèl fonksyon pou de founisè yo: plan gratis Vercel la limite a 12 fonksyon.)
import { verifyWebhookSignature } from "fazercards";
import { applyStatus, bot, fail, fazer, fulfill, json, resetBotOnDenied, webhookSecret } from "./_lib/autotopup.js";
import { verifyGiftWebhook } from "./_lib/giftaccess.js";

// Gift Access: { event: "order.updated", order_id, reference: "awens-<id kòmand nou>", status }
async function giftWebhook(raw, sig) {
  if (!verifyGiftWebhook(raw, sig)) return fail("bad signature", 401);
  const event = JSON.parse(raw);
  if (event.event && event.event !== "order.updated") return json({ ok: true, ignored: event.event });
  const backend = await bot();
  const ref = /^awens-([A-Za-z0-9]{10,40})$/.exec(String(event.reference || ""))?.[1];
  const order = ref ? await backend.adminGetOrder(ref) : event.order_id ? await backend.adminFindOrderBySupplier(String(event.order_id)) : null;
  if (!order) return json({ ok: true, ignored: true });
  const result = await fulfill(order.id); // li mande Gift Access kòmand lan epi l mete PIN yo
  return json({ ok: true, status: result.status || null });
}

export async function POST(request) {
  const raw = await request.text();
  const giftSig = request.headers.get("x-giftacces-signature") || request.headers.get("x-giftaccess-signature");
  if (giftSig) {
    try {
      return await giftWebhook(raw, giftSig);
    } catch (error) {
      console.error("giftaccess-webhook", error);
      resetBotOnDenied(error);
      return fail("error", 500);
    }
  }
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
