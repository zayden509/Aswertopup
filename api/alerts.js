// POST /api/alerts { action } — pwopriyetè a konekte alèt Telegram yo (Panneau admin → Paramèt).
//   connect  jwenn chat Telegram pwopriyetè a (li fèk peze Start sou bot la), anrejistre l, voye yon tès
//   test     voye yon mesaj tès
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { alert, telegram, telegramReady } from "./_lib/alert.js";

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    const { action } = await request.json().catch(() => ({}));
    const backend = await bot();
    if (!(await backend.adminIsOwner(uid))) return fail("Se pwopriyetè a sèlman ki ka chanje alèt yo.", 403);
    if (!telegramReady()) return fail("TELEGRAM_BOT_TOKEN poko mete nan Vercel (Settings → Environment Variables), oswa ou poko fè Redeploy.");

    if (action === "connect") {
      const me = await telegram("getMe");
      const updates = await telegram("getUpdates", { allowed_updates: ["message"] });
      const chat = [...updates].reverse().map((u) => u.message?.chat).find((c) => c?.type === "private");
      if (!chat) return fail(`Louvri bot ou a nan Telegram (@${me.username}), peze Start, epi eseye ankò.`);
      const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || "Telegram";
      await backend.adminSetAlerts({ chat_id: chat.id, chat_name: name, bot_name: me.username, connected_at: new Date().toISOString() });
      await alert(backend, `✅ Alèt yo konekte. W ap resevwa yon mesaj isit la lè yon bagay bezwen ou.`);
      return json({ ok: true, chat_name: name, bot_name: me.username });
    }
    if (action === "test") {
      const sent = await alert(backend, "🔔 Tès: alèt yo mache.");
      return sent ? json({ ok: true }) : fail("Mesaj la pa ale. Peze \"Konekte Telegram\" ankò.");
    }
    return fail("Aksyon sa a pa egziste.");
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("alerts", error);
    resetBotOnDenied(error);
    return fail(`Telegram: ${error.message}`, 502);
  }
}
