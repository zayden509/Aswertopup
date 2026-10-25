// POST /api/player-check { product, playerId } — paj pwodwi a mande si ID jwè a egziste,
// epi li montre non jwè a ("Joueur vérifié : …") anvan kliyan an peye.
import { SetupError, fail, json } from "./_lib/autotopup.js";
import { checkPlayer } from "./_lib/player.js";

// Ti limit pa adrès IP (chak sèvè), ak memwa 10 minit pou menm ID a
const hits = new Map();
const cache = new Map();
const LIMIT = 30;
const WINDOW = 60000;

function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export async function POST(request) {
  const { product, playerId } = await request.json().catch(() => ({}));
  if (typeof product !== "string" || product.length > 80 || typeof playerId !== "string" || !/^\d{6,15}$/.test(playerId)) {
    return fail("ID a pa bon.");
  }
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (tooMany(ip)) return json({ ok: true, status: "unknown" });

  const key = `${product}|${playerId}`;
  const saved = cache.get(key);
  if (saved && Date.now() - saved.at < 600000) return json({ ok: true, ...saved.result });
  try {
    const result = await checkPlayer(product, playerId);
    if (result.status !== "unknown") cache.set(key, { at: Date.now(), result });
    return json({ ok: true, ...result });
  } catch (error) {
    // FazerCards pa disponib oswa poko konfigire: paj la pa bloke kliyan an
    if (!(error instanceof SetupError)) console.error("player-check", error);
    return json({ ok: true, status: "unknown" });
  }
}
