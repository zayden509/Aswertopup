// Jwenn pwodwi FazerCards ki koresponn ak yon pake sit la, pou konekte yo an yon sèl kou.
// Dyaman: "310 + BONUS 31" = 341 dyaman → "341 Diamonds". Pas yo: SEMAINE → Weekly, MOIS → Monthly…
// Admin nan toujou wè lis la epi li konfime l anvan anyen anrejistre.

const numbers = (text) => (String(text).match(/\d+/g) || []).map(Number);

const PASSES = [
  { site: /SEMAINE|WEEK/i, offer: /week/i, avoid: /lite/i },
  { site: /\bMOIS\b|MONTH/i, offer: /month/i },
  { site: /BOOYAH/i, offer: /booyah/i },
  { site: /LEVEL\s*UP/i, offer: /level\s*up/i },
];

export function matchOffer(pkg, offers) {
  const label = String(pkg.label || "").trim();
  const gem = /^(\d+)\s*\+\s*bonus\s*(\d+)$/i.exec(label);
  if (gem) {
    const base = Number(gem[1]);
    const bonus = Number(gem[2]);
    return offers.find((o) => numbers(o.name).includes(base + bonus))
      || offers.find((o) => { const n = numbers(o.name); return n.includes(base) && n.includes(bonus); })
      || null;
  }
  const pass = PASSES.find((p) => p.site.test(label));
  if (pass) return offers.find((o) => pass.offer.test(o.name) && !(pass.avoid && pass.avoid.test(o.name))) || null;
  const n = numbers(label);
  return n.length === 1 ? offers.find((o) => numbers(o.name).includes(n[0])) || null : null;
}
