// Alèt Telegram pou pwopriyetè a: yon bot Telegram (TELEGRAM_BOT_TOKEN nan Vercel) voye yon mesaj
// lè yon bagay bezwen li (FazerCards echwe, balans ap fini, SMS yo pa rive, yon depo ap tann li…).
// Pwopriyetè a konekte kont Telegram li nan Panneau admin → Paramèt (chat la anrejistre nan private/alerts).
// Valè yo kole nan Vercel ka gen espas oswa gimè anplis
const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();

const API = () => (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");
const token = () => cleanEnv(process.env.TELEGRAM_BOT_TOKEN);

export const telegramReady = () => Boolean(token());

export async function telegram(method, body) {
  const res = await fetch(`${API()}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(6000),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description || `Telegram ${res.status}`);
  return data.result;
}

// Voye yon alèt. `key` + `everyMs`: menm alèt la pa voye plis pase yon fwa nan peryòd sa a.
// Yon alèt pa janm kraze sa sèvè a t ap fè a (erè yo rete nan log yo).
export async function alert(backend, text, { key = null, everyMs = 0 } = {}) {
  try {
    if (!telegramReady()) return false;
    const settings = await backend.adminGetAlerts();
    if (!settings.chat_id) return false;
    if (key && everyMs && Date.now() - (settings.sent?.[key] || 0) < everyMs) return false;
    if (key) await backend.adminMarkAlertSent(key);
    await telegram("sendMessage", { chat_id: settings.chat_id, text: `Awens Topup · ${text}`, disable_web_page_preview: true });
    return true;
  } catch (error) {
    console.error("alert", error);
    return false;
  }
}

const HOUR = 3600000;

// Sit la pa resevwa okenn SMS NatCash/MonCash depi lontan: telefòn httpSMS la ka etenn
export async function checkSmsSilence(backend, hours = 3) {
  const seen = await backend.adminSmsSeen().catch(() => ({}));
  const last = Math.max(...["natcash", "moncash"].map((m) => (seen[m] ? new Date(seen[m]).getTime() : 0)));
  if (!last || Date.now() - last < hours * HOUR) return false;
  const ago = Math.round((Date.now() - last) / HOUR);
  return alert(backend, `📵 Sit la pa resevwa okenn SMS NatCash/MonCash depi ${ago} è. Kliyan yo p ap ka depoze: tcheke telefòn httpSMS la (batri, entènèt, aplikasyon an louvri).`, { key: "sms_silent", everyMs: 3 * HOUR });
}

// Balans FazerCards ap fini: kòmand otomatik yo ap kanpe
export async function checkFazerBalance(backend, fazer, min = 10) {
  try {
    const { balance, currency } = await fazer().balance.get();
    if (Number(balance) >= min) return false;
    return alert(backend, `💸 Balans FazerCards ou se ${Number(balance).toFixed(2)} ${currency || "USD"}. Rechaje l pou kòmand otomatik yo pa kanpe.`, { key: "low_balance", everyMs: 6 * HOUR });
  } catch {
    return false;
  }
}

export { HOUR };
