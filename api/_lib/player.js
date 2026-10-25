// Verifye yon Player ID kote FazerCards anvan kliyan an peye, epi jwenn non jwè a.
// Repons FazerCards la ka chanje fòm: nou chèche non an ak rezilta a nan kle ki pi kouran yo.
import { FazerCardsError } from "fazercards";
import { fazer } from "./autotopup.js";

const normalize = (text) => String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Jwèt FazerCards ka verifye yo (pubg_mobile, free_fire…), nan memwa 1 è
let games = null;
let gamesAt = 0;
async function validationGames() {
  if (!games || Date.now() - gamesAt > 3600000) {
    games = (await fazer().topups.validateIdGames()).items || [];
    gamesAt = Date.now();
  }
  return games;
}

// "Free Fire USA/LATAM" → jwèt "Free Fire"; non ki pi long lan genyen ("PUBG Mobile Lite" anvan "PUBG Mobile")
export async function gameFor(productName) {
  const name = ` ${normalize(productName)} `;
  return (await validationGames())
    .filter((g) => name.includes(` ${normalize(g.name)} `))
    .sort((a, b) => normalize(b.name).length - normalize(a.name).length)[0] || null;
}

const NAME_KEYS = ["nickname", "nick_name", "nick", "player_name", "playerName", "username", "user_name", "account_name", "role_name", "in_game_name"];
const NESTED = ["player", "user", "account", "data", "result", "info"];

function findName(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 3) return null;
  for (const key of NAME_KEYS) if (typeof obj[key] === "string" && obj[key].trim()) return obj[key].trim();
  for (const key of NESTED) {
    const inner = obj[key];
    if (inner && typeof inner === "object") {
      if (typeof inner.name === "string" && inner.name.trim()) return inner.name.trim();
      const found = findName(inner, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findFlag(obj) {
  for (const target of [obj, ...NESTED.map((k) => obj?.[k])]) {
    if (!target || typeof target !== "object") continue;
    const flag = ["valid", "is_valid", "exists", "found", "success"].map((k) => target[k]).find((v) => typeof v === "boolean");
    if (flag !== undefined) return flag;
  }
  return undefined;
}

// { status: "ok", name } · { status: "invalid" } · { status: "unknown" } (jwèt la pa ka verifye, oswa yon erè)
export async function checkPlayer(productName, playerId) {
  const game = await gameFor(productName);
  if (!game) return { status: "unsupported" };
  const required = (game.fields || []).filter((f) => f.required !== false);
  if (required.length > 1) return { status: "unsupported" };
  const key = required[0]?.key || game.fields?.[0]?.key || "player_id";
  try {
    const res = await fazer().topups.validateId({ categoryId: game.category_id, fields: { [key]: playerId } });
    const name = findName(res);
    const flag = findFlag(res);
    if (flag === false) return { status: "invalid" };
    if (name) return { status: "ok", name: name.slice(0, 40) };
    return { status: flag === true ? "ok" : "unknown", name: null };
  } catch (error) {
    // FazerCards di ID a pa egziste
    if (error instanceof FazerCardsError && [400, 404, 422].includes(error.status) && /not\s*found|invalid|incorrect|exist|wrong/i.test(error.message)) {
      return { status: "invalid" };
    }
    throw error;
  }
}
