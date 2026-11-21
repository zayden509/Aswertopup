// Lyen parennaj (?ref=AWENS-ID): sit la sonje l pandan vizitè a ap kreye kont li.
// Fichye apa (san zouti admin yo) pou l rete nan premye chajman paj la.
import { backend } from "./backend.js";

const STORE = "awens.ref";

export function rememberReferral() {
  try {
    const code = new URLSearchParams(window.location.search).get("ref")?.toUpperCase();
    if (code && /^[A-HJ-NP-Z2-9]{8}$/.test(code)) localStorage.setItem(STORE, code);
  } catch {
    // navigatè a pa kenbe anyen: pa gen parennaj, sa pa bloke anyen
  }
}

// Apre koneksyon: si kont lan fèk kreye e gen yon lyen parennaj, nou anrejistre l yon sèl fwa
export async function claimStoredReferral(profile) {
  let code = null;
  try {
    code = localStorage.getItem(STORE);
  } catch {
    return;
  }
  if (!code || !profile) return;
  const fresh = profile.created_at && Date.now() - new Date(profile.created_at).getTime() < 20 * 3600000;
  if (fresh && code !== profile.wallet_code) await backend.claimReferral(code).catch(() => {});
  try {
    localStorage.removeItem(STORE);
  } catch {
    // anyen
  }
}

