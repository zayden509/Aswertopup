// POST /api/fulfill { orderId } — sit la rele l touswit apre yon acha.
// Si pake a otomatik, kòmand lan ale kote FazerCards; sinon pa gen anyen ki fèt.
// { orderId, placed: true }: kliyan an fèk pase kòmand lan, nou voye imèl kòmand lan
// bay kliyan an ak admin nan (yon sèl fwa pou chak kòmand).
import { SetupError, bot, callerId, fail, fazerError, fulfill, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { mailReady, sendOrderEmails } from "./_lib/mail.js";

const EMAIL_WINDOW = 15 * 60 * 1000; // pa voye imèl pou yon kòmand ki gen plis pase 15 minit

async function orderEmails(backend, order) {
  try {
    if (!mailReady() || order.kind === "exchange") return;
    if (Date.now() - Date.parse(order.created_at) > EMAIL_WINDOW) return;
    if (!(await backend.adminClaimOrderEmail(order.id))) return;
    const [customer, admins] = await Promise.all([
      backend.adminGetUser(order.user_id),
      backend.adminListAdminEmails().catch(() => []),
    ]);
    // Kont bot sèvè a se yon admin tou: li pa bezwen imèl
    const botEmail = String(process.env.BOT_EMAIL || "").trim().replace(/^(["'])(.*)\1$/, "$2").toLowerCase();
    await sendOrderEmails(order, customer, admins.filter((e) => e.toLowerCase() !== botEmail));
  } catch (error) {
    console.error("order emails", error);
  }
}

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { orderId, placed } = await request.json().catch(() => ({}));
    if (typeof orderId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(orderId)) return fail("Kòmand lan pa bon.");

    const backend = await bot();
    const order = await backend.adminGetOrder(orderId);
    if (!order) return fail("Kòmand sa a pa egziste.", 404);
    if (order.user_id !== uid && !(await backend.adminIsAdmin(uid))) return fail("Se pa kòmand ou.", 403);

    // Imèl yo pati an menm tan ak livrezon an; nou tann yo menm si livrezon an echwe
    const emails = placed === true && order.user_id === uid ? orderEmails(backend, order) : null;
    let result;
    try {
      result = await fulfill(orderId);
    } finally {
      await emails;
    }
    return json(result, result.ok ? 200 : 502);
  } catch (error) {
    // Livrezon otomatik la poko konfigire (varyab Vercel yo): kòmand lan rete manyèl, san erè pou kliyan an
    if (error instanceof SetupError) return json({ ok: true, auto: false, setup: false });
    console.error("fulfill", error);
    resetBotOnDenied(error);
    return fail(fazerError(error), 500);
  }
}
