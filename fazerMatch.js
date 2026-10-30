// Jwenn pwodwi FazerCards ki koresponn ak yon pake sit la, pou konekte yo an yon sèl kou.
// Dyaman: "310 + BONUS 31" = 341 dyaman → "341 Diamonds". "60 + 6 UC" → "66 UC". "1 000 Robux" → "1000 Robux".
// Pas yo: SEMAINE → Weekly, MOIS → Monthly, "3 MOIS" → "3 Months"…
// Admin nan toujou wè lis la epi li konfime l anvan anyen anrejistre.

// "1 000", "1,000", "1.000" = 1000
const numbers = (text) => (String(text).replace(/(\d)[\s,.](?=\d{3}\b)/g, "$1").match(/\d+/g) || []).map(Number);

// timed: "3 MOIS" chèche yon pwodwi "month" ki gen chif 3 tou
const PASSES = [
  { site: /SEMAINE|WEEK/i, offer: /week/i, avoid: /lite/i, timed: true },
  { site: /\bMOIS\b|MONTH/i, offer: /month/i, timed: true },
  { site: /\bANS?\b|ANN[ÉE]E|YEAR/i, offer: /year|annual/i, timed: true },
  { site: /BOOYAH/i, offer: /booyah/i },
  { site: /LEVEL\s*UP/i, offer: /level\s*up/i },
];

export function matchOffer(pkg, offers) {
  const label = String(pkg.label || "").trim();
  const gem = /^(\d+)\s*\+\s*(?:bonus\s*)?(\d+)\b/i.exec(label);
  if (gem) {
    const base = Number(gem[1]);
    const bonus = Number(gem[2]);
    return offers.find((o) => numbers(o.name).includes(base + bonus))
      || offers.find((o) => { const n = numbers(o.name); return n.includes(base) && n.includes(bonus); })
      || null;
  }
  const pass = PASSES.find((p) => p.site.test(label));
  const fits = (o) => !pass || (pass.offer.test(o.name) && !(pass.avoid && pass.avoid.test(o.name)));
  const n = numbers(label);
  if (pass && (!pass.timed || n.length === 0)) return offers.find(fits) || null;
  return n.length === 1 ? offers.find((o) => fits(o) && numbers(o.name).includes(n[0])) || null : null;
}

// Mo pou chèche pwodwi a kote FazerCards: "Free Fire Pin USA/LATAM" → "free fire",
// "Abonnement Free Fire" → "free fire", "TikTok Coins" → "tiktok"
export function searchWords(productName) {
  return String(productName || "")
    .toLowerCase()
    .replace(/\b(pin|abonnement|gift card|coins|usa\/latam|usa|latam|global)\b/g, " ")
    .replace(/&.*$/, " ")
    .replace(/\s+/g, " ")
    .trim();
}
