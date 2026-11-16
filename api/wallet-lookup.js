// POST /api/wallet-lookup { code } — non piblik moun ki gen yon AWENS-ID (pou fenèt "Envoyer").
// Dezyèm chemen lè telefòn kliyan an pa rive li l dirèkteman nan Firebase. Kliyan konekte sèlman.
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";

const hits = new Map();
function tooMany(uid) {
  const now = Date.now();
  const recent = (hits.get(uid) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(uid, recent);
  return recent.length > 30;
}

export async function POST(request) {
  try {
    const uid = await callerId(request);
    if (!uid) return fail("Konekte anvan.", 401);
    if (tooMany(uid)) return fail("Twòp demann. Tann yon minit.", 429);
    const { code } = await request.json().catch(() => ({}));
    const id = String(code || "").toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(id)) return json({ ok: true, name: null });
    const backend = await bot();
    return json({ ok: true, name: await backend.lookupWallet(id) });
  } catch (error) {
    if (error instanceof SetupError) return fail(error.message, 503);
    console.error("wallet-lookup", error);
    resetBotOnDenied(error);
    return fail("error", 500);
  }
}
