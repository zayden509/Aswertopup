// GET /api/daily-check — Vercel Cron rele l chak maten (vercel.json): rezime 24 dènye è yo voye
// bay pwopriyetè a sou Telegram, ak verifikasyon yo (SMS ki pa rive, balans FazerCards).
// Si CRON_SECRET nan Vercel, se sèlman Vercel Cron ki ka rele l.
import { SetupError, bot, fail, fazer, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { alert, checkFazerBalance, checkSmsSilence, HOUR } from "./_lib/alert.js";

const htg = (n) => `${new Intl.NumberFormat("fr-FR").format(n)} HTG`;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return fail("unauthorized", 401);
  try {
    const backend = await bot();
    const to = new Date();
    const from = new Date(to.getTime() - 24 * HOUR);
    const { orders, deposits } = await backend.adminPeriodData(from, to);
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
    if (open.length) lines.push(`• ⏳ ${open.length} kòmand poko livre`);
    if (waiting.length) lines.push(`• ⏳ ${waiting.length} depo ap tann ou`);
    // Yon sèl rezime pa jou, menm si yo rele paj la plizyè fwa
    const sent = await alert(backend, lines.join("\n"), { key: "daily", everyMs: 20 * HOUR });
    await checkSmsSilence(backend, 12);
    if (process.env.FAZER_API_KEY) await checkFazerBalance(backend, fazer);
    return json({ ok: true, sent });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("daily-check", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
