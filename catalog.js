import { Package } from "lucide-react";
import { PRODUCTS } from "./data.js";

// Katalòg sit la = pwodwi ki nan data.js + pwodwi admin nan kreye nan Panneau admin,
// san sa ki kache yo. Pake admin nan ajoute sou yon pwodwi (product_id) antre nan seksyon
// ki gen menm non an (pa egzanp "Diamants"), sinon yo fè yon seksyon anplis.

const rate = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const DEFAULT_ID_HELP = "Louvri jwèt la epi gade nan pwofil ou: ID (UID) ou se yon nimewo ki anba non ou.";
const GRADIENTS = [
  "from-sky-500 via-indigo-600 to-violet-800",
  "from-orange-400 via-rose-500 to-fuchsia-700",
  "from-emerald-400 via-teal-600 to-slate-900",
  "from-amber-400 via-orange-600 to-red-800",
];

const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Yon pake dyaman ("520 + BONUS 52") afiche menm jan ak lòt kat dyaman yo
function asItem(p, style) {
  const gem = style === "gem" && /^(\d+)\s*\+\s*bonus\s*(\d+)$/i.exec(p.label.trim());
  if (gem) return { id: p.id, label: gem[1], bonus: Number(gem[2]), price: p.price, needsId: p.needs_id };
  return { id: p.id, label: p.label, price: p.price, needsId: p.needs_id };
}

// Seksyon pwodwi a, ak pake admin nan ajoute yo mete nan bon seksyon an
function mergeGroups(productId, base, packages) {
  const extra = Object.values(packages)
    .filter((p) => p.product_id === productId)
    .sort((a, b) => a.sort - b.sort);
  if (!extra.length) return base;
  const groups = base.map((g) => ({ ...g, items: [...g.items] }));
  extra.forEach((p) => {
    const title = p.group?.trim() || "Offres";
    let group = groups.find((g) => sameTitle(g.title, title));
    if (!group) {
      group = { title, style: "offer", items: [] };
      groups.push(group);
    }
    group.items.push(asItem(p, group.style));
  });
  // Kat dyaman yo rete nan lòd pri (520 vin ant 310 ak 1060)
  return groups.map((g) => (g.style === "gem" ? { ...g, items: g.items.sort((a, b) => a.price - b.price) } : g));
}

// Si yon pake mande ID, paj la dwe montre bwat Player ID a
function withIdField(product) {
  const needsId = product.groups?.some((g) => g.items.some((i) => i.needsId));
  return needsId && !product.playerId ? { ...product, playerId: true, playerIdHelp: product.playerIdHelp || DEFAULT_ID_HELP } : product;
}

// Foto admin nan mete sou yon pwodwi ranplase foto (oswa ikòn) pa defo a
function withImage(product, images) {
  const image = images?.[product.id];
  return image ? { ...product, image, bg: undefined, defaultImage: product.image || null } : product;
}

// Tout pwodwi yo, ak `hidden: true` sou sa ki kache yo (pou Panneau admin lan)
export function allProducts(packages, custom) {
  const hidden = new Set(custom.hidden);
  const builtIn = PRODUCTS.map((p) => {
    // Pwodwi Finans: kat la montre to du jou a lè admin nan aktive l
    const ex = p.exchange && custom.exchange?.[p.id];
    if (p.exchange) return ex?.available ? { ...p, tagline: `1 ${ex.currency} = ${rate.format(ex.rate)} HTG` } : p;
    const groups = mergeGroups(p.id, p.groups || [], packages);
    return groups === (p.groups || []) ? p : withIdField({ ...p, groups });
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
    groups: mergeGroups(c.id, [], packages),
  }));
  return [...builtIn.map((p) => withImage(p, custom.images)), ...added]
    .map((p) => (hidden.has(p.id) ? { ...p, hidden: true } : p));
}

export function buildCatalog(packages, custom) {
  return allProducts(packages, custom).filter((p) => !p.hidden);
}

// Pwodwi yon kòmand (pake a nan youn nan seksyon li yo, oswa pwodwi Finans lan menm)
export function productForPackage(packageId, catalog) {
  return catalog.find((p) => p.id === packageId || p.groups?.some((g) => g.items.some((i) => i.id === packageId)));
}
