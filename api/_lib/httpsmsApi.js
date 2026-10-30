// Lè webhook httpSMS la pa rive sou sit la (kle siyati a chanje, paramèt webhook la pa bon…),
// sit la al chèche SMS la dirèkteman sou httpSMS ak kle API a (HTTPSMS_API_KEY nan Vercel).
// Konsa yon kliyan ki peye toujou jwenn depo l, menm si webhook la pa mache.
import { isOperatorSender } from "../../smsParse.js";

// Valè yo kole nan Vercel ka gen espas oswa gimè anplis
const cleanEnv = (value) => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
const BASE = () => (cleanEnv(process.env.HTTPSMS_API_BASE) || "https://api.httpsms.com/v1").replace(/\/+$/, "");
const apiKey = () => cleanEnv(process.env.HTTPSMS_API_KEY);

export const httpsmsApiReady = () => Boolean(apiKey());

// "43699262" → "+50943699262" (httpSMS mande nimewo yo ak kòd peyi a)
export const e164 = (number) => {
  const d = String(number || "").replace(/\D/g, "");
  return d.length === 8 ? `+509${d}` : d ? `+${d}` : "";
};

async function get(path, params) {
  const url = new URL(`${BASE()}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { "x-api-key": apiKey(), Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`httpSMS ${path} ${res.status}`);
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

// SMS operatè yo (NatCash, MonCash, kout nimewo) telefòn boutik la resevwa e ki gen kòd sa a.
// `owners`: nimewo SIM boutik la (NatCash, MonCash). Retounen mesaj httpSMS yo jan yo ye.
export async function httpsmsMessagesWithCode(owners, code) {
  const found = [];
  for (const owner of owners.map(e164).filter(Boolean)) {
    const threads = await get("/message-threads", { owner, skip: 0, limit: 20, is_archived: false, unread_only: false });
    for (const thread of threads.filter((t) => isOperatorSender(t.contact))) {
      const messages = await get("/messages", { owner, contact: thread.contact, skip: 0, limit: 5, query: code });
      found.push(...messages.filter((m) => m.type !== "mobile-terminated" && !m.encrypted && String(m.content || "").includes(code)));
    }
  }
  return found;
}
