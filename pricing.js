// Rabè fidelite: chak rang (Bronze, Argent, Or, Diamant) bay yon pousantaj sou chak achte ak Wallet.
// Pwopriyetè a chwazi pousantaj yo (settings/loyalty). Menm kalkil la nan firebase/firestore.rules
// (loyaltyPct ak validNewOrder): pa chanje youn san lòt. Yon kòd pwomo ranplase rabè fidelite a.
import { RANKS } from "./ranks.js";

// Kle chak rang nan settings/loyalty, nan menm lòd ak RANKS
export const LOYALTY_KEYS = ["bronze", "argent", "or", "diamant"];
export const LOYALTY_MAX = 20;
export const LOYALTY_OFF = { bronze: 0, argent: 0, or: 0, diamant: 0 };

// Pousantaj rabè pou yon kliyan ki deja depanse `spent` goud
export function loyaltyPercent(spent, settings = LOYALTY_OFF) {
  const total = Number(spent) || 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (total >= RANKS[i].min) return Number(settings?.[LOYALTY_KEYS[i]]) || 0;
  }
  return 0;
}

// Pri apre rabè a (goud antye, arondi anfavè kliyan an menm jan ak kòd pwomo yo)
export const discounted = (price, percent) => price - Math.floor((price * percent) / 100);
