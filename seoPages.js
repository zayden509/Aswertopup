// Paj pou Google: yon adrès pou chak pwodwi popilè (awenstopup.com/recharge/free-fire…).
// vite.config.js kreye yon kopi index.html pou chak paj ak pwòp tit ak deskripsyon l,
// e App.jsx louvri pwodwi a lè yon moun rive sou adrès la. Pa gen imaj isit la (Node li fichye a).
const pay = "Payez en gourdes avec MonCash ou NatCash, livraison rapide.";
const page = (slug, product, name, extra) => ({
  slug, product, name,
  title: `Recharge ${name} Haïti · ${extra} | Awens Topup`,
  description: `Achetez ${name} en Haïti sur Awens Topup. ${pay} Rechaj ${name} an goud.`,
});

export const SEO_PAGES = [
  page("free-fire", "free-fire", "Free Fire", "Diamants en gourdes"),
  page("free-fire-abonnement", "free-fire-abonnement", "Free Fire Abonnement", "Semaine, Mois, Booyah Pass"),
  page("pubg-mobile", "pubg", "PUBG Mobile", "UC en gourdes"),
  page("call-of-duty-mobile", "codm", "Call of Duty Mobile", "CP en gourdes"),
  page("mobile-legends", "mlbb", "Mobile Legends", "Diamants en gourdes"),
  page("blood-strike", "blood-strike", "Blood Strike", "Gold en gourdes"),
  page("roblox", "roblox", "Roblox", "Robux en gourdes"),
  page("efootball", "efootball", "eFootball", "Coins en gourdes"),
  page("ea-fc-mobile", "fc-mobile", "EA FC Mobile", "FC Points en gourdes"),
  page("dream-league-soccer", "dls", "Dream League Soccer", "Diamants en gourdes"),
  page("netflix", "netflix", "Netflix", "Abonnement en gourdes"),
  page("spotify", "spotify", "Spotify", "Premium en gourdes"),
  page("google-play", "google-play", "Google Play", "Carte cadeau en gourdes"),
  page("app-store-itunes", "app-store", "App Store & iTunes", "Carte cadeau en gourdes"),
  page("playstation", "playstation", "PlayStation", "Carte cadeau PSN en gourdes"),
  page("tiktok-coins", "tiktok", "TikTok Coins", "Coins en gourdes"),
  page("paypal", "paypal", "PayPal", "Recharger son compte depuis Haïti"),
  page("cash-app", "cash-app", "Cash App", "Recharger depuis Haïti"),
];

export const seoPageForPath = (pathname) => {
  const m = /^\/recharge\/([a-z0-9-]+)\/?$/.exec(pathname || "");
  return m ? SEO_PAGES.find((p) => p.slug === m[1]) || null : null;
};
