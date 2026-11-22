// Ti demann kliyan yo (yon sèl fonksyon Vercel pou rete anba limit 12 fonksyon plan gratis la):
//   GET  /api/client            → kle piblik notifikasyon push yo (VAPID)
//   GET  /api/client?catalog=1  → katalòg la (ak kach CDN)
//   POST /api/client { code }   → non piblik moun ki gen AWENS-ID sa a (fenèt "Envoyer")
import { SetupError, bot, callerId, fail, json, resetBotOnDenied } from "./_lib/autotopup.js";
import { pushKeys } from "./_lib/push.js";

// GET /api/client?catalog=1 → tout katalòg la (pri, pwodwi, foto, to…). Vercel kenbe repons lan
// an kach 60 segonn: Firebase li l yon fwa pa minit olye yon fwa pou chak vizitè.
async function catalogResponse() {
  try {
    const data = await (await bot()).catalogSnapshot();
    return Response.json({ ok: true, ...data }, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("catalog", error);
    resetBotOnDenied(error);
    return fail("error", error instanceof SetupError ? 503 : 500);
  }
}

export async function GET(request) {
  if (new URL(request.url).searchParams.has("catalog")) return catalogResponse();
  try {
    const { publicKey } = await pushKeys(await bot());
    return json({ ok: true, publicKey }, 200);
  } catch (error) {
    if (error instanceof SetupError) return fail("Notifikasyon yo poko disponib.", 503);
    console.error("push-key", error);
    return fail("error", 500);
  }
}

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
