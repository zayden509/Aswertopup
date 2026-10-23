import { Package } from "lucide-react";
import { PRODUCTS } from "./data.js";

// Katalòg sit la = pwodwi ki nan data.js + pwodwi admin nan kreye nan Panneau admin,
// san sa ki kache yo. Pake admin nan ajoute sou yon pwodwi (product_id) parèt
// kòm yon seksyon anplis sou paj pwodwi a.

const rate = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const DEFAULT_ID_HELP = "Louvri jwèt la epi gade nan pwofil ou: ID (UID) ou se yon nimewo ki anba non ou.";
const GRADIENTS = [
  "from-sky-500 via-indigo-600 to-violet-800",
  "from-orange-400 via-rose-500 to-fuchsia-700",
  "from-emerald-400 via-teal-600 to-slate-900",
  "from-amber-400 via-orange-600 to-red-800",
];

function extraGroups(productId, packages) {
  const groups = new Map();
  Object.values(packages)
    .filter((p) => p.product_id === productId)
    .sort((a, b) => a.sort - b.sort)
    .forEach((p) => {
      const title = p.group || "Offres";
      if (!groups.has(title)) groups.set(title, { title, style: "offer", items: [] });
      groups.get(title).items.push({ id: p.id, label: p.label, price: p.price, needsId: p.needs_id });
    });
  return [...groups.values()];
}

// Si yon pake mande ID, paj la dwe montre bwat Player ID a
function withIdField(product) {
  const needsId = product.groups?.some((g) => g.items.some((i) => i.needsId));
  return needsId && !product.playerId ? { ...product, playerId: true, playerIdHelp: product.playerIdHelp || DEFAULT_ID_HELP } : product;
}

// Tout pwodwi yo, ak `hidden: true` sou sa ki kache yo (pou Panneau admin lan)
export function allProducts(packages, custom) {
  const hidden = new Set(custom.hidden);
  const builtIn = PRODUCTS.map((p) => {
    // Pwodwi Finans: kat la montre to du jou a lè admin nan aktive l
    const ex = p.exchange && custom.exchange?.[p.id];
    if (p.exchange) return ex?.available ? { ...p, tagline: `1 ${ex.currency} = ${rate.format(ex.rate)} HTG` } : p;
    const extra = extraGroups(p.id, packages);
    return extra.length ? withIdField({ ...p, groups: [...(p.groups || []), ...extra] }) : p;
  });
  const added = custom.products.map((c, i) => withIdField({
    id: c.id,
    name: c.name,
    category: c.category,
    isNew: c.is_new,
    image: c.image || undefined,
    Icon: Package,
    gradient: GRADIENTS[i % GRADIENTS.length],
    playerId: c.player_id,
    playerIdHelp: DEFAULT_ID_HELP,
    custom: true,
    raw: c,
    groups: extraGroups(c.id, packages),
  }));
  return [...builtIn, ...added].map((p) => (hidden.has(p.id) ? { ...p, hidden: true } : p));
}

export function buildCatalog(packages, custom) {
  return allProducts(packages, custom).filter((p) => !p.hidden);
}
