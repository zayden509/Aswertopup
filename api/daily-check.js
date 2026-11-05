// GET /api/daily-check — Vercel Cron rele l chak maten (vercel.json): rezime 24 dènye è yo voye
// bay pwopriyetè a sou Telegram, ak verifikasyon yo (SMS ki pa rive, balans FazerCards).
// Si CRON_SECRET nan Vercel, se sèlman Vercel Cron ki ka rele l.
import { SetupError, bot, fail, fazer, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { alert, checkFazerBalance, checkSmsSilence, HOUR } from "./_lib/alert.js";
import { mailReady, sendDailyReport } from "./_lib/mail.js";

const htg = (n) => `${new Intl.NumberFormat("fr-FR").format(n)} HTG`;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return fail("unauthorized", 401);
  try {
    const backend = await bot();
    const to = new Date();
    const from = new Date(to.getTime() - 24 * HOUR);
    const { orders, deposits, newCustomers } = await backend.adminPeriodData(from, to);
    const sold = orders.filter((o) => o.status !== "refused" && o.status !== "unpaid");
    const open = orders.filter((o) => o.status === "pending" || o.status === "processing");
    const confirmed = deposits.filter((d) => d.status === "completed");
    const waiting = deposits.filter((d) => d.status === "pending");
    const sum = (list, key) => list.reduce((total, x) => total + Number(x[key] || 0), 0);
    const lines = [
      "📊 24 dènye è yo:",
      `• ${sold.length} kòmand · ${htg(sum(sold, "price"))}`,
      `• ${confirmed.length} depo konfime · ${htg(sum(confirmed, "amount"))}`,
    ];
    if (newCustomers) lines.push(`• 👤 ${newCustomers} nouvo kliyan`);
    if (open.length) lines.push(`• ⏳ ${open.length} kòmand poko livre`);
    if (waiting.length) lines.push(`• ⏳ ${waiting.length} depo ap tann ou`);
    // 3 pwodwi ki vann plis yo
    const top = Object.entries(sold.reduce((m, o) => ({ ...m, [o.product_name]: (m[o.product_name] || 0) + Number(o.price || 0) }), {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (top.length) lines.push("", "🏆 Pi bon pwodwi yo:", ...top.map(([name, total], i) => `${i + 1}. ${name} · ${htg(total)}`));
    // Yon sèl rezime pa jou, menm si yo rele paj la plizyè fwa
    const sent = await alert(backend, lines.join("\n"), { key: "daily", everyMs: 20 * HOUR });
    // Menm rezime a pa imèl bay tout admin yo (si imèl yo konfigire), yon fwa pa jou
    if (mailReady() && (await backend.adminClaimOrderEmail(`daily_${to.toISOString().slice(0, 10)}`))) {
      const botEmail = String(process.env.BOT_EMAIL || "").trim().toLowerCase();
      const admins = (await backend.adminListAdminEmails().catch(() => [])).filter((e) => e.toLowerCase() !== botEmail);
      await sendDailyReport(admins, lines).catch((error) => console.error("daily email", error));
    }
    await checkSmsSilence(backend, 12);
    await backend.adminSyncDeliveredCount().catch(() => {});
    if (process.env.FAZER_API_KEY) await checkFazerBalance(backend, fazer);
    return json({ ok: true, sent });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("daily-check", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
