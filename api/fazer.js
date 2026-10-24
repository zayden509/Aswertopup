// POST /api/fazer { action, … } — zouti FazerCards pou Panneau admin lan (admin sèlman).
//   status         balans, plan, webhook
//   setup-webhook  konekte webhook la sou adrès sit la epi teste l
//   categories     chèche jwèt yo nan katalòg FazerCards (q)
//   offers         pake ak chan yon jwèt (category_id)
//   sync           mande FazerCards estati yon kòmand (orderId)
//   retry          voye yon kòmand ankò apre yon erè (orderId)
import { bot, callerId, fail, fazer, fazerError, fulfill, json, resetBotOnDenied } from "./_lib/autotopup.js";

// Adrès webhook la: menm domèn admin lan itilize a (domèn sa a sèvi sit la, li pa redirije),
// pou FazerCards pa tonbe sou yon redireksyon ant awenstopup.com ak www.awenstopup.com
function siteOrigin(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  return host ? `https://${host.split(",")[0].trim()}` : "https://www.awenstopup.com";
}

async function status() {
  const fz = fazer();
  const [me, balance, webhook] = await Promise.all([fz.me.get(), fz.balance.get(), fz.webhooks.get().catch(() => null)]);
  return {
    login: me.login,
    plan: me.plan,
    plan_expires_at: me.planExpiresAt || null,
    subscription_active: Boolean(me.subscriptionActive),
    balance: balance.balance,
    currency: balance.currency,
    // Pa janm voye sekrè webhook la bay navigatè a
    webhook: webhook && {
      url: webhook.url,
      enabled: webhook.enabled,
      failures: webhook.consecutive_failures,
      last_failure_reason: webhook.last_failure_reason || null,
    },
  };
}

async function categories(q) {
  const wanted = String(q || "").trim().toLowerCase();
  const items = [];
  for await (const c of fazer().topups.iterCategories({ limit: 100 })) {
    if (!wanted || `${c.name} ${c.category_id}`.toLowerCase().includes(wanted)) items.push({ category_id: c.category_id, name: c.name, note: c.note || "" });
    if (items.length >= 40) break;
  }
  return { items };
}

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const backend = await bot();
    if (!(await backend.adminIsAdmin(uid))) return fail("Admin sèlman.", 403);

    const body = await request.json().catch(() => ({}));
    switch (body.action) {
      case "status":
        return json({ ok: true, ...(await status()) });
      case "setup-webhook": {
        const url = `${siteOrigin(request)}/api/fazer-webhook`;
        await fazer().webhooks.set({ url, enabled: true });
        const test = await fazer().webhooks.test();
        return json({ ok: true, url, test });
      }
      case "categories":
        return json({ ok: true, ...(await categories(body.q)) });
      case "offers": {
        if (typeof body.category_id !== "string") return fail("category_id manke.");
        const res = await fazer().topups.offers(body.category_id);
        return json({ ok: true, name: res.name, note: res.note || "", offers: res.offers || [], fields: res.fields || [] });
      }
      case "sync":
      case "retry": {
        if (typeof body.orderId !== "string") return fail("orderId manke.");
        const order = await backend.adminGetOrder(body.orderId);
        if (!order) return fail("Kòmand sa a pa egziste.", 404);
        // Apre yon erè (oswa si l rete bloke nan "sending"), nou ka eseye ankò. Menm
        // Idempotency-Key la anpeche FazerCards fè kòmand lan de fwa.
        if (body.action === "retry" && order.supplier && !order.supplier.order_id) {
          await backend.adminSetSupplier(order.id, { provider: "fazercards", status: "error", error: "Ap eseye ankò", offer_name: order.supplier.offer_name ?? null });
        }
        const result = await fulfill(order.id);
        return json(result, result.ok ? 200 : 502);
      }
      default:
        return fail("Aksyon sa a pa egziste.");
    }
  } catch (error) {
    console.error("fazer", error);
    resetBotOnDenied(error);
    return fail(fazerError(error), 500);
  }
}
